/* ===================================================================
   STUDENTS TAB
   - Everyone: filter All / Boys / Girls (default All)
   - Admin: add, edit & delete students
   The class list below is copied into the database the first time an
   admin logs in, so every student (seed + admin-added) becomes a real
   record that can be edited or deleted like any other entry.
=================================================================== */

document.getElementById('students').innerHTML = `
  <div class="sec-title">
    <h2>👥 Students</h2>
    <span class="pill" id="stuCount">0</span>
    <button class="btn sm ghost" id="stuSortBtn" onclick="toggleStudentSort()" title="Toggle sort order">▲ A-Z</button>
  </div>
  <div class="card">
    <label for="stuFilter">Show</label>
    <select id="stuFilter" onchange="renderStudents()">
      <option value="all">All</option>
      <option value="boy">Boys</option>
      <option value="girl">Girls</option>
    </select>
  </div>
  <div class="card" id="stuAddCard" style="display:none">
    <h3 id="stuFormTitle">Add student</h3>
    <input type="hidden" id="sId">
    <div class="field"><input id="sName" placeholder="Full name"></div>
    <div class="row">
      <div class="field grow">
        <select id="sGender"><option value="boy">Boy</option><option value="girl">Girl</option></select>
      </div>
      <div class="field grow"><input id="sInfo" placeholder="Note (e.g. city / job)"></div>
    </div>
    <div class="row">
      <button class="btn grow" onclick="saveStudent()">💾 Save student</button>
      <button class="btn ghost" id="stuCancel" style="display:none" onclick="resetStudentForm()">Cancel</button>
    </div>
  </div>
  <div id="stuWrap"><div class="loader">Loading students…</div></div>`;

let STU = [];
let STU_SORT_DIR = 'asc'; // default: ascending (A-Z)

function toggleStudentSort() {
  STU_SORT_DIR = STU_SORT_DIR === 'asc' ? 'desc' : 'asc';
  const btn = document.getElementById('stuSortBtn');
  if (btn) btn.innerHTML = STU_SORT_DIR === 'asc' ? '▲ A-Z' : '▼ Z-A';
  renderStudents();
}

/* Pre-loaded class list (batch 2006–2007). [name, gender] */
const SEED_STUDENTS = [
  // ---- Boys ----
  ["Sankarapu Anjaneyulu","boy"],["Tolla Anjaneyulu","boy"],["Mekala Anvesh Kumar Reddy","boy"],
  ["Katlaganti Ashok Kumar Reddy","boy"],["Shaik Babajan","boy"],["Shaik Bavajan","boy"],
  ["B.BharathKumar Reddy","boy"],["Madduri Bhargava","boy"],["Gumpolla Chandra Sekhar","boy"],
  ["Gudla Dasaratha","boy"],["Yallam Dileep Kumar Raju","boy"],["Barenkala Eswaraiah","boy"],
  ["Yarrajeni Eswar Reddy","boy"],["Appa Ganesh","boy"],["Narnavaram Giri","boy"],
  ["Gutti Govardhana","boy"],["Purum Govardhana","boy"],["Maligi Haravendra Reddy","boy"],
  ["Mutra HariPrasad Reddy","boy"],["Pogaku Jagadeesh","boy"],["Pujari Janardhana","boy"],
  ["Yalapala Jayaram","boy"],["Yalapala Kishore","boy"],["Bathini Madan Mohan","boy"],
  ["Bukke Mahesh Naik","boy"],["Pommala Mani Prasad","boy"],["Vuttharadi Nagaraju","boy"],
  ["Yalapalli Nagarjuna","boy"],["Purum Nagendra Babu","boy"],["Koneti Nagendra Kumar","boy"],
  ["Korakoti Narasimhulu","boy"],["Talari Narasimhulu","boy"],["Bhojanapu Phani Bhushana","boy"],
  ["Mude Prasad","boy"],["Veeranala Prasanth Kumar","boy"],["Bavanath Purushotham Naik","boy"],
  ["Seelam Ramanjulu","boy"],["Varikolla Ramanajaneyulu","boy"],["Bukke Ramesh Naik","boy"],
  ["Gundlapalli Ravi Kumar","boy"],["Jally Ravitheja Kumar","boy"],["Bommaluleni Reddeppa","boy"],
  ["Banda Samba siva","boy"],["Nulu Siva Kumar","boy"],["Ponna Siva Kumar","boy"],
  ["Tudum Siva Kumar","boy"],["Yegavinti Sreenatha reddy","boy"],["N sreenivasulu","boy"],
  ["Kota kunda Suresh","boy"],["E venkata charan","boy"],["V venkatesh","boy"],
  ["Kenga Venkatrama","boy"],["BOGGULA VENUGOPAL","boy"],["Anil","boy"],
  ["Rajasekhar HG","boy"],["Vinod Kumar","boy"],["Devendra","boy"],["UmaMahesh","boy"],
  // ---- Girls ----
  ["BODE ALIVELU","girl"],["KONDREDDY AMALA","girl"],["PATAN AMMAJAN","girl"],["D AMMAJI","girl"],
  ["A AMMULU","girl"],["MINNAMA REDDY ANJANA","girl"],["MEKALA ANITHA","girl"],["GUDDITI ARCHANA","girl"],
  ["JINKA ARUNA KUMARI","girl"],["CHINTAPALLI ASWANI","girl"],["KATLAGANTI ASWANI","girl"],
  ["MODEM ASWANI","girl"],["Y BAYAMMA","girl"],["BOJANAPU BHARGAVI","girl"],["BURRA BHARGAVI","girl"],
  ["KOMMURI BRAHMANI","girl"],["B CHANDRAKALA","girl"],["BIDHAM CHANDRAKALA","girl"],
  ["ANANTHA DEEPIKA","girl"],["POLURU DEEPIKA","girl"],["MUDIVETI DHANAMMA","girl"],
  ["VALIPI GANGAVATHI","girl"],["B GAYATHRI","girl"],["DOMMA GOWTHAMI","girl"],
  ["NARNAVARAM HARITHA","girl"],["NANAPU HARITHA","girl"],["MODEM HEMALATHA","girl"],
  ["AKUTHOTA HEMAVANI","girl"],["RAMISETTI HIMA BINDU","girl"],["MADAKA JYOTHI","girl"],
  ["THIMNINI GOWNOLLA KAN","girl"],["BATTHALA KAVITHA RANI","girl"],["BUDDA LALITHA","girl"],
  ["CHAMANCHI MAMATHA","girl"],["ASADI MANEMMA","girl"],["CHINTHA NANDINI","girl"],
  ["THUGU NANDINI","girl"],["S NAJEENA","girl"],["GUDLA NEELADEVI","girl"],
  ["RAMISETTI NETHRAVATHI","girl"],["CHINNAKOTLA NIRMALA","girl"],["EDAGOTTI PADMA","girl"],
  ["RAMISETTI PADMAVATHI","girl"],["Y PARVATHI","girl"],["PAMULURI PAVANA KUMARI","girl"],
  ["ANGAJALA PUSHPAVATHI","girl"],["SYED PYARI","girl"],["BANDI RADHAMMA","girl"],
  ["GODUGU RANJITHA","girl"],["KANNEMADUGU RAMANJU","girl"],["SHAIK REDDI SHABANA","girl"],
  ["BOJANAPU RENUKA","girl"],["TRIVEDI RENUKA","girl"],["SHAIK RESHMA","girl"],["SHAIK RESHMA","girl"],
  ["KAMMALA RUKMINAMMA","girl"],["SIBBALA SAILAJA","girl"],["RAINETI SARASWATHI","girl"],
  ["VANISE SARASWATHI","girl"],["SHAIK SHABANA","girl"],["RATHANAKARAM SIREESHA","girl"],
  ["SHAIK SONIA TAJ","girl"],["CHANDRAGIRI SREELATHA","girl"],["KUPPALA SREEVANYA","girl"],
  ["CHINTHAPALLI SIGUNA","girl"],["C SUGUNA","girl"],["K SUGUNA","girl"],["DONDLA SULOCHANA","girl"],
  ["KADIRI SUMATHI","girl"],["MADARAJULA SUMITHRA","girl"],["MUTRA SWARNALATHA","girl"],
  ["SUNKOJI SWATHI","girl"],["BOGGULA TULASI","girl"],["YALAPALA UMADEVI","girl"],
  ["MALLEPULA VASANTHA","girl"],["ERIKALA VASUNDHARA","girl"],["KONETI VIJAYA KUMARI","girl"],
  ["MEJARI VIJAYA KUMARI","girl"],["DADU GOLLA VINUTHA","girl"],["YERROLLA YELLAMMA","girl"],
  ["SADLA YASODHA","girl"]
];

async function loadStudents() {
  // Everyone (no login needed) always sees the full class list: the built-in
  // seed names PLUS anything already in the database — same as before.
  // The first time an admin logs in, the seed list is copied into the database
  // once (tracked by a 'settings/studentsSeeded' flag) so every student becomes
  // a real, editable/deletable record. After that, the database IS the full list.
  let dbList = [];
  try { dbList = await Store.list('students'); } catch (e) { dbList = []; }

  let seeded = null;
  try { seeded = await Store.getDoc('settings', 'studentsSeeded'); } catch (e) { seeded = null; }

  if (isAdmin() && !seeded && SEED_STUDENTS.length) {
    try {
      await Promise.all(SEED_STUDENTS.map(([name, gender]) => Store.add('students', { name, gender, info: '' })));
      await Store.setDoc('settings', 'studentsSeeded', { at: Date.now() });
      dbList = await Store.list('students');
      seeded = true;
    } catch (e) { console.warn('Seeding students failed', e); }
  }

  STU = seeded
    ? dbList
    : SEED_STUDENTS.map(([name, gender]) => ({ name, gender })).concat(dbList);
  renderStudents();
}

// Sort/label by the GIVEN name (2nd word onward), e.g. "Mekala Anvesh Kumar" -> "Anvesh Kumar"
function givenPart(name) {
  const t = (name || '').trim().split(/\s+/);
  return (t.length > 1 ? t.slice(1).join(' ') : t[0]) || '';
}

function renderStudents() {
  const wrap = document.getElementById('stuWrap');
  if (!wrap) return;
  const f = document.getElementById('stuFilter').value;
  const list = STU
    .filter(s => f === 'all' ? true : s.gender === f)
    .sort((a, b) => {
      const c = givenPart(a.name).localeCompare(givenPart(b.name), undefined, { sensitivity: 'base' });
      return STU_SORT_DIR === 'asc' ? c : -c;
    });
  document.getElementById('stuCount').textContent = list.length;
  if (!list.length) { wrap.innerHTML = '<div class="empty">No students' + (f !== 'all' ? ' in this group' : '') + ' yet.</div>'; return; }
  wrap.innerHTML = list.map(s => `<div class="stu">
    <div class="ava ${s.gender === 'girl' ? 'g' : 'b'}">${esc((givenPart(s.name) || '?').charAt(0).toUpperCase())}</div>
    <div class="grow"><div class="nm">${esc(s.name)}</div>
      ${s.info ? `<div class="mt">${esc(s.info)}</div>` : ''}</div>
    ${(isAdmin() && s.id) ? `<div class="stuact">
        <button class="btn sm" onclick='editStudent(${JSON.stringify(JSON.stringify(s))})'>✏️ Edit</button>
        <button class="btn danger sm" onclick="delStudent('${s.id}')">🗑 Delete</button>
      </div>` : ''}
  </div>`).join('');
}

async function saveStudent() {
  if (!isAdmin()) return toast('Login required');
  const id = document.getElementById('sId').value;
  const name = document.getElementById('sName').value.trim(); if (!name) return toast('Enter a name');
  const data = { name, gender: document.getElementById('sGender').value, info: document.getElementById('sInfo').value.trim() };
  if (id) {
    await Store.update('students', id, data);
    const i = STU.findIndex(s => s.id === id); if (i > -1) STU[i] = { ...STU[i], ...data };
  } else {
    const newId = await Store.add('students', data);
    STU.push({ id: newId, ...data, createdAt: Date.now() });
  }
  resetStudentForm(); toast(id ? 'Student updated ✅' : 'Student added ✅'); renderStudents();
}

function editStudent(json) {
  const s = JSON.parse(json);
  document.getElementById('sId').value = s.id || '';
  document.getElementById('sName').value = s.name || '';
  document.getElementById('sGender').value = s.gender || 'boy';
  document.getElementById('sInfo').value = s.info || '';
  document.getElementById('stuFormTitle').textContent = 'Edit student';
  document.getElementById('stuCancel').style.display = 'inline-flex';
  go('students'); window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetStudentForm() {
  document.getElementById('sId').value = '';
  document.getElementById('sName').value = '';
  document.getElementById('sGender').value = 'boy';
  document.getElementById('sInfo').value = '';
  document.getElementById('stuFormTitle').textContent = 'Add student';
  document.getElementById('stuCancel').style.display = 'none';
}

async function delStudent(id) {
  if (!isAdmin()) return; if (!confirm('Delete this student?')) return;
  await Store.remove('students', id); STU = STU.filter(s => s.id !== id); toast('Student deleted'); renderStudents();
}