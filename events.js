/* ===================================================================
   EVENTS TAB
   - Everyone: view the event list
   - Admin: add / edit / delete events
=================================================================== */

document.getElementById('events').innerHTML = `
  <div class="sec-title">
    <h2>🗓️ Event Info</h2>
    <span class="pill" id="evCount">0</span>
    <button class="btn sm ghost" id="evSortBtn" onclick="toggleEventSort()" title="Toggle sort order">⬇️</button>
  </div>
  <div class="card" id="evAddCard" style="display:none">
    <h3 id="evFormTitle">Add event</h3>
    <input type="hidden" id="evId">
    <div class="field"><input id="evTitle" placeholder="Event title"></div>
    <div class="row">
      <div class="field grow"><label>Date</label><input id="evDate" type="date"></div>
      <div class="field grow"><label>Time</label><input id="evTime" type="time"></div>
    </div>
    <div class="field"><textarea id="evDesc" rows="3" placeholder="Description"></textarea></div>
    <div class="row">
      <button class="btn grow" onclick="saveEvent()">💾 Save event</button>
      <button class="btn ghost" id="evCancel" style="display:none" onclick="resetEventForm()">Cancel</button>
    </div>
  </div>
  <div id="evWrap"><div class="loader">Loading events…</div></div>`;

let EV = [];
let EV_SORT_DIR = 'desc'; // default: newest first (by date + time)

function toggleEventSort() {
  EV_SORT_DIR = EV_SORT_DIR === 'desc' ? 'asc' : 'desc';
  const btn = document.getElementById('evSortBtn');
  if (btn) btn.innerHTML = EV_SORT_DIR === 'desc' ? '⬇️' : '⬆️';
  paintEvents();
}

// Events with no date/time are always kept at the end, regardless of sort direction.
// Dates/times are treated as IST (+05:30) so ordering is correct for every viewer.
function sortedEvents() {
  const withT = EV.map(e => ({ ...e, _t: e.date ? new Date(e.date + 'T' + (e.time || '00:00') + ':00+05:30').getTime() : null }));
  const dated = withT.filter(e => e._t !== null)
    .sort((a, b) => EV_SORT_DIR === 'desc' ? b._t - a._t : a._t - b._t);
  const undated = withT.filter(e => e._t === null);
  return dated.concat(undated);
}

async function loadEvents() {
  try { EV = await Store.list('events'); } catch (e) { EV = []; }
  paintEvents();
}

// Renders the current in-memory EV array — no network call.
function paintEvents() {
  const wrap = document.getElementById('evWrap');
  if (!wrap) return;
  document.getElementById('evCount').textContent = EV.length;
  if (!EV.length) { wrap.innerHTML = '<div class="empty">No events posted yet.' + (isAdmin() ? '<br>Add the first one above.' : '') + '</div>'; return; }
  wrap.innerHTML = sortedEvents().map(e => {
    let when = e.date ? new Date(e.date + 'T' + (e.time || '00:00') + ':00+05:30').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '';
    if (e.time) when += ' · ' + new Date(e.date + 'T' + e.time + ':00+05:30').toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' IST';
    return `<div class="ev">
      <div class="when">${when || 'Date TBD'}</div>
      <div class="ti">${esc(e.title)}</div>
      ${e.desc ? `<div class="ds">${esc(e.desc)}</div>` : ''}
      ${isAdmin() ? `<div class="evact">
        <button class="btn sm" onclick='editEvent(${JSON.stringify(JSON.stringify(e))})'>✏️ Edit</button>
        <button class="btn danger sm" onclick="delEvent('${e.id}')">🗑 Delete</button></div>` : ''}
    </div>`;
  }).join('');
}

async function saveEvent() {
  if (!isAdmin()) return toast('Login required');
  const id = document.getElementById('evId').value;
  const data = {
    title: document.getElementById('evTitle').value.trim(),
    date: document.getElementById('evDate').value,
    time: document.getElementById('evTime').value,
    desc: document.getElementById('evDesc').value.trim()
  };
  if (!data.title) return toast('Enter a title');
  if (id) {
    await Store.update('events', id, data);
    const i = EV.findIndex(e => e.id === id); if (i > -1) EV[i] = { ...EV[i], ...data };
  } else {
    const newId = await Store.add('events', data);
    EV.push({ id: newId, ...data, createdAt: Date.now() });
  }
  resetEventForm(); toast(id ? 'Event updated ✅' : 'Event added ✅'); paintEvents();
}

function editEvent(json) {
  const e = JSON.parse(json);
  document.getElementById('evId').value = e.id; document.getElementById('evTitle').value = e.title || '';
  document.getElementById('evDate').value = e.date || ''; document.getElementById('evTime').value = e.time || '';
  document.getElementById('evDesc').value = e.desc || '';
  document.getElementById('evFormTitle').textContent = 'Edit event';
  document.getElementById('evCancel').style.display = 'inline-flex';
  go('events'); window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetEventForm() {
  ['evId', 'evTitle', 'evDate', 'evTime', 'evDesc'].forEach(i => document.getElementById(i).value = '');
  document.getElementById('evFormTitle').textContent = 'Add event';
  document.getElementById('evCancel').style.display = 'none';
}

async function delEvent(id) {
  if (!isAdmin()) return; if (!confirm('Delete this event?')) return;
  await Store.remove('events', id); EV = EV.filter(e => e.id !== id); toast('Event deleted'); paintEvents();
}