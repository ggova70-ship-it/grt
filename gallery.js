/* ===================================================================
   GALLERY TAB
   - View-only users: see photos, like, comment, download
   - Admin: upload & delete photos, delete comments
=================================================================== */

document.getElementById('gallery').innerHTML = `
  <div class="sec-title">
    <h2>📸 Gallery</h2>
    <span class="pill" id="galCount">0 photos</span>
  </div>
  <div class="card" id="uploadCard" style="display:none">
    <h3>Upload a photo</h3>
    <div class="field"><input type="file" id="file" accept="image/*"></div>
    <div class="field"><input type="text" id="cap" placeholder="Caption (optional)"></div>
    <button class="btn block" id="upBtn" onclick="uploadPhoto()">⬆ Upload</button>
  </div>
  <div id="galWrap"><div class="loader">Loading photos…</div></div>`;

let GAL = [];

/* Resize/compress in the browser so images fit in Firestore (free tier). */
function resizeImage(file, max = 1100, quality = .82) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > h && w > max) { h = h * max / w; w = max; }
        else if (h > max) { w = w * max / h; h = max; }
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        res(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = rej; img.src = r.result;
    };
    r.onerror = rej; r.readAsDataURL(file);
  });
}

async function uploadPhoto() {
  if (!isAdmin()) return toast('Login required');
  const f = document.getElementById('file').files[0];
  if (!f) return toast('Pick an image first');
  const btn = document.getElementById('upBtn'); btn.textContent = 'Uploading…'; btn.disabled = true;
  try {
    const data = await resizeImage(f);
    const rec = { url: data, caption: document.getElementById('cap').value.trim(), likedBy: [], comments: [] };
    const id = await Store.add('gallery', rec);
    GAL.unshift({ id, ...rec, createdAt: Date.now() });
    document.getElementById('file').value = ''; document.getElementById('cap').value = '';
    toast('Photo uploaded ✅'); paintGallery();
  } catch (e) { console.error(e); toast('Upload failed'); }
  btn.textContent = '⬆ Upload'; btn.disabled = false;
}

async function renderGallery() {
  const wrap = document.getElementById('galWrap');
  if (!wrap) return;
  try { GAL = await Store.list('gallery'); }
  catch (e) { wrap.innerHTML = '<div class="empty">Could not load gallery.</div>'; return; }
  paintGallery();
}

// Renders the current in-memory GAL array — no network call. Use this after
// a local mutation (like/comment/delete) instead of renderGallery(), so a
// single like or comment doesn't cost a full re-read of the whole collection.
function paintGallery() {
  const wrap = document.getElementById('galWrap');
  if (!wrap) return;
  document.getElementById('galCount').textContent = GAL.length + ' photo' + (GAL.length !== 1 ? 's' : '');
  if (!GAL.length) {
    wrap.innerHTML = '<div class="empty">No photos yet.<br>' + (isAdmin() ? 'Upload the first memory!' : 'Check back soon!') + '</div>';
    return;
  }
  wrap.innerHTML = '<div class="gal">' + GAL.map(p => {
    const liked = (p.likedBy || []).includes(DEVICE), likes = (p.likedBy || []).length, nc = (p.comments || []).length;
    return `<div class="ph">
      ${isAdmin() ? `<button class="del" onclick="delPhoto('${p.id}')">🗑</button>` : ''}
      <img src="${p.url}" onclick="openViewer('${p.id}')" alt="">
      ${p.caption ? `<div class="cap">${esc(p.caption)}</div>` : ''}
      <div class="actbar">
        <button class="like ${liked ? 'on' : ''}" onclick="toggleLike('${p.id}')">${liked ? '❤️' : '🤍'} ${likes}</button>
        <button class="dlbtn" onclick="downloadPhoto('${p.id}')" title="Download">⬇</button>
        <button class="cbtn" onclick="openPhoto('${p.id}')">💬 ${nc}</button>
      </div></div>`;
  }).join('') + '</div>';
}

const MAX_LIKES = 100;
async function toggleLike(id) {
  const p = GAL.find(x => x.id === id); if (!p) return; p.likedBy = p.likedBy || [];
  const i = p.likedBy.indexOf(DEVICE);
  if (i > -1) { p.likedBy.splice(i, 1); }
  else {
    if (p.likedBy.length >= MAX_LIKES) return toast(`Like limit reached (${MAX_LIKES})`);
    p.likedBy.push(DEVICE);
  }
  await Store.update('gallery', id, { likedBy: p.likedBy }); paintGallery();
}

async function delPhoto(id) {
  if (!isAdmin()) return; if (!confirm('Delete this photo?')) return;
  await Store.remove('gallery', id); GAL = GAL.filter(x => x.id !== id); toast('Photo deleted'); paintGallery();
}

/* ---------- Download ---------- */
function downloadPhoto(id) {
  const p = GAL.find(x => x.id === id); if (!p) return;
  const safeCap = (p.caption || 'GRT_photo').trim().replace(/[^\w\-]+/g, '_').slice(0, 40) || 'GRT_photo';
  const a = document.createElement('a');
  a.href = p.url;
  a.download = `${safeCap}_${id}.jpg`;
  document.body.appendChild(a); a.click(); a.remove();
  toast('Downloading photo… 📥');
}

/* ---------- Lightbox + comments ---------- */
let CUR = null;
function openPhoto(id) {
  const p = GAL.find(x => x.id === id); if (!p) return; CUR = id;
  document.getElementById('lbImg').src = p.url;
  document.getElementById('lbCap').textContent = p.caption || '';
  const nameEl = document.getElementById('cName');
  if (nameEl) nameEl.value = localStorage.getItem('grt_name') || '';
  renderComments(p); openOv('photoOv');
}
const MAX_COMMENTS = 50;
function renderComments(p) {
  const list = document.getElementById('cmtList'); const cs = p.comments || [];
  const hdr = document.getElementById('cmtHdr'); if (hdr) hdr.textContent = `💬 Comments (${cs.length}/${MAX_COMMENTS})`;
  list.innerHTML = cs.length ? cs.map((c, idx) => `<div class="cmt">
    <div class="meta-c">
      <small>${isAdmin() && c.name ? `<b>${esc(c.name)}</b> · ` : ''}${fmt(c.at)}</small>
      ${isAdmin() ? `<button class="cbtn" onclick="delComment('${p.id}',${idx})">✕</button>` : ''}
    </div>
    <div class="t">${esc(c.text)}</div></div>`).join('')
    : '<div class="muted" style="font-size:13px;padding:8px 0">No comments yet. Be the first!</div>';
}
async function addComment() {
  const p = GAL.find(x => x.id === CUR); if (!p) return;
  p.comments = p.comments || [];
  if (p.comments.length >= MAX_COMMENTS) return toast(`Comment limit reached (${MAX_COMMENTS})`);
  const text = document.getElementById('cText').value.trim().slice(0, 35); if (!text) return;
  const name = document.getElementById('cName').value.trim().slice(0, 40);
  if (name) localStorage.setItem('grt_name', name); // remembered so it's not retyped next time
  p.comments.push({ text, at: Date.now(), by: DEVICE, name });
  await Store.update('gallery', CUR, { comments: p.comments });
  document.getElementById('cText').value = ''; renderComments(p); paintGallery(); toast('Comment posted');
}
async function delComment(id, idx) {
  if (!isAdmin()) return; const p = GAL.find(x => x.id === id); if (!p) return;
  p.comments.splice(idx, 1); await Store.update('gallery', id, { comments: p.comments }); renderComments(p); paintGallery();
}

/* ================= FULL-SCREEN ZOOMABLE VIEWER ================= */
let vScale = 1, vX = 0, vY = 0;
const _pts = new Map();
let _startDist = 0, _startScale = 1, _panStart = null, _lastTap = 0;

function _vApply() {
  const img = document.getElementById('vImg');
  if (img) img.style.transform = `translate(${vX}px,${vY}px) scale(${vScale})`;
}
let vCurId = null;
function openViewer(id) {
  const p = GAL.find(x => x.id === id); if (!p) return;
  vCurId = id;
  document.getElementById('vImg').src = p.url;
  vScale = 1; vX = 0; vY = 0; _vApply();
  openOv('imgViewer');
}
function closeViewer() { closeOv('imgViewer'); }
function viewerZoom(dir) {
  vScale = Math.max(1, Math.min(5, vScale + dir * 0.5));
  if (vScale === 1) { vX = 0; vY = 0; }
  _vApply();
}
(function initViewer() {
  const stage = document.getElementById('vstage'); if (!stage) return;
  const D = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  stage.addEventListener('pointerdown', e => {
    stage.setPointerCapture(e.pointerId);
    _pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (_pts.size === 1) {
      _panStart = { x: e.clientX, y: e.clientY, tx: vX, ty: vY };
      const now = Date.now();
      if (now - _lastTap < 300) {                 // double-tap toggles zoom
        if (vScale > 1) { vScale = 1; vX = 0; vY = 0; } else { vScale = 2.5; }
        _vApply();
      }
      _lastTap = now;
    } else if (_pts.size === 2) {
      const a = [..._pts.values()]; _startDist = D(a[0], a[1]); _startScale = vScale;
    }
  });
  stage.addEventListener('pointermove', e => {
    if (!_pts.has(e.pointerId)) return;
    _pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const a = [..._pts.values()];
    if (_pts.size === 2) {                          // pinch zoom
      vScale = Math.max(1, Math.min(5, _startScale * (D(a[0], a[1]) / _startDist)));
      if (vScale === 1) { vX = 0; vY = 0; }
      _vApply();
    } else if (_pts.size === 1 && vScale > 1 && _panStart) {  // drag to pan
      vX = _panStart.tx + (e.clientX - _panStart.x);
      vY = _panStart.ty + (e.clientY - _panStart.y);
      _vApply();
    }
  });
  const up = e => {
    _pts.delete(e.pointerId);
    if (_pts.size === 1) { const v = [..._pts.values()][0]; _panStart = { x: v.x, y: v.y, tx: vX, ty: vY }; }
    if (_pts.size === 0 && vScale === 1) { vX = 0; vY = 0; _vApply(); }
  };
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  stage.addEventListener('wheel', e => {           // desktop scroll-to-zoom
    e.preventDefault();
    vScale = Math.max(1, Math.min(5, vScale - Math.sign(e.deltaY) * 0.2));
    if (vScale === 1) { vX = 0; vY = 0; }
    _vApply();
  }, { passive: false });
})();