/* ===================================================================
   HOME TAB — hero, live countdown, event details.
   Editable content (date/time, About, Venue, Schedule activities) is
   loaded from the database (Store: settings/event) so the admin can
   change it live; falls back to the defaults below.
=================================================================== */

const DEF_ABOUT = "A grand get-together (GRT) of the 2006–2007 batch of Vivekananda Municipal High School. Reconnect with old friends, relive school memories, share photos and celebrate the bond that started in our classrooms.";
const DEF_VENUE = "Vivekananda Municipal High School\nNG Palle, Madanapalle";
const DEF_ACTIVITIES = "Memories · Lunch · Music";
const DEF_LIVE_TITLE  = "The Reunion is LIVE right now!";
const DEF_LIVE_SUB    = "Hugs, laughs and old stories are already flowing — come join in!";
const DEF_ENDED_TITLE = "What a Reunion! 💛";
const DEF_ENDED_SUB   = "Thank you for making it unforgettable. Relive it in the Gallery — see you at the next GRT!";

document.getElementById('home').innerHTML = `
  <div class="hero">
    <div class="kicker">GRAND RE-UNION · GRT</div>
    <h1>Batch <span>2006–2007</span></h1>
    <div class="sub">Vivekananda Municipal High School</div>
    <div class="meta">
      <div class="meta-row">
        <div class="chip" id="evDateChip">
          <svg class="chip-ic" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18"/><path d="M8 2.5v4M16 2.5v4"/></svg>
          <span id="evDateChipText">—</span>
        </div>
        <div class="chip" id="evTimeChip">🕘 —</div>
      </div>
      <div class="chip loc">📍 VMHS, NG Palle, Madanapalle</div>
    </div>

    <div class="count" id="countBox">
      <div class="box"><div class="n" id="cd">00</div><div class="l">Days</div></div>
      <div class="box"><div class="n" id="ch">00</div><div class="l">Hours</div></div>
      <div class="box"><div class="n" id="cm">00</div><div class="l">Mins</div></div>
      <div class="box"><div class="n" id="cs">00</div><div class="l">Secs</div></div>
    </div>

    <div class="eventState live-now" id="liveNow" style="display:none">
      <div class="es-scene">🎉🎊🥳🎈🎊🎉</div>
      <div class="es-title"><span class="dot"></span> <span id="liveTitleText">The Reunion is LIVE right now!</span></div>
      <div class="es-sub" id="liveSubText">Hugs, laughs and old stories are already flowing — come join in!</div>
    </div>

    <div class="eventState ended" id="eventEnded" style="display:none">
      <div class="es-scene">🌇🎈✨🎈🌇</div>
      <div class="es-title" id="endedTitleText">What a Reunion! 💛</div>
      <div class="es-sub" id="endedSubText">Thank you for making it unforgettable. Relive it in the Gallery — see you at the next GRT!</div>
    </div>
  </div>

  <!-- Admin-only: edit event details (saved for everyone) -->
  <div class="card" id="eventEditCard" style="display:none">
    <h3>✏️ Edit event details</h3>
    <div class="field"><label>Date</label><input type="date" id="evCfgDate"></div>
    <div class="row">
      <div class="field grow"><label>Start time</label><input type="time" id="evCfgStart"></div>
      <div class="field grow"><label>End time</label><input type="time" id="evCfgEnd"></div>
    </div>
    <div class="field"><label>About this Reunion</label><textarea id="cfgAbout" rows="3"></textarea></div>
    <div class="field"><label>Venue (one line per row)</label><textarea id="cfgVenue" rows="2"></textarea></div>
    <div class="field"><label>Schedule activities</label><input id="cfgActivities" placeholder="e.g. Memories · Lunch · Music"></div>
    <div class="field"><label>Message while event is LIVE (title)</label><input id="cfgLiveTitle" placeholder="e.g. The Reunion is LIVE right now!"></div>
    <div class="field"><label>Message while event is LIVE (sub-text)</label><textarea id="cfgLiveSub" rows="2"></textarea></div>
    <div class="field"><label>Message after event ENDS (title)</label><input id="cfgEndedTitle" placeholder="e.g. What a Reunion! 💛"></div>
    <div class="field"><label>Message after event ENDS (sub-text)</label><textarea id="cfgEndedSub" rows="2"></textarea></div>
    <button class="btn block" onclick="saveEventConfig()">💾 Save changes</button>
  </div>

  <div class="card">
    <h3 class="gold-h">🎓 About this Reunion</h3>
    <p class="muted" id="aboutText" style="margin:0;line-height:1.6;font-size:14px">—</p>
  </div>

  <div class="row">
    <div class="card grow" style="margin-bottom:0">
      <h3 class="gold-h">📍 Venue</h3>
      <p class="muted" id="venueText" style="margin:0;font-size:14px;line-height:1.6">—</p>
      <a class="btn sm ghost" id="venueMap" style="margin-top:12px;display:inline-flex" target="_blank" href="#">Open in Maps ↗</a>
    </div>
    <div class="card grow" style="margin-bottom:0">
      <h3 class="gold-h">🕘 Schedule</h3>
      <p class="muted" style="margin:0;font-size:14px;line-height:1.6">
        <b style="color:var(--txt)" id="schedLine1">—</b><br>
        <span id="schedLine2">—</span><br>
        <span id="schedActivities">—</span>
      </p>
    </div>
  </div>`;

/* ---------- Event state (updatable) ---------- */
let EVENT = { start: EVENT_START, end: EVENT_END };

function fmtTime(hhmm) { // "21:00" -> "9:00 PM" (always interpreted/shown as IST)
  return new Date(`2000-01-01T${hhmm}:00+05:30`).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
}

function applyEventConfig(c) {
  const date  = (c && c.date)  || EVENT_DATE_STR;
  const start = (c && c.start) || EVENT_START_STR;
  const end   = (c && c.end)   || EVENT_END_STR;
  const about = (c && c.about) || DEF_ABOUT;
  const venue = (c && c.venue) || DEF_VENUE;
  const acts  = (c && c.activities) || DEF_ACTIVITIES;
  const liveTitle  = (c && c.liveTitle)  || DEF_LIVE_TITLE;
  const liveSub    = (c && c.liveSub)    || DEF_LIVE_SUB;
  const endedTitle = (c && c.endedTitle) || DEF_ENDED_TITLE;
  const endedSub   = (c && c.endedSub)   || DEF_ENDED_SUB;

  EVENT.start = new Date(`${date}T${start}:00+05:30`);
  EVENT.end   = new Date(`${date}T${end}:00+05:30`);

  // Date/time chips + schedule
  const dObj = new Date(`${date}T00:00:00+05:30`);
  document.getElementById('evDateChipText').textContent =
    dObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  document.getElementById('evTimeChip').textContent = '🕘 ' + fmtTime(start) + ' – ' + fmtTime(end) + ' IST';
  document.getElementById('schedLine1').textContent =
    dObj.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  document.getElementById('schedLine2').textContent = fmtTime(start) + ' – ' + fmtTime(end) + ' IST (same day)';
  document.getElementById('schedActivities').textContent = acts;

  // About + Venue
  document.getElementById('aboutText').textContent = about;
  document.getElementById('venueText').innerHTML = esc(venue).replace(/\n/g, '<br>');
  document.getElementById('venueMap').href =
    'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(venue.replace(/\n/g, ' '));

  // Live / Ended messages
  document.getElementById('liveTitleText').textContent = liveTitle;
  document.getElementById('liveSubText').textContent = liveSub;
  document.getElementById('endedTitleText').textContent = endedTitle;
  document.getElementById('endedSubText').textContent = endedSub;

  // Prefill the admin form
  document.getElementById('evCfgDate').value  = date;
  document.getElementById('evCfgStart').value = start;
  document.getElementById('evCfgEnd').value   = end;
  document.getElementById('cfgAbout').value = about;
  document.getElementById('cfgVenue').value = venue;
  document.getElementById('cfgActivities').value = acts;
  document.getElementById('cfgLiveTitle').value = liveTitle;
  document.getElementById('cfgLiveSub').value = liveSub;
  document.getElementById('cfgEndedTitle').value = endedTitle;
  document.getElementById('cfgEndedSub').value = endedSub;

  tick();
}

async function loadEventConfig() {
  let c = null;
  try { c = await Store.getDoc('settings', 'event'); } catch (e) {}
  applyEventConfig(c);
}

async function saveEventConfig() {
  if (!isAdmin()) return toast('Login required');
  const date  = document.getElementById('evCfgDate').value;
  const start = document.getElementById('evCfgStart').value;
  const end   = document.getElementById('evCfgEnd').value;
  if (!date || !start || !end) return toast('Fill date, start and end time');
  if (end <= start) return toast('End time must be after start time');
  const data = {
    date, start, end,
    about: document.getElementById('cfgAbout').value.trim() || DEF_ABOUT,
    venue: document.getElementById('cfgVenue').value.trim() || DEF_VENUE,
    activities: document.getElementById('cfgActivities').value.trim() || DEF_ACTIVITIES,
    liveTitle: document.getElementById('cfgLiveTitle').value.trim() || DEF_LIVE_TITLE,
    liveSub: document.getElementById('cfgLiveSub').value.trim() || DEF_LIVE_SUB,
    endedTitle: document.getElementById('cfgEndedTitle').value.trim() || DEF_ENDED_TITLE,
    endedSub: document.getElementById('cfgEndedSub').value.trim() || DEF_ENDED_SUB
  };
  try {
    await Store.setDoc('settings', 'event', data);
    applyEventConfig(data);
    toast('Saved ✅');
  } catch (e) { console.error(e); toast('Update failed'); }
}

/* ---------- Countdown ---------- */
function tick() {
  const now = new Date();
  const countBox = document.getElementById('countBox');
  const liveNow  = document.getElementById('liveNow');
  const ended    = document.getElementById('eventEnded');
  if (!countBox) return;

  if (now < EVENT.start) {
    // Upcoming — show the live countdown
    countBox.style.display = 'grid';
    liveNow.style.display = 'none';
    ended.style.display = 'none';
    const diff = EVENT.start - now;
    const d = Math.floor(diff / 864e5), h = Math.floor(diff % 864e5 / 36e5),
          m = Math.floor(diff % 36e5 / 6e4), s = Math.floor(diff % 6e4 / 1e3);
    const p = n => String(n).padStart(2, '0');
    cd.textContent = p(d); ch.textContent = p(h); cm.textContent = p(m); cs.textContent = p(s);
  } else if (now <= EVENT.end) {
    // Live — swap the countdown for a festive "in progress" scene
    countBox.style.display = 'none';
    liveNow.style.display = 'block';
    ended.style.display = 'none';
  } else {
    // Finished — show a warm closing scene
    countBox.style.display = 'none';
    liveNow.style.display = 'none';
    ended.style.display = 'block';
  }
}
setInterval(tick, 1000);

// Load saved details (or defaults) and start the countdown
loadEventConfig();