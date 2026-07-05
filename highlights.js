/* ===================================================================
   HIGHLIGHTS TAB
   - Everyone: view the highlights list
   - Admin: add / edit / delete highlights
   (Same pattern as the Events tab.)
=================================================================== */

document.getElementById('highlights').innerHTML = `
  <div class="sec-title">
    <h2>✨ Highlights</h2>
    <span class="pill" id="hlCount">0</span>
  </div>
  <div class="card" id="hlAddCard" style="display:none">
    <h3 id="hlFormTitle">Add highlight</h3>
    <input type="hidden" id="hlId">
    <div class="field"><input id="hlTitle" placeholder="Highlight title"></div>
    <div class="row">
      <div class="field grow"><label>Date (optional)</label><input id="hlDate" type="date"></div>
      <div class="field grow"><label>Time (optional)</label><input id="hlTime" type="time"></div>
    </div>
    <div class="field"><textarea id="hlDesc" rows="3" placeholder="Description"></textarea></div>
    <div class="row">
      <button class="btn grow" onclick="saveHighlight()">💾 Save highlight</button>
      <button class="btn ghost" id="hlCancel" style="display:none" onclick="resetHighlightForm()">Cancel</button>
    </div>
  </div>
  <div id="hlWrap"><div class="loader">Loading highlights…</div></div>`;

let HL = [];

async function loadHighlights() {
  try { HL = await Store.list('highlights'); } catch (e) { HL = []; }
  paintHighlights();
}

// Renders the current in-memory HL array — no network call.
function paintHighlights() {
  const wrap = document.getElementById('hlWrap');
  if (!wrap) return;
  document.getElementById('hlCount').textContent = HL.length;
  if (!HL.length) { wrap.innerHTML = '<div class="empty">No highlights posted yet.' + (isAdmin() ? '<br>Add the first one above.' : '') + '</div>'; return; }
  wrap.innerHTML = HL.map(h => {
    let when = h.date ? new Date(h.date + 'T' + (h.time || '00:00')).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';
    if (h.time) {
      const t = new Date('2000-01-01T' + h.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      when = when ? when + ' · ' + t : t;
    }
    return `<div class="ev">
      ${when ? `<div class="when">${when}</div>` : ''}
      <div class="ti">${esc(h.title)}</div>
      ${h.desc ? `<div class="ds">${esc(h.desc)}</div>` : ''}
      ${isAdmin() ? `<div class="evact">
        <button class="btn sm" onclick='editHighlight(${JSON.stringify(JSON.stringify(h))})'>✏️ Edit</button>
        <button class="btn danger sm" onclick="delHighlight('${h.id}')">🗑 Delete</button></div>` : ''}
    </div>`;
  }).join('');
}

async function saveHighlight() {
  if (!isAdmin()) return toast('Login required');
  const id = document.getElementById('hlId').value;
  const data = {
    title: document.getElementById('hlTitle').value.trim(),
    date: document.getElementById('hlDate').value,
    time: document.getElementById('hlTime').value,
    desc: document.getElementById('hlDesc').value.trim()
  };
  if (!data.title) return toast('Enter a title');
  if (id) {
    await Store.update('highlights', id, data);
    const i = HL.findIndex(h => h.id === id); if (i > -1) HL[i] = { ...HL[i], ...data };
  } else {
    const newId = await Store.add('highlights', data);
    HL.push({ id: newId, ...data, createdAt: Date.now() });
  }
  resetHighlightForm(); toast(id ? 'Highlight updated ✅' : 'Highlight added ✅'); paintHighlights();
}

function editHighlight(json) {
  const h = JSON.parse(json);
  document.getElementById('hlId').value = h.id; document.getElementById('hlTitle').value = h.title || '';
  document.getElementById('hlDate').value = h.date || ''; document.getElementById('hlTime').value = h.time || '';
  document.getElementById('hlDesc').value = h.desc || '';
  document.getElementById('hlFormTitle').textContent = 'Edit highlight';
  document.getElementById('hlCancel').style.display = 'inline-flex';
  go('highlights'); window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetHighlightForm() {
  ['hlId', 'hlTitle', 'hlDate', 'hlTime', 'hlDesc'].forEach(i => document.getElementById(i).value = '');
  document.getElementById('hlFormTitle').textContent = 'Add highlight';
  document.getElementById('hlCancel').style.display = 'none';
}

async function delHighlight(id) {
  if (!isAdmin()) return; if (!confirm('Delete this highlight?')) return;
  await Store.remove('highlights', id); HL = HL.filter(h => h.id !== id); toast('Highlight deleted'); paintHighlights();
}