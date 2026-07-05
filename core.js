/* ===================================================================
   CORE — data layer, authentication, navigation, shared helpers.
   Used by every tab module.
=================================================================== */

/* ---------- Firebase or local fallback ---------- */
let db = null, auth = null, USE_FB = false;
try {
  if (FIREBASE_CONFIG.projectId) {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    auth = firebase.auth();
    USE_FB = true;
  }
} catch (e) { console.warn("Firebase init failed, using local mode", e); }

if (!USE_FB) {
  const b = document.getElementById('cfgBanner');
  if (b) b.style.display = 'block';
}

/* ---------- Anonymous device id (for likes) ---------- */
const DEVICE = (function () {
  let d = localStorage.getItem('grt_device');
  if (!d) { d = 'd' + Math.abs(Math.random() * 1e9 | 0) + (performance.now() | 0); localStorage.setItem('grt_device', d); }
  return d;
})();

/* ---------- Local mock store (only when Firebase is off) ---------- */
const LS = {
  get(k) { try { return JSON.parse(localStorage.getItem('grt_' + k) || '[]'); } catch (e) { return []; } },
  set(k, v) { localStorage.setItem('grt_' + k, JSON.stringify(v)); }
};
function uid() { return 'x' + (Math.random() * 1e9 | 0).toString(36) + Date.now().toString(36); }

/* ---------- Generic data access (same API for both backends) ---------- */
const Store = {
  async list(col) {
    if (USE_FB) {
      const snap = await db.collection(col).orderBy('createdAt', 'desc').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return LS.get(col).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },
  async add(col, data) {
    const rec = { ...data, createdAt: Date.now() };
    if (USE_FB) { const ref = await db.collection(col).add(rec); return ref.id; }
    const arr = LS.get(col); rec.id = uid(); arr.push(rec); LS.set(col, arr); return rec.id;
  },
  async update(col, id, data) {
    if (USE_FB) { await db.collection(col).doc(id).update(data); return; }
    const arr = LS.get(col); const i = arr.findIndex(x => x.id === id); if (i > -1) { arr[i] = { ...arr[i], ...data }; LS.set(col, arr); }
  },
  async remove(col, id) {
    if (USE_FB) { await db.collection(col).doc(id).delete(); return; }
    LS.set(col, LS.get(col).filter(x => x.id !== id));
  },
  // Read/write a single fixed document (used for app settings like event time)
  async getDoc(col, id) {
    if (USE_FB) { const d = await db.collection(col).doc(id).get(); return d.exists ? { id: d.id, ...d.data() } : null; }
    return LS.get(col).find(x => x.id === id) || null;
  },
  async setDoc(col, id, data) {
    if (USE_FB) { await db.collection(col).doc(id).set(data, { merge: true }); return; }
    const arr = LS.get(col); const i = arr.findIndex(x => x.id === id);
    if (i > -1) arr[i] = { ...arr[i], ...data, id }; else arr.push({ ...data, id });
    LS.set(col, arr);
  }
};

/* ---------- Auth ----------
   With Firebase: admin = a signed-in Firebase Auth user (server-enforced).
   Local demo mode: falls back to a simple sessionStorage flag. */
function isAdmin() {
  if (USE_FB) return !!(auth && auth.currentUser);
  return sessionStorage.getItem('grt_admin') === '1';
}

function refreshAuthUI() {
  const b = document.getElementById('authBtn');
  b.textContent = isAdmin() ? 'Logout' : 'Login';
  // toggle admin-only cards (present after each tab renders its markup)
  ['uploadCard', 'stuAddCard', 'evAddCard', 'hlAddCard', 'eventEditCard'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isAdmin() ? 'block' : 'none';
  });
  // reload lists so admin controls appear/disappear — but only for tabs whose
  // data has already been loaded at least once (keeps lazy-loading effective)
  if (TAB_LOADED.gallery && window.renderGallery) renderGallery();
  if (TAB_LOADED.students) { if (window.loadStudents) loadStudents(); else if (window.renderStudents) renderStudents(); }
  if (TAB_LOADED.events) { if (window.loadEvents) loadEvents(); else if (window.renderEvents) renderEvents(); }
  if (TAB_LOADED.highlights) { if (window.loadHighlights) loadHighlights(); else if (window.renderHighlights) renderHighlights(); }

  // (re)start or stop the idle auto-logout timer to match the new auth state
  if (typeof resetIdle === 'function') resetIdle();
}

function onAuthClick() {
  if (isAdmin()) {
    if (USE_FB) { auth.signOut(); }          // onAuthStateChanged() refreshes the UI
    else { sessionStorage.removeItem('grt_admin'); refreshAuthUI(); }
    toast('Logged out');
  } else openOv('loginOv');
}

async function doLogin() {
  const u = document.getElementById('lu').value.trim(), p = document.getElementById('lp').value;
  if (USE_FB) {
    // Username must match; password is verified by Firebase Auth (server-side)
    if (u !== ADMIN.user) return toast('Invalid credentials ❌');
    try {
      await auth.signInWithEmailAndPassword(ADMIN.email, p);
      closeOv('loginOv');
      document.getElementById('lu').value = ''; document.getElementById('lp').value = '';
      toast('Welcome, admin! ✨');            // onAuthStateChanged() refreshes the UI
    } catch (e) {
      console.warn(e);
      toast('Invalid credentials ❌');
    }
    return;
  }
  // Local demo mode
  if (u === ADMIN.user && p === ADMIN.pass) {
    sessionStorage.setItem('grt_admin', '1'); closeOv('loginOv');
    document.getElementById('lu').value = ''; document.getElementById('lp').value = '';
    toast('Welcome, admin! ✨'); refreshAuthUI();
  } else toast('Invalid credentials ❌');
}

// Keep the UI in sync when Firebase auth state changes (login/logout/page reload)
if (USE_FB) auth.onAuthStateChanged(() => refreshAuthUI());

/* ---------- Auto-logout after inactivity (admin only) ----------
   NOTE: a plain setTimeout is not reliable here — mobile browsers/OSes
   suspend JS timers while the screen is locked or the tab is backgrounded,
   so a countdown started before that would often never fire, leaving the
   admin logged in indefinitely. Instead we persist a "last active"
   timestamp and compare real elapsed time: on an interval while the page
   is open, AND immediately whenever the tab/app becomes visible or
   regains focus again (which is exactly when a suspended timer would have
   been skipped). */
const IDLE_MS = (typeof IDLE_MINUTES === 'number' ? IDLE_MINUTES : 3) * 60 * 1000;
const LAST_ACTIVE_KEY = 'grt_lastActive';

function markActive() {
  try { localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now())); } catch (e) {}
}

function doIdleLogout() {
  if (USE_FB) auth.signOut();
  else { sessionStorage.removeItem('grt_admin'); refreshAuthUI(); }
  toast('Logged out — inactive for ' + (IDLE_MS / 60000) + ' min');
}

function checkIdle() {
  if (!isAdmin()) return;
  let last = 0;
  try { last = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || '0', 10); } catch (e) {}
  if (!last) { markActive(); return; }
  if (Date.now() - last >= IDLE_MS) doIdleLogout();
}

// Called on every user interaction, and once after login/logout (via refreshAuthUI)
function resetIdle() {
  markActive();
}

['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(ev =>
  document.addEventListener(ev, resetIdle, { passive: true }));

// Regular poll while the page is open (covers normal idling on the same screen)
setInterval(checkIdle, 5000);

// Catch up immediately when the phone wakes / tab regains focus — this is the
// case a setTimeout-based timer misses, since it was paused while away.
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkIdle(); });
window.addEventListener('focus', checkIdle);

markActive();

/* ---------- Navigation (lazy-loads each tab's data on first visit only,
   so a visitor who never opens e.g. Students never pays for those reads) ---------- */
const TAB_LOADED = { gallery: false, students: false, events: false, highlights: false };

function ensureTabLoaded(tab) {
  if (TAB_LOADED[tab] === undefined || TAB_LOADED[tab]) return; // 'home' or already loaded
  TAB_LOADED[tab] = true;
  if (tab === 'gallery' && window.renderGallery) renderGallery();
  else if (tab === 'students' && window.loadStudents) loadStudents();
  else if (tab === 'events' && window.loadEvents) loadEvents();
  else if (tab === 'highlights' && window.loadHighlights) loadHighlights();
}

function go(tab) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === tab));
  document.querySelectorAll('nav.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  ensureTabLoaded(tab);
}

/* ---------- Modals & toast ---------- */
function openOv(id) { document.getElementById(id).classList.add('open'); }
function closeOv(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.ov').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); }));

let toastT;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- Small utilities ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function fmt(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }) + ' · ' +
         d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
}