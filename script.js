// HORIZON HUB - JavaScript dasar untuk interaksi demo
const defaultAccounts = {
  mahasiswa: { password: 'mhs123', role: 'mahasiswa', name: 'Mahasiswa Demo', nim: 'DEMO-IFKA-001', program: 'Informatika (IF)', className: 'IF-KA', classType: 'Kelas Malam', semester: 'Y1S1', email: '' },
  admin: { password: 'admin123', role: 'admin', name: 'Administrator' }
};
let accounts = (() => {
  try { return { ...defaultAccounts, ...(JSON.parse(localStorage.getItem('horizonHubAccounts')) || {}) }; }
  catch (error) { return { ...defaultAccounts }; }
})();
if (accounts.mahasiswa) { accounts.mahasiswa.name = 'Mahasiswa Demo'; accounts.mahasiswa.nim = 'DEMO-IFKA-001'; accounts.mahasiswa.photo = ''; accounts.mahasiswa.nickname = ''; accounts.mahasiswa.displayMode = 'fullname'; }
function saveAccounts() { localStorage.setItem('horizonHubAccounts', JSON.stringify(accounts)); }
function activeAccount() { return currentUser ? (accounts[currentUser.username] || {}) : {}; }
function profileDisplayName(account = activeAccount()) {
  return account.displayMode === 'fullname' || !account.nickname ? (account.name || currentUser?.name || 'Pengguna') : account.nickname;
}
function updateHeaderProfile() {
  if (!currentUser) return;
  const account = activeAccount();
  const photo = account.photo || (account.role === 'admin' ? 'assets/logo-horizon.webp' : 'assets/avatar-default.svg');
  const avatar = document.querySelector('.mini-avatar img');
  if (avatar) { avatar.src = photo; avatar.alt = `Foto profil ${profileDisplayName(account)}`; avatar.classList.remove('hidden'); }
  const profilePhotoEl = $('profileStudentPhoto'); if (profilePhotoEl) profilePhotoEl.src = photo;
  $('roleBadge').textContent = profileDisplayName(account);
  $('profileShortcut').setAttribute('aria-label', `Buka menu profil ${profileDisplayName(account)}`);
  const dropdownPhoto = $('dropdownProfilePhoto'); if (dropdownPhoto) dropdownPhoto.src = photo;
  const sidePhoto = $('sidebarProfilePhoto'); if (sidePhoto) sidePhoto.src = photo;
  const sideName = $('sidebarProfileName'); if (sideName) sideName.textContent = profileDisplayName(account);
  const sideMeta = $('sidebarProfileMeta'); if (sideMeta) sideMeta.textContent = account.role === 'admin' ? 'Administrator' : `${account.className || 'Mahasiswa'} · ${account.semester || ''}`;
  const dropdownName = $('dropdownProfileName'); if (dropdownName) dropdownName.textContent = profileDisplayName(account);
  const dropdownMeta = $('dropdownProfileMeta'); if (dropdownMeta) dropdownMeta.textContent = account.role === 'admin' ? 'Administrator' : `${account.program || 'Mahasiswa'} · ${account.className || ''}`;
}

function readData(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch (error) { return []; }
}
let currentUser = null;
let requests = readData('horizonHubRequests');
let tasks = readData('horizonHubTasks');
let selectedCategory = 'classroom';
let selectedRoom = '';
let selectedRoomName = '';
let selectedRoomBuilding = '';
let selectedRoomFloor = '';
let bookingFromMap = false;

const $ = (id) => document.getElementById(id);
// Data dosen berdasarkan jadwal yang dikirim mahasiswa.
// Catatan: sesi dan nomor pertemuan tidak tercantum pada gambar jadwal.
const classDetails = {
  'GEN 022': { lecturer: 'Ani Suryani', session: 'Belum tercantum', meeting: 'Belum tercantum', mode: 'Online', room: 'Online', link: '' },
  'ICT 002': { lecturer: 'Moh Jembar Jomantara', session: 'Belum tercantum', meeting: 'Belum tercantum', mode: 'Offline', room: 'Lab Comp 2', link: '' },
  'ICT 003': { lecturer: 'Denisa', session: 'Belum tercantum', meeting: 'Belum tercantum', mode: 'Online', room: 'Online', link: '' },
  'MAT 001': { lecturer: 'Cepi Grahana', session: 'Belum tercantum', meeting: 'Belum tercantum', mode: 'Offline', room: 'E401', link: '' },
  'ICT 001': { lecturer: 'Anwar Hilman / Devi Fajar Wati', session: 'Belum tercantum', meeting: 'Belum tercantum', mode: 'Offline', room: 'E202 / Lab Comp 2', link: '' },
  'GEN 2': { lecturer: 'Rizki Teja Pratama', session: 'Belum tercantum', meeting: 'Belum tercantum', mode: 'Online / Offline', room: 'Online / W107C', link: '' }
};
// Detail per jadwal diperlukan karena mata kuliah/kode yang sama dapat muncul
// dengan dosen atau ruangan berbeda pada hari yang berbeda.
const classOccurrenceDetails = {
  'Senin|GEN 2|18.30 – 19.10': { lecturer: 'Rizki Teja Pratama', room: 'Online', mode: 'Online' },
  'Senin|ICT 003|19.30 – 21.10': { lecturer: 'Denisa', room: 'Online', mode: 'Online' },
  'Selasa|MAT 001|18.30 – 20.10': { lecturer: 'Cepi Grahana', room: 'E401', mode: 'Offline' },
  'Selasa|ICT 001|20.30 – 22.10': { lecturer: 'Anwar Hilman', room: 'E202', mode: 'Offline' },
  'Rabu|ICT 001|18.30 – 20.10': { lecturer: 'Devi Fajar Wati', room: 'Lab Comp 2', mode: 'Offline', note: 'Ruangan Lab Comp 2 berpotensi dipindahkan ke Lab A Gedung Barat. Menunggu konfirmasi.' },
  'Rabu|GEN 022|20.30 – 22.00': { lecturer: 'Ani Suryani', room: 'E303', mode: 'Offline' },
  'Kamis|GEN 2|17.30 – 18.30': { lecturer: 'Rizki Teja Pratama', room: 'W107C', mode: 'Offline' },
  'Kamis|ICT 003|18.30 – 20.10': { lecturer: 'Denisa', room: 'W103C', mode: 'Offline', note: 'Catatan jadwal menyebut kemungkinan perlu membawa laptop pribadi untuk praktikum. Menunggu konfirmasi dosen.' },
  'Kamis|ICT 002|20.30 – 22.10': { lecturer: 'Moh Jembar Jomantara', room: 'Lab Comp 2', mode: 'Offline', note: 'Ruangan Lab Comp 2 berpotensi dipindahkan ke Lab A Gedung Barat. Menunggu konfirmasi.' },
  'Jumat|GEN 022|19.30 – 20.30': { lecturer: 'Ani Suryani', room: 'Online', mode: 'Online' },
  'Jumat|ICT 002|20.30 – 22.10': { lecturer: 'Moh Jembar Jomantara', room: 'Online', mode: 'Online' }
};
const categoryNames = {
  classroom: 'Ruang Kelas', lab: 'Laboratorium', hall: 'Aula',
  meeting: 'Ruang Rapat', facility: 'Fasilitas Lainnya'
};

// Pisahkan navigasi berdasarkan peran secara tegas.
// Atribut hidden + inline display mencegah menu dari role lain tetap tampil
// pada browser mobile / preview editor yang mungkin memiliki cache CSS.
function applyRoleNavigation(role) {
  const isAdmin = role === 'admin';
  document.querySelectorAll('.student-only').forEach(el => {
    const hide = isAdmin;
    el.hidden = hide;
    el.classList.toggle('hidden', hide);
    el.style.setProperty('display', hide ? 'none' : '', 'important');
  });
  document.querySelectorAll('.admin-only').forEach(el => {
    const hide = !isAdmin;
    el.hidden = hide;
    el.classList.toggle('hidden', hide);
    el.style.setProperty('display', hide ? 'none' : '', 'important');
  });
}

// Remember me: simpan username saja, bukan password.
const rememberedUsername = localStorage.getItem('horizonRememberedUsername');
if (rememberedUsername) {
  $('username').value = rememberedUsername;
  $('rememberMe').checked = true;
}

// Login demo
$('loginForm').addEventListener('submit', function (event) {
  event.preventDefault();
  const username = $('username').value.trim().toLowerCase();
  const password = $('password').value;
  const account = accounts[username];
  if (!account || account.password !== password) {
    $('loginMessage').textContent = 'Username atau password belum benar.';
    return;
  }
  if ($('rememberMe').checked) {
    localStorage.setItem('horizonRememberedUsername', username);
  } else {
    localStorage.removeItem('horizonRememberedUsername');
  }
  currentUser = { username, role: account.role, name: account.name };
  if (account.role === 'mahasiswa') { $('borrowerNameDisplay').textContent = account.name || '—'; $('borrowerNimDisplay').textContent = account.nim || '—'; }
  $('loginPage').classList.add('hidden');
  $('appPage').classList.remove('hidden');
  $('roleBadge').textContent = account.role === 'admin' ? 'Administrator' : 'Mahasiswa';
  applyRoleNavigation(account.role);
  updateHeaderProfile();
  $('adminDashboard').classList.toggle('hidden', account.role !== 'admin');
  $('studentDashboard').classList.toggle('hidden', account.role === 'admin');
  openTab('home');
  renderAll();
  renderNotificationCenter();
  renderStudentAnnouncements();
  renderStudentDirectory();
});

function showAuthPanel(panel) {
  $('loginForm').classList.toggle('hidden', panel !== 'login');
  $('registerForm').classList.toggle('hidden', panel !== 'register');
  $('forgotForm').classList.toggle('hidden', panel !== 'forgot');
  document.querySelector('.auth-links').classList.toggle('hidden', panel !== 'login');
  document.querySelector('.demo-box')?.classList.toggle('hidden', panel !== 'login');
  $('loginMessage').textContent = '';
}
$('showRegister').addEventListener('click', () => showAuthPanel('register'));
$('showForgot').addEventListener('click', () => showAuthPanel('forgot'));
document.querySelectorAll('[data-auth-back]').forEach(button => button.addEventListener('click', () => showAuthPanel('login')));

$('regProgram').addEventListener('change', () => {
  const code = $('regProgram').value.includes('(IF)') ? 'IF' : $('regProgram').value.includes('(SI)') ? 'SI' : 'MNG';
  const classes = ['KA','KM','EC'].map(suffix => `${code}-${suffix}`);
  $('regClass').innerHTML = classes.map((value, index) => `<option value="${value}">${value} · ${['Kelas Malam','Kelas Pagi','Employee Class'][index]}</option>`).join('');
});
$('registerForm').addEventListener('submit', event => {
  event.preventDefault();
  const username = $('regUsername').value.trim().toLowerCase();
  const nim = $('regNim').value.trim();
  if (accounts[username]) { $('registerMessage').textContent = 'Username sudah digunakan. Pilih username lain.'; return; }
  if (Object.values(accounts).some(acc => acc.nim && acc.nim === nim)) { $('registerMessage').textContent = 'NIM sudah terdaftar.'; return; }
  const className = $('regClass').value;
  const classType = className.endsWith('-KA') ? 'Kelas Malam' : className.endsWith('-KM') ? 'Kelas Pagi' : 'Employee Class';
  accounts[username] = {
    password: $('regPassword').value, role: 'mahasiswa', name: $('regName').value.trim(),
    nim, email: $('regEmail').value.trim(), program: $('regProgram').value,
    className, classType, semester: $('regSemester').value
  };
  saveAccounts();
  $('registerMessage').textContent = 'Akun berhasil dibuat pada prototipe ini. Silakan login.';
  $('username').value = username;
  showAuthPanel('login');
});
$('forgotForm').addEventListener('submit', event => {
  event.preventDefault();
  const username = $('forgotUsername').value.trim().toLowerCase();
  const nim = $('forgotNim').value.trim();
  const account = accounts[username];
  if (!account || account.nim !== nim || account.role !== 'mahasiswa') {
    $('forgotMessage').textContent = 'Username dan NIM tidak cocok dengan akun mahasiswa.';
    return;
  }
  account.password = $('forgotNewPassword').value;
  saveAccounts();
  $('username').value = username;
  $('password').value = '';
  $('forgotMessage').textContent = 'Password berhasil diubah pada prototipe. Silakan login dengan password baru.';
});

$('togglePassword').addEventListener('click', () => {
  const visible = $('password').type === 'password';
  $('password').type = visible ? 'text' : 'password';
  $('togglePassword').classList.toggle('is-visible', visible);
  $('togglePassword').setAttribute('aria-pressed', String(visible));
  $('togglePassword').setAttribute('aria-label', visible ? 'Sembunyikan password' : 'Tampilkan password');
  $('togglePassword').setAttribute('title', visible ? 'Sembunyikan password' : 'Tampilkan password');
  $('togglePassword').innerHTML = visible
    ? '<svg class="eye-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c6.1 0 9.5 6 9.5 6a15.8 15.8 0 0 1-3 3.6"/><path d="M6.2 6.3C3.8 7.9 2.5 12 2.5 12s3.4 6 9.5 6c1.2 0 2.3-.2 3.3-.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>'
    : '<svg class="eye-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/></svg>';
});
function logout() {
  currentUser = null;
  closeDrawer();
  $('appPage').classList.add('hidden');
  $('loginPage').classList.remove('hidden');
  $('password').value = '';
  $('username').value = '';
  $('password').type = 'password';
  $('togglePassword').classList.remove('is-visible');
  $('togglePassword').setAttribute('aria-pressed', 'false');
  $('togglePassword').setAttribute('aria-label', 'Tampilkan password');
  $('togglePassword').innerHTML = '<svg class="eye-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/></svg>';
  $('loginMessage').textContent = '';
}
if ($('logoutButton')) $('logoutButton').addEventListener('click', logout);
if ($('drawerLogoutButton')) $('drawerLogoutButton').addEventListener('click', logout);

// Kalender Akademik SY 2026/2027 — data awal berdasarkan dokumen kalender kampus.
const ACADEMIC_SEED = [
 ['2026-07-01','Hari pertama kuliah Semester Pendek SY 26/27','Akademik','Awal perkuliahan semester pendek.'],
 ['2026-07-07','Pendaftaran mahasiswa lanjutan','Registrasi','Mulai registrasi mahasiswa lanjutan.'],
 ['2026-07-23','P1 Ujian Semester Pendek SY 26/27','Ujian','Periode ujian 23–25 Juli 2026.','2026-07-25'],
 ['2026-07-28','P2KK Mahasiswa Baru Batch 1','Kegiatan Kampus','Orientasi mahasiswa baru.'],
 ['2026-07-29','P2KK Mahasiswa Baru Batch 2','Kegiatan Kampus','Orientasi mahasiswa baru.'],
 ['2026-07-30','P2KK Mahasiswa Baru Batch 3','Kegiatan Kampus','Orientasi mahasiswa baru.'],
 ['2026-08-01','Batas waktu Grade Encoding Semester Pendek','Batas Waktu','Deadline pengisian nilai semester pendek.'],
 ['2026-08-04','P2KK Mahasiswa Baru Batch 4','Kegiatan Kampus','Orientasi mahasiswa baru.'],
 ['2026-08-05','P2KK Mahasiswa Baru Batch 5','Kegiatan Kampus','Orientasi mahasiswa baru.'],
 ['2026-08-06','P2KK Mahasiswa Baru Batch 6','Kegiatan Kampus','Orientasi mahasiswa baru.'],
 ['2026-08-11','P2KK Mahasiswa Baru Batch 7','Kegiatan Kampus','Orientasi mahasiswa baru.'],
 ['2026-08-12','P2KK Mahasiswa Baru Batch 8','Kegiatan Kampus','Orientasi mahasiswa baru.'],
 ['2026-08-13','P2KK Mahasiswa Baru Batch 9','Kegiatan Kampus','Orientasi mahasiswa baru.'],
 ['2026-08-17','Hari Kemerdekaan Indonesia','Libur Nasional','Libur nasional.'],
 ['2026-08-20','P2 Ujian Semester Pendek SY 26/27','Ujian','Periode ujian 20–22 Agustus 2026.','2026-08-22'],
 ['2026-08-22','Employee Assembly','Kegiatan Kampus','Agenda employee assembly.'],
 ['2026-08-25','Maulid Nabi','Libur Nasional','Libur nasional.'],
 ['2026-08-29','Akhir Semester Pendek SY 26/27','Akademik','Batas grade encoding dan akhir semester pendek.'],
 ['2026-08-31','Hari pertama kuliah Semester Ganjil SY 26/27','Akademik','Awal perkuliahan semester ganjil.'],
 ['2026-09-05','P2KK Mahasiswa Baru Batch 10','Kegiatan Kampus','Orientasi mahasiswa baru.'],
 ['2026-09-26','Akhir pendaftaran mahasiswa baru Semester Ganjil','Registrasi','Batas akhir pendaftaran mahasiswa baru.'],
 ['2026-10-10','Penyambutan Mahasiswa / Welcome Party','Kegiatan Kampus','Kegiatan penyambutan mahasiswa.'],
 ['2026-10-20','P1 Ujian Semester Ganjil SY 26/27','Ujian','Periode ujian 20–24 Oktober 2026.','2026-10-24'],
 ['2026-10-31','Batas waktu Grade Encoding','Batas Waktu','Deadline pengisian nilai.'],
 ['2026-11-25','Hari Guru Indonesia','Kegiatan Kampus','Peringatan Hari Guru Indonesia.'],
 ['2026-12-12','Periode Wisuda SY 25/26','Kegiatan Kampus','Periode wisuda.'],
 ['2026-12-15','P2 Ujian Semester Ganjil SY 26/27','Ujian','Periode ujian 15–19 Desember 2026.','2026-12-19'],
 ['2026-12-25','Hari Raya Natal','Libur Nasional','Libur nasional.'],
 ['2026-12-26','Akhir Semester Ganjil SY 26/27','Akademik','Akhir semester ganjil.'],
 ['2027-01-01','Tahun Baru 2027','Libur Nasional','Libur nasional.'],
 ['2027-01-02','Batas waktu Grade Encoding','Batas Waktu','Deadline pengisian nilai.'],
 ['2027-01-04','Mulai pendaftaran Semester Genap','Registrasi','Awal pendaftaran semester genap.'],
 ['2027-01-05','Isra Mi’raj Nabi Muhammad SAW','Libur Nasional','Libur nasional.'],
 ['2027-01-16','Akhir Semester Ganjil Profesi Ners','Akademik','Akhir semester untuk Profesi Ners.'],
 ['2027-01-30','Thesis Defense Cutoff (Grade Encoding)','Batas Waktu','Batas pengisian nilai sidang skripsi.'],
 ['2027-02-01','Hari pertama kuliah Semester Genap SY 26/27','Akademik','Awal perkuliahan semester genap.'],
 ['2027-02-06','Tahun Baru Imlek','Libur Nasional','Libur nasional.'],
 ['2027-02-27','Akhir pendaftaran Semester Genap','Registrasi','Batas akhir pendaftaran semester genap.'],
 ['2027-03-09','Hari Raya Nyepi','Libur Nasional','Libur nasional.'],
 ['2027-03-10','Hari Raya Idul Fitri','Libur Nasional','Libur nasional.'],
 ['2027-03-08','Libur Lebaran','Libur Nasional','Periode libur 8–13 Maret 2027.','2027-03-13'],
 ['2027-03-26','Jumat Agung','Libur Nasional','Libur nasional.'],
 ['2027-03-30','P1 Ujian Semester Genap SY 26/27','Ujian','Periode ujian 30 Maret–3 April 2027.','2027-04-03'],
 ['2027-04-10','Batas waktu Grade Encoding','Batas Waktu','Deadline pengisian nilai.'],
 ['2027-04-20','Pemilihan Raya Organisasi Mahasiswa','Kegiatan Kampus','Periode pemilihan 20–21 April 2027.','2027-04-21'],
 ['2027-05-01','Hari Buruh Nasional','Libur Nasional','Libur nasional.'],
 ['2027-05-06','Kenaikan Isa Almasih','Libur Nasional','Libur nasional.'],
 ['2027-05-17','Idul Adha','Libur Nasional','Libur nasional.'],
 ['2027-05-20','Hari Raya Waisak','Libur Nasional','Libur nasional.'],
 ['2027-05-25','P2 Ujian Semester Genap SY 26/27','Ujian','Periode ujian 25–29 Mei 2027.','2027-05-29'],
 ['2027-06-01','Hari Pancasila','Libur Nasional','Libur nasional.'],
 ['2027-06-05','Akhir Semester Genap SY 26/27','Akademik','Akhir semester genap.'],
 ['2027-06-06','Tahun Baru Islam','Libur Nasional','Libur nasional.'],
 ['2027-06-12','Batas waktu Grade Encoding','Batas Waktu','Deadline pengisian nilai.'],
 ['2027-06-19','Akhir Semester Genap Profesi Ners','Akademik','Akhir semester untuk Profesi Ners.'],
 ['2027-06-21','Awal pendaftaran Semester Pendek SY 26/27','Registrasi','Mulai pendaftaran semester pendek.'],
 ['2027-06-30','Thesis Defense Cutoff (Grade Encoding)','Batas Waktu','Batas pengisian nilai sidang skripsi.']
].map((e,i)=>({id:'seed-'+i,start:e[0],end:e[4]||e[0],title:e[1],category:e[2],description:e[3],seed:true}));
function academicEvents(){try{const saved=JSON.parse(localStorage.getItem('horizonHubAcademicEvents')||'null');return Array.isArray(saved)?saved:ACADEMIC_SEED.slice();}catch(e){return ACADEMIC_SEED.slice();}}
function saveAcademicEvents(events){localStorage.setItem('horizonHubAcademicEvents',JSON.stringify(events));}
const academicMonthNames=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
let studentCalendarCursor=new Date(2026,10,1),adminCalendarCursor=new Date(2026,10,1);
let studentSelectedDate='2026-11-16',adminSelectedDate='2026-11-16';
function academicDateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function academicDateLabel(start,end){const fmt=d=>new Date(d+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});return start===end?fmt(start):fmt(start)+' – '+fmt(end);}
function academicEventMarkup(e,admin=false){return `<article class="academic-event-item"><span class="academic-event-date">${escapeHTML(academicDateLabel(e.start,e.end||e.start))}</span><div class="academic-event-copy"><span class="tag">${escapeHTML(e.category||'Akademik')}</span><h3>${escapeHTML(e.title)}</h3>${e.description?`<p>${escapeHTML(e.description)}</p>`:''}</div>${admin?`<button type="button" class="reject academic-delete" data-academic-delete="${escapeHTML(e.id)}">Hapus</button>`:''}</article>`;}
function academicEventsOnDate(date){return academicEvents().filter(e=>e.start<=date&&(e.end||e.start)>=date).sort((a,b)=>a.start.localeCompare(b.start));}
function academicCalendarGridMarkup(cursor,selected){const year=cursor.getFullYear(),month=cursor.getMonth(),first=new Date(year,month,1),days=new Date(year,month+1,0).getDate(),offset=(first.getDay()+6)%7;let html='';for(let i=0;i<offset;i++)html+='<div class="academic-day empty" aria-hidden="true"></div>';for(let day=1;day<=days;day++){const date=academicDateKey(new Date(year,month,day)),events=academicEventsOnDate(date),classes=['academic-day'];if(date===selected)classes.push('selected');if(events.length)classes.push('has-events');html+=`<button type="button" class="${classes.join(' ')}" data-academic-day="${date}"><span class="academic-day-number">${day}</span>${events.length?`<span class="academic-day-dots" aria-label="${events.length} agenda">${'<i></i>'.repeat(Math.min(events.length,3))}</span>`:''}<span class="academic-day-count">${events.length?events.length+' agenda':''}</span></button>`;}return html;}
function ensureAcademicPopup(){if($('academicEventPopup'))return;document.body.insertAdjacentHTML('beforeend',`<div class="academic-popup-backdrop" id="academicEventPopup" aria-hidden="true"><section class="academic-popup" role="dialog" aria-modal="true" aria-labelledby="academicPopupTitle"><div class="academic-popup-grabber"></div><button type="button" class="academic-popup-close" id="academicPopupClose" aria-label="Tutup popup">×</button><p class="academic-popup-eyebrow">HORIZON UNIVERSITY · SY 2026/2027</p><h2 id="academicPopupTitle">Agenda Akademik</h2><div id="academicPopupBody"></div></section></div>`);const popup=$('academicEventPopup');$('academicPopupClose').addEventListener('click',closeAcademicPopup);popup.addEventListener('click',e=>{if(e.target===popup)closeAcademicPopup();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAcademicPopup();});}function closeAcademicPopup(){const p=$('academicEventPopup');if(!p)return;p.classList.remove('is-open');p.setAttribute('aria-hidden','true');document.body.classList.remove('academic-popup-open');}function openAcademicPopup(date,kind){ensureAcademicPopup();const isAdmin=kind==='admin',events=academicEventsOnDate(date),label=new Date(date+'T00:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});$('academicPopupTitle').textContent=label;$('academicPopupBody').innerHTML=events.length?`<div class="academic-popup-events">${events.map(e=>academicEventMarkup(e,isAdmin)).join('')}</div>`:`<div class="academic-popup-empty"><span class="academic-popup-empty-icon">✦</span><h3>Belum ada agenda</h3><p>Tidak ada kegiatan akademik pada tanggal ini.</p></div>`;const p=$('academicEventPopup');p.classList.add('is-open');p.setAttribute('aria-hidden','false');document.body.classList.add('academic-popup-open');$('academicPopupBody').querySelectorAll('[data-academic-delete]').forEach(b=>b.addEventListener('click',()=>{saveAcademicEvents(academicEvents().filter(e=>e.id!==b.dataset.academicDelete));renderAcademicCalendar('admin');renderAcademicCalendar('student');openAcademicPopup(date,'admin');}));}function renderAcademicCalendar(kind){const isAdmin=kind==='admin',cursor=isAdmin?adminCalendarCursor:studentCalendarCursor,selected=isAdmin?adminSelectedDate:studentSelectedDate,grid=$(isAdmin?'adminAcademicGrid':'studentAcademicGrid'),heading=$(isAdmin?'adminCalendarHeading':'studentCalendarHeading'),title=$(isAdmin?'adminSelectedDateTitle':'studentSelectedDateTitle'),list=$(isAdmin?'adminAcademicEvents':'studentAcademicEvents');if(!grid)return;heading.textContent=academicMonthNames[cursor.getMonth()]+' '+cursor.getFullYear();grid.innerHTML=academicCalendarGridMarkup(cursor,selected);const selectedEvents=academicEventsOnDate(selected);title.textContent='Agenda · '+new Date(selected+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});list.innerHTML=selectedEvents.length?selectedEvents.map(e=>academicEventMarkup(e,isAdmin)).join(''):'<div class="empty-state">Tidak ada agenda pada tanggal ini.</div>';grid.querySelectorAll('[data-academic-day]').forEach(btn=>btn.addEventListener('click',()=>{const date=btn.dataset.academicDay;if(isAdmin)adminSelectedDate=date;else studentSelectedDate=date;renderAcademicCalendar(kind);openAcademicPopup(date,kind);}));if(isAdmin)list.querySelectorAll('[data-academic-delete]').forEach(b=>b.addEventListener('click',()=>{saveAcademicEvents(academicEvents().filter(e=>e.id!==b.dataset.academicDelete));renderAcademicCalendar('admin');renderAcademicCalendar('student');}));}
function renderStudentAcademicCalendar(){renderAcademicCalendar('student');}
function renderAdminAcademicCalendar(){renderAcademicCalendar('admin');}
function moveAcademicMonth(kind,delta){const isAdmin=kind==='admin';let cursor=isAdmin?adminCalendarCursor:studentCalendarCursor;cursor=new Date(cursor.getFullYear(),cursor.getMonth()+delta,1);if(cursor<new Date(2026,6,1))cursor=new Date(2026,6,1);if(cursor>new Date(2027,5,1))cursor=new Date(2027,5,1);if(isAdmin){adminCalendarCursor=cursor;adminSelectedDate=academicDateKey(cursor);}else{studentCalendarCursor=cursor;studentSelectedDate=academicDateKey(cursor);}renderAcademicCalendar(kind);}
$('studentCalendarPrev')?.addEventListener('click',()=>moveAcademicMonth('student',-1));$('studentCalendarNext')?.addEventListener('click',()=>moveAcademicMonth('student',1));$('adminCalendarPrev')?.addEventListener('click',()=>moveAcademicMonth('admin',-1));$('adminCalendarNext')?.addEventListener('click',()=>moveAcademicMonth('admin',1));
$('adminAcademicEventForm')?.addEventListener('submit',e=>{e.preventDefault();const start=$('academicEventStart').value,end=$('academicEventEnd').value||start;if(end<start){alert('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');return;}const events=academicEvents();events.push({id:'custom-'+Date.now(),start,end,title:$('academicEventTitle').value.trim(),category:$('academicEventCategory').value,description:$('academicEventDescription').value.trim(),seed:false});saveAcademicEvents(events);e.target.reset();renderAdminAcademicCalendar();renderStudentAcademicCalendar();});

// Navigasi satu halaman: satu menu ditampilkan pada satu waktu
function openTab(tab) {
  const studentTabs = ['academicCalendar','schedule','calendarHub','profile','locations','booking','inventoryRequest','directory','planner','announcements','history'];
  const adminTabs = ['manageAcademicCalendar','approval','manageSchedule','manageClasses','manageLecturers','manageAnnouncements','manageStudents','manageRooms','inventory'];
  if (currentUser?.role === 'admin' && studentTabs.includes(tab)) tab = 'home';
  if (currentUser?.role === 'mahasiswa' && adminTabs.includes(tab)) tab = 'home';
  if (tab === 'calendarHub') tab = 'schedule';
  document.querySelectorAll('.tab-content').forEach(section => section.classList.add('hidden'));
  $(tab + 'Tab').classList.remove('hidden');
  const activeNavTab = ['academicCalendar','schedule'].includes(tab) ? 'calendarHub' : tab;
  document.querySelectorAll('.nav-button').forEach(button => button.classList.toggle('active', button.dataset.tab === activeNavTab));
  document.querySelectorAll('[data-calendar-view]').forEach(button => { const active = button.dataset.calendarView === tab; button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); });
  if (tab === 'academicCalendar') renderStudentAcademicCalendar();
  if (tab === 'manageAcademicCalendar') renderAdminAcademicCalendar();
  if (tab === 'schedule') renderSchedule();
  if (tab === 'profile') { renderStudentProfile(); renderProfileSettings(); setProfileSubtab('profile'); }
  if (tab === 'locations') renderOfficialMap();
  if (tab === 'directory') renderStudentDirectory();
  if (tab === 'inventory') renderInventoryAdmin();
  if (tab === 'inventoryRequest') renderStudentInventory();
  if (tab === 'booking') renderBookingRooms();
  if (tab === 'planner') renderPlanner();
  if (tab === 'home') renderHomePlanner();
  if (tab === 'history') renderHistory();
  if (tab === 'approval') renderApprovals();
  if (tab === 'manageSchedule') renderAdminSchedules();
  if (tab === 'manageClasses') renderAdminClasses();
  if (tab === 'manageLecturers') renderAdminLecturers();
  if (tab === 'manageAnnouncements') renderAdminAnnouncements();
  if (tab === 'manageStudents') renderAdminStudents();
  if (tab === 'manageRooms') renderAdminRooms();
  closeDrawer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('.nav-button').forEach(button => button.addEventListener('click', () => openTab(button.dataset.tab)));
document.querySelectorAll('[data-calendar-view]').forEach(button => button.addEventListener('click', () => openTab(button.dataset.calendarView)));

document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => openTab(button.dataset.go)));
function openDrawer() { document.body.classList.add('drawer-open'); $('menuToggle').setAttribute('aria-expanded','true'); }
function closeDrawer() { document.body.classList.remove('drawer-open'); const toggle = $('menuToggle'); if (toggle) toggle.setAttribute('aria-expanded','false'); }
$('menuToggle').addEventListener('click', () => document.body.classList.contains('drawer-open') ? closeDrawer() : openDrawer());
$('drawerOverlay').addEventListener('click', closeDrawer);
if ($('drawerClose')) $('drawerClose').addEventListener('click', closeDrawer);
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDrawer(); });
$('profileShortcut').addEventListener('click', () => { const panel=$('profileDropdown'); const opening=panel.classList.contains('hidden'); panel.classList.toggle('hidden',!opening); $('profileShortcut').setAttribute('aria-expanded',String(opening)); });
document.querySelectorAll('[data-profile-action]').forEach(button=>button.addEventListener('click',()=>{const action=button.dataset.profileAction;$('profileDropdown').classList.add('hidden');$('profileShortcut').setAttribute('aria-expanded','false');if(action==='profile')openTab('profile');else if(action==='preferences'){openTab('profile');setProfileSubtab('preferences');}else if(action==='help')openTab('directory');}));
$('profileDropdownLogout').addEventListener('click',logout);
$('sidebarProfileShortcut')?.addEventListener('click',()=>openTab('profile'));
$('sidebarSettingsShortcut')?.addEventListener('click',()=>{openTab('profile');setProfileSubtab('preferences');});
document.addEventListener('click',event=>{if(!$('profileDropdown').contains(event.target)&&!$('profileShortcut').contains(event.target)){$('profileDropdown').classList.add('hidden');$('profileShortcut').setAttribute('aria-expanded','false');}});
function setProfileSubtab(name){document.querySelectorAll('[data-profile-tab]').forEach(button=>{const active=button.dataset.profileTab===name;button.classList.toggle('active',active);if(button.hasAttribute('role'))button.setAttribute('aria-selected',String(active));});document.querySelectorAll('[data-profile-panel]').forEach(panel=>panel.classList.toggle('hidden',panel.dataset.profilePanel!==name));}
document.querySelectorAll('[data-profile-tab]').forEach(button=>button.addEventListener('click',()=>{setProfileSubtab(button.dataset.profileTab);if(button.classList.contains('profile-edit-trigger'))$('profilePhotoInput').click();}));
// Notification center: ringkasan lokal berdasarkan aktivitas akun yang sedang login.
function notificationReadKey(){return `horizonHubReadNotifications_${currentUser?.username || 'guest'}`;}
function readNotificationIds(){try{return JSON.parse(localStorage.getItem(notificationReadKey()))||[];}catch(e){return [];}}
function buildStudentNotifications(){
  if(!currentUser)return [];
  const mineRequests=requests.filter(x=>x.username===currentUser.username);
  const mineTasks=tasks.filter(x=>x.username===currentUser.username&&!x.done);
  const notices=[];
  const prefs=accounts[currentUser.username]?.preferences||{};
  if(prefs.booking!==false){mineRequests.slice().reverse().forEach(x=>{if(['Disetujui','Ditolak','Dibatalkan'].includes(x.status))notices.push({id:`request-${x.id}-${x.status}`,icon:'booking',title:`Peminjaman ${x.status.toLowerCase()}`,body:`Pengajuan ${x.resource||'fasilitas'} · ${x.date||''}`,tab:'history'});});assetLoanData().filter(x=>x.username===currentUser.username&&['Disetujui','Dipinjam','Ditolak','Dikembalikan','Overdue'].includes(x.status)).forEach(x=>notices.push({id:`asset-${x.id}-${x.status}`,icon:'booking',title:`Inventaris ${x.status.toLowerCase()}`,body:`${x.item} · ${x.date}`,tab:'history'}));}
  const today=localDateString();
  if(prefs.tasks!==false) mineTasks.filter(x=>x.date<=today).forEach(x=>notices.push({id:`task-${x.id}`,icon:'task',title:x.date<today?'Tugas melewati tenggat':'Pengingat tugas hari ini',body:x.title,tab:'planner'}));
  if(prefs.announcements!==false) announcementData().slice().reverse().forEach((x,i)=>notices.push({id:`announcement-${x.id||x.date+'-'+x.title}`,icon:'announcement',title:x.title,body:x.category||'Pengumuman kampus',tab:'announcements'}));
  return notices.slice(0,8);
}
function notificationIconSVG(type) {
  const paths = {
    booking: '<path d="M4 7h16M6 3v4m12-4v4M5 5h14a2 2 0 0 1 2 2v12H3V7a2 2 0 0 1 2-2Z"/><path d="m8 13 2.5 2.5L16 10"/>',
    task: '<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 2v4m8-4v4M8 11h8m-8 4h5"/>',
    announcement: '<path d="M4 14V9a2 2 0 0 1 2-2h3l9-4v17l-9-4H6a2 2 0 0 1-2-2Z"/><path d="m8 16 1.5 5h3L11 16"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[type] || paths.announcement}</svg>`;
}
function renderNotificationCenter(){
  const list=$('notificationList');if(!list||!currentUser)return;
  const notices=currentUser.role==='mahasiswa'?buildStudentNotifications():[...requests.filter(x=>x.status==='Menunggu').map(x=>({id:`admin-request-${x.id}`,icon:'booking',title:'Booking ruangan menunggu persetujuan',body:`${x.borrower||'Mahasiswa'} · ${x.resource||'Fasilitas'}`,tab:'approval'})),...assetLoanData().filter(x=>x.status==='Menunggu').map(x=>({id:`admin-asset-${x.id}`,icon:'booking',title:'Inventaris menunggu persetujuan',body:`${accounts[x.username]?.name||x.username} · ${x.item}`,tab:'inventory'}))].slice(0,8);
  const read=readNotificationIds();const unread=notices.filter(x=>!read.includes(x.id));
  $('notificationCount').textContent=unread.length;$('notificationCount').classList.toggle('hidden',unread.length===0);
  $('notificationSubtitle').textContent=unread.length?`${unread.length} informasi belum dibaca`:'Semua informasi sudah dibaca';
  $('overviewUnreadCount') && ($('overviewUnreadCount').textContent=unread.length);
  list.innerHTML=notices.length?notices.map(x=>`<button type="button" class="notification-item ${read.includes(x.id)?'is-read':'is-unread'}" data-notification-id="${escapeHTML(x.id)}" data-notification-tab="${x.tab}"><span class="notification-item-icon">${notificationIconSVG(x.icon)}</span><span class="notification-item-copy"><b>${escapeHTML(x.title)}</b><small>${escapeHTML(x.body)}</small></span>${read.includes(x.id)?'':'<i aria-label="Belum dibaca"></i>'}</button>`).join(''):'<div class="empty-state">Belum ada notifikasi baru.</div>';
}
function markAllNotificationsRead(){const ids=currentUser?.role==='admin'?[...requests.filter(x=>x.status==='Menunggu').map(x=>`admin-request-${x.id}`),...assetLoanData().filter(x=>x.status==='Menunggu').map(x=>`admin-asset-${x.id}`)]:buildStudentNotifications().map(x=>x.id);localStorage.setItem(notificationReadKey(),JSON.stringify(ids));renderNotificationCenter();}
$('notificationToggle').addEventListener('click',()=>{const panel=$('notificationPanel');const opening=panel.classList.contains('hidden');panel.classList.toggle('hidden',!opening);$('notificationToggle').setAttribute('aria-expanded',String(opening));if(opening)renderNotificationCenter();});
$('markNotificationsRead').addEventListener('click',markAllNotificationsRead);
$('notificationList').addEventListener('click',event=>{const item=event.target.closest('[data-notification-id]');if(!item)return;const read=readNotificationIds();if(!read.includes(item.dataset.notificationId))read.push(item.dataset.notificationId);localStorage.setItem(notificationReadKey(),JSON.stringify(read));$('notificationPanel').classList.add('hidden');$('notificationToggle').setAttribute('aria-expanded','false');openTab(item.dataset.notificationTab);});
$('overviewNotificationLink').addEventListener('click',()=>{$('notificationPanel').classList.remove('hidden');$('notificationToggle').setAttribute('aria-expanded','true');renderNotificationCenter();});
document.addEventListener('click',event=>{if(!$('notificationPanel').contains(event.target)&&!$('notificationToggle').contains(event.target)){$('notificationPanel').classList.add('hidden');$('notificationToggle').setAttribute('aria-expanded','false');}});

document.querySelectorAll('[data-open-profile-settings]').forEach(button => button.addEventListener('click', () => openTab('profile')));

// Jadwal vertikal - data contoh dari referensi yang dikirim
let weeklyClasses = [
  { day: 'Senin', date: 'Senin', classes: [
    ['18.30 – 19.10','GEN 2','Bahasa Indonesia','Online'], ['19.10 – 19.30','BREAK','Istirahat',''], ['19.30 – 21.10','ICT 003','OOP Java 1','Online'] ] },
  { day: 'Selasa', date: 'Selasa', classes: [
    ['18.30 – 20.10','MAT 001','Kalkulus','E401'], ['20.10 – 20.30','BREAK','Istirahat',''], ['20.30 – 22.10','ICT 001','Algoritma','E202'] ] },
  { day: 'Rabu', date: 'Rabu', classes: [
    ['18.30 – 20.10','ICT 001','Algoritma','Lab Multimedia'], ['20.10 – 20.30','BREAK','Istirahat',''], ['20.30 – 22.00','GEN 022','GWEP 1','E303'] ] },
  { day: 'Kamis', date: 'Kamis', classes: [
    ['17.30 – 18.30','GEN 2','Bahasa Indonesia','W107'], ['18.30 – 20.10','ICT 003','OOP Java 1','Lab Multimedia'], ['20.10 – 20.30','BREAK','Istirahat',''], ['20.30 – 22.10','ICT 002','Pemrograman Dasar','Lab Comp 2'] ] },
  { day: 'Jumat', date: 'Jumat', classes: [
    ['19.30 – 20.30','GEN 022','GWEP 1','Online'], ['20.30 – 22.10','ICT 002','Pemrograman Dasar','Online'] ] }
];
const defaultWeeklyClasses = JSON.parse(JSON.stringify(weeklyClasses));
// Jadwal mahasiswa dan admin memakai satu sumber data: horizonHubAdminSchedule.
// Data jadwal lama IF-KA Y1S1 dimigrasikan satu kali sebagai data awal prototype.
function parseScheduleClock(value) {
  const match = String(value || '').match(/(\\d{1,2})[.:](\\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}
function studentScheduleForAccount(student = {}) {
  const className = student.className || 'IF-KA';
  const semester = student.semester || 'Y1S1';
  const source = adminScheduleData().filter(x => x.className === className && x.semester === semester);
  const days = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  return days.map(day => {
    const entries = source.filter(x => x.day === day).sort((a,b) => parseScheduleClock(a.time) - parseScheduleClock(b.time));
    const classes = [];
    entries.forEach((item,index) => {
      if (index > 0) {
        const previous = entries[index - 1];
        const prevEnd = String(previous.time || '').split('–')[1] || '';
        const nextStart = String(item.time || '').split('–')[0] || '';
        const gap = parseScheduleClock(nextStart) - parseScheduleClock(prevEnd);
        if (gap >= 15 && gap <= 45) {
          const from = prevEnd.trim(), to = nextStart.trim();
          classes.push([`${from} – ${to}`,'BREAK','Istirahat','']);
        }
      }
      classes.push([item.time,item.code,item.course,item.room]);
    });
    return {day,date:day,classes};
  });
}
function renderSchedule() {
  const student = currentUser && currentUser.role === 'mahasiswa'
    ? (accounts[currentUser.username] || {}) : {};
  $('printStudentName').textContent = student.name || currentUser?.name || 'Administrator';
  $('printStudentNim').textContent = student.nim || '—';
  $('printStudentProgram').textContent = student.program || '—';
  $('printStudentClass').textContent = student.className || '—';
  $('printStudentSemester').textContent = student.semester || '—';

  const today = new Date();
  const dateText = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(today);
  $('todayDate').textContent = dateText.charAt(0).toUpperCase() + dateText.slice(1);
  $('todaySubtitle').textContent = `${student.className || 'Jadwal Akademik'} · ${student.semester || ''}`;

  const studentWeeklyClasses = studentScheduleForAccount(student);
  const dayNames = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const todayName = dayNames[today.getDay()];
  const todayData = studentWeeklyClasses.find(day => day.day === todayName);
  const classesToday = todayData ? todayData.classes.filter(item => item[1] !== 'BREAK') : [];
  $('todayClassCount').textContent = `${classesToday.length} KELAS`;
  $('todayClasses').innerHTML = classesToday.length
    ? classesToday.map(item => `<button type="button" class="today-class-item clickable-class" data-class-code="${item[1]}" data-class-name="${item[2]}" data-class-time="${item[0]}" data-class-room="${item[3]}" data-class-day="${todayName}">
        <time>${item[0]}</time><span class="today-class-copy"><b>${item[1]} · ${item[2]}</b><small>Lokasi: ${item[3] || 'Belum ditentukan'}</small></span><span class="class-open-hint">Detail ↗</span>
      </button>`).join('')
    : `<div class="today-empty"><span class="today-empty-icon">✓</span><b>No Class Today – Enjoy Your Day!</b><p>Tidak ada jadwal perkuliahan untuk hari ${todayName}.</p></div>`;

  const saturdayData = studentWeeklyClasses.find(day => day.day === 'Sabtu');
  const saturdayClasses = saturdayData ? saturdayData.classes.filter(item => item[1] !== 'BREAK') : [];
  const weekdaySchedule = studentWeeklyClasses.filter(day => day.day !== 'Sabtu' && day.day !== 'Minggu');
  const weeklyCards = weekdaySchedule.map(day => `
    <article class="day-block ${day.day === todayName ? 'is-today' : ''}">
      <div class="day-label"><b>${day.day}</b><small>${day.day === todayName ? 'Hari ini' : `${day.classes.filter(item => item[1] !== 'BREAK').length} Mata Kuliah`}</small></div>
      <div class="day-classes">${day.classes.map(item => item[1] === 'BREAK'
        ? `<div class="schedule-item break"><time>${item[0]}</time><strong>Istirahat</strong></div>`
        : `<button type="button" class="schedule-item clickable-class" data-class-code="${item[1]}" data-class-name="${item[2]}" data-class-time="${item[0]}" data-class-room="${item[3]}" data-class-day="${day.day}">
          <span class="schedule-time"><time>${item[0]}</time><span class="schedule-mode">${item[3] === 'Online' ? 'Online' : 'Tatap muka'}</span></span>
          <span class="schedule-main"><strong>${item[1]}</strong><b class="schedule-course">${item[2]}</b></span>
          <span class="schedule-location">${item[3] === 'Online' ? 'Kelas online' : 'Ruang ' + item[3]} <span aria-hidden="true">›</span></span>
        </button>`).join('')}</div>
    </article>`);
  if (saturdayClasses.length) {
    weeklyCards.push(`<article class="day-block"><div class="day-label"><b>Sabtu</b><small>${saturdayClasses.length} Mata Kuliah</small></div><div class="day-classes">${saturdayClasses.map(item => `<button type="button" class="schedule-item clickable-class" data-class-code="${item[1]}" data-class-name="${item[2]}" data-class-time="${item[0]}" data-class-room="${item[3]}" data-class-day="Sabtu"><span class="schedule-time"><time>${item[0]}</time><span class="schedule-mode">${item[3] === 'Online' ? 'Online' : 'Tatap muka'}</span></span><span class="schedule-main"><strong>${item[1]}</strong><b class="schedule-course">${item[2]}</b></span><span class="schedule-location">${item[3] === 'Online' ? 'Kelas online' : 'Ruang ' + item[3]} <span aria-hidden="true">›</span></span></button>`).join('')}</div></article>`);
    weeklyCards.push(`<article class="day-block weekend-block sunday-only"><div class="day-label"><b>Minggu</b><small>Waktu istirahat</small></div><div class="weekend-message"><span aria-hidden="true">♡</span><b>Tidak ada jadwal kuliah</b></div></article>`);
  } else {
    weeklyCards.push(`<article class="day-block weekend-block"><div class="day-label"><b>Sabtu – Minggu</b><small>Waktu istirahat</small></div><div class="weekend-message"><span aria-hidden="true">♡</span><b>Tidak ada jadwal kuliah</b><small>Waktu bebas untuk istirahat atau menyelesaikan aktivitas pribadi.</small></div></article>`);
  }
  $('weeklySchedule').innerHTML = weeklyCards.join('');
}
// Ikon kalender pada kartu TODAY membuka/menyorot jadwal mingguan.
$('todayCalendarButton')?.addEventListener('click', () => {
  const weekly = $('weeklySchedule');
  if (weekly) { weekly.scrollIntoView({behavior:'smooth', block:'start'}); weekly.classList.add('calendar-focus'); setTimeout(() => weekly.classList.remove('calendar-focus'), 1400); }
});

function renderStudentProfile() {
  const student = currentUser && currentUser.role === 'mahasiswa' ? (accounts[currentUser.username] || {}) : {};
  const name = student.name || currentUser?.name || 'Administrator';
  const photo = student.photo || 'assets/avatar-default.svg';
  $('profileStudentName').textContent = profileDisplayName(student);
  const profileImage = $('profileStudentPhoto');
  if (profileImage) profileImage.src = photo;
  const headerPhoto = document.querySelector('.mini-avatar img'); if (headerPhoto) headerPhoto.src = photo;
  $('profileStudentNim').textContent = `NIM: ${student.nim || '—'}`;
  $('profileStudentMeta').textContent = `${student.role === 'admin' ? 'Administrator' : 'Mahasiswa'} · ${student.program || 'Program studi belum diatur'}`;
  $('profileNameDetail').textContent = name;
  $('profileNimDetail').textContent = student.nim || '—';
  $('profileUsername').textContent = currentUser?.username || '—';
  $('profileProgram').textContent = student.program || '—';
  $('profileClass').textContent = student.className ? `${student.className} · ${student.classType || ''}` : '—';
  $('profileSemester').textContent = student.semester || '—';
  $('profileEmail').textContent = student.email || 'Belum diatur';
}
function renderProfileSettings() {
  pendingProfilePhoto = null;
  loadProfilePreferences();
  const account = activeAccount();
  $('settingsFullName').value = account.name || currentUser?.name || '';
  $('settingsNickname').value = account.nickname || '';
  const mode = account.displayMode || (account.nickname ? 'nickname' : 'fullname');
  document.querySelectorAll('input[name="profileDisplayMode"]').forEach(input => input.checked = input.value === mode);
  const photo = account.photo || (account.role === 'admin' ? 'assets/logo-horizon.webp' : 'assets/avatar-default.svg');
  const profilePhoto = $('profileStudentPhoto'); if (profilePhoto) profilePhoto.src = photo;
  const profileName = $('profileStudentName'); if (profileName) profileName.textContent = profileDisplayName(account);
  $('profilePhotoInput').value = '';
  $('profileSettingsMessage').textContent = '';
}

function openClassDetail(data) {
  const code = data.code || '—';
  const occurrenceKey = `${data.day || ''}|${code}|${data.time || ''}`;
  const adminClass = adminScheduleData().find(x => x.day === data.day && x.time === data.time && x.code === code && x.className === (accounts[currentUser?.username]?.className || 'IF-KA') && x.semester === (accounts[currentUser?.username]?.semester || 'Y1S1'));
  const extra = { ...(classDetails[code] || { lecturer: 'Belum tercantum', session: 'Belum tercantum', meeting: 'Belum tercantum', mode: data.room === 'Online' ? 'Online' : 'Offline', room: data.room || 'Belum ditentukan', link: '' }) };
  if (adminClass) { extra.lecturer = adminClass.lecturer; extra.room = adminClass.room; extra.mode = adminClass.mode || (String(adminClass.room).toLowerCase() === 'online' ? 'Online' : 'Offline'); extra.note = adminClass.note || ''; }
  const [start, end] = (data.time || '').split('–').map(value => value.trim());
  const now = new Date();
  const current = `${String(now.getHours()).padStart(2,'0')}.${String(now.getMinutes()).padStart(2,'0')}`;
  const status = start && end ? (current < start ? 'Akan datang' : current <= end ? 'Sedang berlangsung' : 'Selesai') : 'Jadwal kelas';
  $('classModalTitle').textContent = data.name || 'Detail Mata Kuliah';
  $('classModalCode').textContent = `${code} · ${currentUser?.role === 'mahasiswa' ? (accounts[currentUser.username]?.className || 'Kelas') : 'Kelas'} `;
  $('classModalStatus').textContent = status;
  $('classModalStatus').className = `status ${status === 'Sedang berlangsung' ? 'approved' : status === 'Selesai' ? 'completed' : 'pending'}`;
  const student = currentUser && accounts[currentUser.username] ? accounts[currentUser.username] : {};
  const details = [
    ['Hari', data.day || '—'], ['Waktu', data.time || '—'], ['Dosen', extra.lecturer],
    ['Program Studi', student.program || 'Informatika (IF)'], ['Kelas', student.className || 'IF-KA'],
    ['Semester', student.semester || 'Y1S1'],
    ['Metode', extra.mode], ['Ruangan / Lokasi', extra.room || data.room || 'Belum ditentukan']
  ];
  $('classDetailGrid').innerHTML = details.map(([label,value]) => `<div><small>${label}</small><b>${escapeHTML(value)}</b></div>`).join('');
  $('classModalNote').textContent = extra.note || 'Informasi mata kuliah ditampilkan berdasarkan data jadwal yang tersedia.';
  $('joinClassButton').classList.toggle('hidden', !(extra.link && extra.mode === 'Online'));
  if (extra.link) $('joinClassButton').href = extra.link;
  $('classModal').classList.remove('hidden');
  document.body.classList.add('modal-open');
}
document.addEventListener('click', event => {
  const card = event.target.closest('.clickable-class');
  if (card) openClassDetail({ code: card.dataset.classCode, name: card.dataset.className, time: card.dataset.classTime, room: card.dataset.classRoom, day: card.dataset.classDay });
});
function closeClassDetail() { $('classModal').classList.add('hidden'); document.body.classList.remove('modal-open'); }
$('closeClassModal').addEventListener('click', closeClassDetail);
$('closeClassModalBottom').addEventListener('click', closeClassDetail);
$('classModal').addEventListener('click', event => { if (event.target === $('classModal')) closeClassDetail(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeClassDetail(); closeDrawer(); } });

$('printSchedule').addEventListener('click', () => window.print());

// Satu sumber data untuk lantai dan ruang kelas yang boleh diajukan.
// Lantai yang hanya tercantum pada direktori tanpa layout/daftar ruang terverifikasi
// tetap dapat dilihat di Explore Campus, tetapi tidak ditawarkan pada form booking.
const BOOKABLE_FLOORS = Object.freeze({ W: [1, 2], E: [2, 3, 4, 5] });
const OFFICIAL_CLASSROOMS = Object.freeze({
  W: Object.freeze({
    1: ['W101B','W102B','W103C','W104C','W105C','W106C','W107C','W108C','W109C','W110C'],
    2: ['W201C','W202C','W203C','W204C','W205C','W206C','W207C']
  }),
  E: Object.freeze({
    2: ['E201','E202','E203','E204','E205'],
    3: ['E301','E302','E303','E304','E305'],
    4: ['E401'],
    5: ['E501','E502','E503','E504','E505']
  })
});
function bookableFloors(building) { return BOOKABLE_FLOORS[building] || []; }
function officialClassrooms(building, floor) { return (OFFICIAL_CLASSROOMS[building] || {})[Number(floor)] || []; }
function roomCode(building, floor, roomNo) {
  const number = String(roomNo).padStart(2, '0');
  return floor === 10 ? `E10${number}` : `${building}${floor}${number}`;
}
function fillFloorSelect(select, building) {
  const floors = bookableFloors(building);
  select.innerHTML = floors.map(floor => `<option value="${floor}">Lantai ${floor}</option>`).join('');
  if (!floors.includes(Number(select.value))) select.value = String(floors[0]);
}
function createRoomData(building, floor) {
  return officialClassrooms(building, Number(floor)).map((code, index) => ({
    code, building: building === 'W' ? 'West Building' : 'East Building', floor,
    roomNo: index + 1, capacity: null,
    facility: 'Belum ada data fasilitas terverifikasi'
  }));
}
function getConfiguredRoomCapacity(resource) {
  const capacities = readData('horizonHubRoomCapacities') || {};
  const value = Number(capacities[resource]);
  return Number.isFinite(value) && value > 0 ? value : null;
}
function syncBorrowerCapacity() {
  const field = $('borrowerCount');
  const hint = $('borrowerCapacityHint');
  if (!field) return;
  const resource = selectedRoom || (selectedCategory === 'classroom' ? '' : $('otherResource')?.value);
  const capacity = resource ? getConfiguredRoomCapacity(resource) : null;
  if (capacity) {
    field.max = String(capacity);
    field.placeholder = `Maksimal ${capacity} peserta`;
    if (hint) hint.textContent = `Kapasitas terdata untuk ${resource}: maksimal ${capacity} peserta.`;
  } else {
    field.removeAttribute('max');
    field.placeholder = 'Masukkan jumlah peserta';
    if (hint) hint.textContent = 'Kapasitas ruangan ini belum memiliki data resmi. Admin perlu mengisi kapasitas sebelum pembatasan jumlah peserta dapat diterapkan.';
  }
  validateBorrowerCount(false);
}
function validateBorrowerCount(showMessage = true) {
  const field = $('borrowerCount');
  const hint = $('borrowerCapacityHint');
  if (!field) return true;
  const count = Number(field.value);
  const capacity = getConfiguredRoomCapacity(selectedRoom || $('otherResource')?.value || '');
  const invalidNumber = field.value !== '' && (!Number.isInteger(count) || count < 1);
  const exceeds = !!capacity && field.value !== '' && count > capacity;
  field.setCustomValidity(invalidNumber || exceeds ? 'Jumlah peserta tidak sesuai dengan ketentuan ruangan.' : '');
  field.classList.toggle('input-invalid', invalidNumber || exceeds);
  if (hint && showMessage && exceeds) hint.textContent = `Jumlah peserta ${count} melebihi kapasitas ${selectedRoom || $('otherResource')?.value} (${capacity} orang). Kurangi jumlah peserta atau pilih ruangan yang lebih besar.`;
  else if (hint && showMessage && invalidNumber) hint.textContent = 'Masukkan jumlah peserta berupa bilangan bulat minimal 1.';
  else if (hint && showMessage && capacity) hint.textContent = `Kapasitas terdata untuk ${selectedRoom || $('otherResource')?.value}: maksimal ${capacity} peserta.`;
  return !invalidNumber && !exceeds;
}
$('borrowerCount')?.addEventListener('input', () => validateBorrowerCount(true));
function roomConflictDetails(resource, date, start, end, excludeBookingId=null) {
  const overlaps=(aStart,aEnd)=>start<aEnd&&end>aStart;
  const bookingConflict=requests.some(r=>r.id!==excludeBookingId&&!['Ditolak','Cancelled','Dibatalkan'].includes(r.status)&&r.resource===resource&&r.date===date&&overlaps(r.start,r.end));
  if(bookingConflict) return {type:'booking',message:'Ruangan sudah memiliki pengajuan atau booking pada waktu tersebut.'};

  const weekday=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][new Date(`${date}T12:00:00`).getDay()];
  const schedules=typeof adminScheduleData==='function'?adminScheduleData():[];
  const classConflict=schedules.some(s=>{
    if(s.day!==weekday || !s.room || s.room==='Online' || s.room!==resource) return false;
    const parts=String(s.time||'').split(/[–-]/).map(x=>x.trim());
    return parts.length===2&&overlaps(parts[0],parts[1]);
  });
  if(classConflict) return {type:'academic',message:'Ruangan berbenturan dengan jadwal perkuliahan reguler.'};

  const events=readData('horizonHubCampusEvents');
  const eventConflict=events.some(e=>e.resource===resource&&e.date===date&&overlaps(e.start,e.end)&&e.status!=='Cancelled');
  if(eventConflict) return {type:'event',message:'Ruangan digunakan untuk kegiatan resmi kampus.'};

  const maintenance=readData('horizonHubRoomMaintenance');
  const maintenanceConflict=maintenance.some(m=>m.resource===resource&&m.date===date&&overlaps(m.start||'00:00',m.end||'23:59')&&m.status!=='Completed'&&m.status!=='Cancelled');
  if(maintenanceConflict) return {type:'maintenance',message:'Ruangan sedang dijadwalkan untuk maintenance.'};
  return null;
}
function getRoomBookingState(resource, date, start, end) {
  if (!date || !start || !end || end <= start) return { state: 'unknown', label: 'Pilih waktu' };
  const blocked = readData('horizonHubBlockedRooms');
  if (blocked.includes(resource)) return { state: 'blocked', label: 'Tidak tersedia' };
  const conflicts = requests.filter(request => !['Ditolak','Cancelled','Dibatalkan'].includes(request.status) && request.resource === resource && request.date === date && start < request.end && end > request.start);
  if (conflicts.some(x=>x.status==='Menunggu')) return { state:'busy', label:'Waiting Approval' };
  if (conflicts.some(x=>x.status==='Disetujui')) return { state:'busy', label:'Booked' };
  const otherConflict=roomConflictDetails(resource,date,start,end);
  if(otherConflict) return {state:'busy',label:otherConflict.type==='academic'?'Jadwal Kuliah':otherConflict.type==='maintenance'?'Maintenance':otherConflict.type==='event'?'Kegiatan Kampus':'Tidak tersedia',detail:otherConflict.message};
  return { state:'available', label:'Available' };
}
function renderRoomCards(container, building, floor, forBooking) {
  const rooms = createRoomData(building, Number(floor));
  const date = forBooking ? $('bookingDate').value : '';
  const start = forBooking ? $('bookingStart').value : '';
  const end = forBooking ? $('bookingEnd').value : '';
  container.innerHTML = rooms.map(room => {
    const status = forBooking ? getRoomBookingState(room.code, date, start, end) : {state:'available',label:'Pilih ruangan'};
    const disabled = forBooking && (status.state === 'busy' || status.state === 'blocked');
    const capacity = getConfiguredRoomCapacity(room.code);
    return `<button type="button" class="room-option ${selectedRoom === room.code ? 'selected' : ''} ${disabled ? 'room-unavailable' : ''}" data-room="${room.code}" data-building="${room.building}" data-floor="${room.floor}" ${disabled ? 'disabled' : ''}>
      <span class="room-option-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20V8l9-5 9 5v12M3 12h18M7 20v-5h10v5"/><path d="M8 8h.01M16 8h.01"/></svg></span><b>${room.code}</b><small class="room-status-${status.state}">${status.label}</small><small>${capacity ? `Kapasitas ${capacity} orang` : 'Kapasitas belum didata'}</small>
    </button>`;
  }).join('');
  if (!rooms.length) {
    container.innerHTML = `<div class="inventory-empty"><b>Daftar ruang kelas belum tersedia</b><p>Denah lantai ini belum memiliki daftar kelas terverifikasi pada data yang diterima.</p></div>`;
  }
  if (forBooking) {
    const dateReady = date && start && end && end > start;
    const availableCount = rooms.filter(room => getRoomBookingState(room.code,date,start,end).state === 'available').length;
    $('bookingAvailabilitySummary').textContent = dateReady ? `${availableCount} dari ${rooms.length} ruangan tersedia untuk ${date} pukul ${start}–${end}. Pengajuan menunggu dan yang disetujui akan dianggap menahan slot.` : 'Pilih tanggal, waktu mulai, dan waktu selesai untuk mengecek ketersediaan.';
    if (selectedRoom && ['busy','blocked'].includes(getRoomBookingState(selectedRoom,date,start,end).state)) {
      selectedRoom = '';
      $('bookingRoomHint').textContent = 'Pilihan ruangan sebelumnya sudah tidak tersedia pada waktu tersebut. Silakan pilih ruangan lain.';
    }
  }
  container.querySelectorAll('[data-room]:not(:disabled)').forEach(button => button.addEventListener('click', () => {
    if (forBooking) {
      selectedRoom = button.dataset.room;
      syncBorrowerCapacity();
      $('bookingRoomHint').textContent = `Ruangan dipilih: ${selectedRoom} · ${button.dataset.building}, lantai ${button.dataset.floor}.`;
      renderBookingRooms();
    } else {
      $('locationCodeHint').textContent = `${button.dataset.room} · ${button.dataset.building}, lantai ${button.dataset.floor}, ruang ${button.dataset.room.slice(-2)}.`;
      container.querySelectorAll('.room-option').forEach(el => el.classList.remove('selected'));
      button.classList.add('selected');
    }
  }));
}
// Navigasi lokasi menggunakan denah resmi interaktif di bawah ini.
// Denah resmi West Building dan direktori ruang East Building.
const westFloorRooms = {
  1: ['Masjid Al-Amin','School Clinic','GSD','Conference Room Meeting','Management Office','Board Room','Marketing Office','SIS Dept','One Stop Shop','Classroom W.101B','Classroom W.102B','Registrar Dept / BAAK','CSDL','Finance Dept','Kasama Office','AQA Dept & LPPM','Canteen','Parking','HR Dept','HUSC Room','Employee Lounge','Theatre Room','Classroom W.103C','Classroom W.104C','Classroom W.105C','Classroom W.106C','Classroom W.107C','Classroom W.108C','MRF','Classroom W.109C','Classroom W.110C','Demonstration Lab 1','Demonstration Lab 2','Demonstration Lab 3','Engineering Laboratory','Network Laboratory','Tourism Laboratory','Generator Room'],
  2: ['Case Room','FMB Faculty Room','Library','Language Laboratory','FICT Faculty Room','Dispensing Room 1','Dispensing Room 2','FESS Faculty Room / Psychology Office','FHS Laboratory','ILKOM / PGSD / PAUD Office','GWEP / MKDU Office','Classroom W207C','Classroom W206C','Classroom W205C','Classroom W204C','Classroom W203C','Classroom W202C','Classroom W201C'],
  3: ['Multimedia Laboratory','Open Laboratory Computer','Radio Laboratory','IT-SD Dept']
};
const eastFloorRooms = {
  0:['Courtyard East Building','Support Team Room (GSD-ITSD)','Electricity Room','Generator Set','Canteen','Elevator / Lift'],
  2:['Classroom E.201','Classroom E.202','Classroom E.203','Classroom E.204','Classroom E.205','iOS Laboratory'],
  3:['Classroom E.301','Classroom E.302','Classroom E.303','Classroom E.304','Classroom E.305','Computer Laboratory 1'],
  4:['Classroom E.401','Collaborative Room 1','FHS Faculty Room','FHS Dean’s Office','Computer Laboratory 2'],
  5:['Classroom E.501','Classroom E.502','Classroom E.503','Classroom E.504','Classroom E.505','Collaborative Room 2','Computer Laboratory 3'],
  6:['E601','E602','E603','E604','E605','E606','Collaborative Room 3'],
  7:['E701','E702','E703','E704','E705','E706','E707'],
  8:['E801','E802','E803','E804','E805','E806','E807'],
  9:['E901','E902','E903','E904','E905','E906','E907'],
  10:['E1001','E1002','E1003','E1004','E1005','E1006','E1007']
};
// Posisi marker mengikuti nomor ruangan pada gambar layout resmi East Building (PDF halaman 1-5).
const eastMapMarkers = {
  // Marker menutup tepat angka hitam/putih bawaan denah, bukan diletakkan di bawahnya.
  0:[[43.4,43.5],[81.8,45.0],[88.5,40.0],[88.5,53.0],[86.5,20.0],[75.0,39.0]],
  2:[[33.8,50.9],[40.2,50.9],[47.2,50.9],[53.5,50.9],[83.8,50.9],[90.6,50.9]],
  3:[[34.0,50.9],[40.8,50.9],[47.7,50.9],[53.5,50.9],[85.5,51.4],[92.5,51.4]],
  4:[[34.0,50.9],[40.8,50.9],[59.7,53.3],[85.5,51.4],[93.0,51.4]],
  5:[[34.0,50.9],[40.8,50.9],[48.5,50.9],[55.5,50.9],[63.7,50.9],[85.5,51.4],[92.8,51.4]]
};
const eastRoomCodes = {
  2:['E201','E202','E203','E204','E205',''],
  3:['E301','E302','E303','E304','E305',''],
  4:['E401','','','',''],
  5:['E501','E502','E503','E504','E505','','']
};
const eastBookable = name => /Classroom|Laboratory|Collaborative Room/i.test(name) || /^E\d{3,4}$/.test(name);
function roomCodeForMap(name,building,floor,index){
  if(/^[EW]\d{3,4}$/.test(name)) return name;
  if(building==='E') return (eastRoomCodes[floor]||[])[index] || '';
  // Kode kelas West Building mengikuti ROOM LIST pada PDF resmi.
  const westCodes = {
    1: {9:'W101B',10:'W102B',22:'W103C',23:'W104C',24:'W105C',25:'W106C',26:'W107C',27:'W108C',29:'W109C',30:'W110C'},
    2: {11:'W207C',12:'W206C',13:'W205C',14:'W204C',15:'W203C',16:'W202C',17:'W201C'}
  };
  return (westCodes[floor]||{})[index] || '';
}
function showMapRoom(name,index,building,floor){
  const code=roomCodeForMap(name,building,floor,index);
  const floorHasVerifiedLayout = bookableFloors(building).includes(Number(floor));
  const canBook=floorHasVerifiedLayout && !!code && /Classroom|Laboratory|Demonstration Lab|Engineering Laboratory|Network Laboratory|Tourism Laboratory|Conference Room Meeting|Board Room|Theatre Room|Collaborative Room/i.test(name);
  $('mapRoomDetail').classList.remove('hidden');
  $('mapRoomDetail').innerHTML=`
    <div class="map-detail-heading">
      <span class="map-detail-kicker">DETAIL LOKASI</span>
      <span class="map-detail-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/></svg></span>
    </div>
    <h3>${name}</h3>
    <div class="map-detail-meta">
      <span><b>Gedung</b>${building==='W'?'West Building':'East Building'}</span>
      <span><b>Lantai</b>${floor===0?'Ground Floor':`Lantai ${floor}`}</span>
      ${code?`<span><b>Kode ruang</b>${code}</span>`:''}
    </div>
    <div class="map-detail-note"><span class="map-detail-dot"></span><p>${canBook?'Fasilitas tersedia: belum didata. Kapasitas dan perlengkapan ruangan menunggu konfirmasi data resmi kampus.':(building==='E' && floor>=6 ? 'Lantai ini baru tercantum pada direktori, belum tersedia denah/layout terverifikasi. Peminjaman belum dibuka.' : 'Lokasi ini tercantum pada denah, tetapi belum dikonfirmasi sebagai ruangan yang dapat dipinjam.')}</p></div>
    <button type="button" class="primary-button map-book-button" data-book-room="${code}" ${canBook?'':'disabled'}>${canBook?'Ajukan Peminjaman Ruangan':'Belum Tersedia untuk Dipinjam'} <span aria-hidden="true">→</span></button>`;
  // Pilihan detail ditampilkan dengan scroll halus agar panel detail langsung terlihat.
  $('mapRoomDetail').scrollIntoView({behavior:'smooth', block:'center'});
  const book=$('mapRoomDetail').querySelector('[data-book-room]');
  if(canBook) book.addEventListener('click',()=>{
    selectedRoom=code; selectedRoomName=name; selectedRoomBuilding=building==='W'?'West Building':'East Building'; selectedRoomFloor=floor===0?'Ground Floor':`Lantai ${floor}`; bookingFromMap=true;
    selectedCategory=/Laboratory/i.test(name)?'lab':/Theatre Room/i.test(name)?'hall':/Meeting|Board Room|Collaborative Room/i.test(name)?'meeting':'classroom';
    $('bookingBuilding').value=building; fillFloorSelect($('bookingFloor'),building); $('bookingFloor').value=String(floor); setCategory(selectedCategory); openTab('booking'); showBookingStep(3); renderSelectedRoomSummary();
  });
}
function renderOfficialMap(){
  const building=$('mapBuilding').value;
  let floor=Number($('mapFloor').value);
  if(building==='W'){
    const floors=[1,2,3];
    $('mapFloor').innerHTML=floors.map(n=>`<option value="${n}">Lantai ${n}</option>`).join('');
    floor=Math.min(Math.max(floor,1),3); $('mapFloor').value=String(floor);
    $('officialMapImage').innerHTML=`<img src="assets/west-floor-${floor}.png" alt="Denah resmi West Building lantai ${floor}">`;
    $('mapSourceNote').textContent='Denah resmi West Building. Ketuk penanda maroon pada nomor ruangan untuk melihat detail.';
    $('officialMapRooms').innerHTML='';
    // Titik marker dihitung dari posisi angka pada gambar denah PDF asli.
    // Persentase menggunakan bidang gambar penuh agar tetap sejajar saat responsif.
    const westMarkers={
      1:[[36.9,17.2],[28.1,17.2],[28.7,22.0],[39.4,30.0],[31.9,29.9],[37.9,40.7],[21.7,21.9],[25.4,29.9],[21.2,29.9],[23.2,40.7],[31.0,40.7],[13.4,25.7],[13.4,30.0],[12.0,38.3],[11.8,44.9],[11.8,56.7],[20.0,63.5],[32.8,49.7],[34.4,65.9],[38.8,67.1],[39.4,78.5],[32.8,76.8],[49.7,68.1],[54.9,68.1],[59.6,68.1],[64.6,68.1],[69.5,68.1],[74.2,68.1],[77.8,63.7],[76.0,88.8],[71.2,88.8],[62.7,88.8],[57.4,88.8],[52.7,88.8],[47.8,88.8],[42.7,88.8],[37.6,88.8],[6.1,25.7]],
      2:[[41.8,38.8],[34.5,29.5],[26.8,39.5],[13.4,40.0],[13.0,59.7],[32.8,63.5],[36.7,65.9],[41.2,65.7],[57.9,65.9],[41.2,78.4],[34.9,89.3],[41.5,89.3],[46.8,89.3],[52.1,89.3],[57.2,89.3],[62.2,89.3],[70.8,89.3],[75.4,89.3]],
      3:[[15.3,36.9],[13.6,59.2],[16.7,68.3],[11.1,68.3]]
    };
    const offset={1:1,2:38,3:56}[floor];
    const positions=westMarkers[floor]||[];
    $('officialMapImage').insertAdjacentHTML('beforeend',`<div class="map-hotspots">${positions.map((pos,i)=>`<button type="button" class="map-hotspot" style="left:${pos[0]}%;top:${pos[1]}%" data-hotspot-index="${i}" aria-label="Pilih ${westFloorRooms[floor][i]}">${offset+i}</button>`).join('')}</div>`);
    $('officialMapImage').querySelectorAll('[data-hotspot-index]').forEach(btn=>btn.addEventListener('click',()=>showMapRoom(westFloorRooms[floor][Number(btn.dataset.hotspotIndex)],Number(btn.dataset.hotspotIndex),'W',floor)));
  }else{
    const floors=[0,2,3,4,5,6,7,8,9,10];
    $('mapFloor').innerHTML=floors.map(n=>`<option value="${n}">${n===0?'Ground Floor':`Lantai ${n}`}</option>`).join('');
    if(!floors.includes(floor)) floor=0; $('mapFloor').value=String(floor);
    if(floor>=0 && floor<=5){
      const imageFile=floor===0?'east-floor-0.png':`east-floor-${floor}.png`;
      $('officialMapImage').innerHTML=`<img src="assets/${imageFile}" alt="Layout resmi East Building ${floor===0?'Ground Floor':`lantai ${floor}`}">`;
      $('mapSourceNote').textContent='Layout resmi East Building dari PDF yang diberikan. Ketuk marker bernomor atau nama ruang di daftar.';
    }else{
      $('officialMapImage').innerHTML=`<div class="east-directory-visual"><div class="east-directory-mark">EAST<br>BUILDING</div><p>Direktori lokasi</p><strong>Lantai ${floor}</strong><small>Gambar layout untuk lantai ini belum tersedia pada PDF yang diberikan.</small></div>`;
      $('mapSourceNote').textContent='Lantai 6–10 belum memiliki gambar layout pada dokumen yang diterima. Daftar ruang mengikuti direktori sebelumnya dan perlu verifikasi.';
    }
    $('officialMapRooms').innerHTML='';
    const coords=eastMapMarkers[floor];
    if(coords){
      const img=$('officialMapImage').querySelector('img');
      img.insertAdjacentHTML('afterend',`<div class="map-hotspots">${coords.map((pos,i)=>`<button type="button" class="map-hotspot" style="left:${pos[0]}%;top:${pos[1]}%" data-hotspot-index="${i}" aria-label="Pilih ${eastFloorRooms[floor][i]}">${i+1}</button>`).join('')}</div>`);
      $('officialMapImage').querySelectorAll('[data-hotspot-index]').forEach(btn=>btn.addEventListener('click',()=>showMapRoom(eastFloorRooms[floor][Number(btn.dataset.hotspotIndex)],Number(btn.dataset.hotspotIndex),'E',floor)));
    }
  }
  const floorRooms = building === 'W' ? (westFloorRooms[floor] || []) : (eastFloorRooms[floor] || []);
  const bookableNames = /Classroom|Laboratory|Demonstration Lab|Engineering Laboratory|Network Laboratory|Tourism Laboratory|Conference Room Meeting|Board Room|Theatre Room|Collaborative Room/i;
  const floorCanBeBooked = building === 'W' || (building === 'E' && floor >= 2 && floor <= 5);
  $('officialMapRooms').innerHTML = floorRooms.length ? `<div class="map-room-list-heading">Daftar lokasi lantai ${floor === 0 ? 'Ground Floor' : floor}</div><div class="map-room-list-grid">${floorRooms.map((name,index)=>`<button type="button" class="map-room-list-item" data-map-room-index="${index}"><span>${name}</span><small>${floorCanBeBooked && bookableNames.test(name) ? 'Ruang dapat diajukan' : 'Informasi lokasi · belum dapat dipinjam'}</small></button>`).join('')}</div>` : '<div class="inventory-empty">Daftar ruangan untuk lantai ini belum tersedia pada direktori yang diterima.</div>';
  $('officialMapRooms').querySelectorAll('[data-map-room-index]').forEach(button=>button.addEventListener('click',()=>showMapRoom(floorRooms[Number(button.dataset.mapRoomIndex)],Number(button.dataset.mapRoomIndex),building,floor)));
  $('mapRoomDetail').classList.add('hidden');
}
$('mapBuilding').addEventListener('change',()=>{ $('mapFloor').value=$('mapBuilding').value==='W'?'1':'0'; renderOfficialMap(); });
$('mapFloor').addEventListener('change',renderOfficialMap);
renderOfficialMap();

// Kategori peminjaman dan pilihan lokasi
function setCategory(category) {
  selectedCategory = category;
  if (!bookingFromMap) { selectedRoom = ''; selectedRoomName = ''; }
  document.querySelectorAll('.category-card').forEach(card => card.classList.toggle('selected', card.dataset.category === category));
  $('selectedCategoryTitle').textContent = `Pilih ${categoryNames[category]}`;
  const isClass = category === 'classroom';
  $('classroomFilters').classList.toggle('hidden', !isClass);
  $('bookingRoomGrid').classList.toggle('hidden', !isClass);
  $('otherResourceWrap').classList.toggle('hidden', isClass);
  $('bookingRoomHint').classList.toggle('hidden', !isClass);
  if (isClass) renderBookingRooms();
  else renderOtherResources();
}
document.querySelectorAll('.category-card').forEach(card => card.addEventListener('click', () => setCategory(card.dataset.category)));
// Navigasi peminjaman bertahap: kategori → ruangan → jadwal & detail
let bookingStep = 1;
function renderSelectedRoomSummary() {
  const target = $('bookingSelectedRoom');
  if (!target) return;
  if (!selectedRoom) { target.innerHTML = ''; return; }
  target.innerHTML = `<div class="selected-booking-room"><div><span class="eyebrow">RUANGAN TERPILIH DARI DENAH</span><h3>${selectedRoomName || selectedRoom}</h3><p>${selectedRoomBuilding} · ${selectedRoomFloor} · ${selectedRoom}</p></div><button type="button" class="text-button" id="changeBookingRoom">Ganti ruangan</button></div>`;
  $('changeBookingRoom').addEventListener('click', () => { bookingFromMap=false; showBookingStep(1); });
}
function showBookingStep(step) {
  bookingStep = step;
  setBookingDateLimits();
  document.querySelectorAll('[data-booking-step]').forEach(panel => panel.classList.toggle('hidden', Number(panel.dataset.bookingStep) !== step));
  document.querySelectorAll('[data-step-indicator]').forEach(item => { const n = Number(item.dataset.stepIndicator); item.classList.toggle('current', n === step); item.classList.toggle('completed', n < step); if (n === step) item.setAttribute('aria-current','step'); else item.removeAttribute('aria-current'); item.disabled = n > step; });
  if (step === 2) { if (selectedCategory === 'classroom') renderBookingRooms(); else renderOtherResources(); }
  if (step === 3) { syncBorrowerCapacity(); const hint = $('bookingRoomHintStep3'); if (hint) hint.textContent = `Pilihan: ${selectedRoomName || selectedRoom || $('otherResource').value}. Tentukan tanggal dan jam untuk memeriksa ketersediaan.`; renderSelectedRoomSummary(); }
  const panel = document.querySelector(`[data-booking-step="${step}"]`); if (panel) panel.scrollIntoView({behavior:'smooth',block:'start'});
}
$('bookingNext1').addEventListener('click', () => showBookingStep(2));
$('bookingBack2').addEventListener('click', () => showBookingStep(1));
$('bookingNext2').addEventListener('click', () => {
  const resource = selectedCategory === 'classroom' ? selectedRoom : $('otherResource').value;
  if (!resource) {
    $('bookingRoomHint').textContent = selectedCategory === 'classroom'
      ? 'Pilih salah satu kartu ruangan terlebih dahulu. Setelah kartu terpilih, tekan Lanjutkan.'
      : 'Pilih fasilitas dari daftar terlebih dahulu.';
    alert('Pilih ruangan atau fasilitas terlebih dahulu.');
    return;
  }
  showBookingStep(3);
});
$('bookingBack3').addEventListener('click', () => showBookingStep(2));
document.querySelectorAll('[data-step-indicator]').forEach(item => item.addEventListener('click', () => { const target = Number(item.dataset.stepIndicator); if (target === 1 && bookingStep > 1) { selectedRoom=''; selectedRoomName=''; bookingFromMap=false; showBookingStep(1); } else if (target === 2 && bookingStep > 2) { showBookingStep(2); } }));

function renderBookingRooms() {
  if (selectedCategory !== 'classroom') return;
  const building = $('bookingBuilding').value;
  const floor = Number($('bookingFloor').value);
  const validFloors = bookableFloors(building);
  if (!validFloors.includes(floor)) {
    $('bookingFloor').value = String(validFloors[0]);
  }
  const activeFloor = Number($('bookingFloor').value);
  renderRoomCards($('bookingRoomGrid'), building, activeFloor, true);
  const availableCodes = officialClassrooms(building, activeFloor);
  const roomCount = availableCodes.length;
  if (selectedRoom && !availableCodes.includes(selectedRoom)) { selectedRoom = ''; selectedRoomName = ''; bookingFromMap = false; renderSelectedRoomSummary(); }
  if (!selectedRoom) {
    syncBorrowerCapacity();
    $('bookingRoomHint').textContent = `${building === 'W' ? 'West Building' : 'East Building'} · Lantai ${activeFloor} — ${roomCount ? `${roomCount} pilihan ruang terdaftar` : 'belum ada daftar kelas terverifikasi'}. Pilih ruangan yang sesuai.`;
  }
}
function localDateString(date = new Date()) {
  const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function setBookingDateLimits() {
  const today = localDateString();
  $('bookingDate').min = today;
  $('assetLoanDate').min = today;
  if ($('bookingDate').value && $('bookingDate').value < today) $('bookingDate').value = '';
  if ($('assetLoanDate').value && $('assetLoanDate').value < today) $('assetLoanDate').value = '';
}
function validateBookingTime(showAlert = false) {
  const date = $('bookingDate').value, start = $('bookingStart').value, end = $('bookingEnd').value;
  const today = localDateString();
  const dateError = $('bookingDateError'), startError = $('bookingStartError'), endError = $('bookingEndError');
  [dateError,startError,endError].forEach(el => { if (el) el.textContent=''; });
  let valid = true;
  if (date && date < today) { if(dateError) dateError.textContent='Tanggal peminjaman tidak boleh kurang dari tanggal hari ini.'; valid=false; }
  if (date === today && start) {
    const now = new Date(), current = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    if (start < current) { if(startError) startError.textContent='Waktu mulai tidak boleh kurang dari waktu saat ini.'; valid=false; }
  }
  if (start && end && end <= start) { if(endError) endError.textContent='Waktu selesai harus lebih besar dari waktu mulai.'; valid=false; }
  if (!valid && showAlert) { const summary=$('bookingAvailabilitySummary'); if(summary) summary.textContent='Periksa kembali tanggal dan waktu peminjaman yang ditandai.'; }
  return valid;
}
function resetBookingRoomSelection() {
  selectedRoom = ''; selectedRoomName = ''; selectedRoomBuilding = ''; selectedRoomFloor = ''; bookingFromMap = false;
  const summary = $('bookingSelectedRoom');
  if (summary) summary.innerHTML = '';
  const stepHint = $('bookingRoomHintStep3');
  if (stepHint) stepHint.textContent = 'Pilih ruangan pada gedung dan lantai yang aktif.';
}
$('bookingBuilding').addEventListener('change', () => {
  resetBookingRoomSelection();
  fillFloorSelect($('bookingFloor'), $('bookingBuilding').value);
  renderBookingRooms();
});
$('bookingFloor').addEventListener('change', () => {
  resetBookingRoomSelection();
  renderBookingRooms();
});
['bookingDate','bookingStart','bookingEnd'].forEach(id => $(id).addEventListener('input', () => { const ok=validateBookingTime(false); if (!ok) $('bookingAvailabilitySummary').textContent='Periksa kembali tanggal dan rentang waktu peminjaman.'; else $('bookingAvailabilitySummary').textContent='Tanggal dan waktu valid. Ketersediaan akan diperiksa saat pengajuan.'; renderBookingRooms(); }));
const otherOptions = {
  lab: ['Lab Komputer W201','Lab Multimedia W202','Lab Komputer E301','Lab Jaringan E302'],
  hall: ['Aula Utama E101','Aula Serbaguna W101'],
  meeting: ['Ruang Rapat W103','Ruang Diskusi E203'],
  facility: ['Proyektor','Sound System','Kamera','Laptop Presentasi']
};
function renderOtherResources() {
  $('otherResource').innerHTML = otherOptions[selectedCategory].map(item => `<option>${item}</option>`).join('');
}

// Simpan dan kirim permohonan peminjaman
$('bookingForm').addEventListener('submit', function (event) {
  event.preventDefault();
  if (!currentUser || currentUser.role !== 'mahasiswa') { alert('Silakan login sebagai mahasiswa untuk mengajukan peminjaman.'); return; }
  const resource = (bookingFromMap && selectedRoom) || (selectedCategory === 'classroom' ? selectedRoom : $('otherResource').value);
  if (!resource) { alert('Silakan pilih ruangan terlebih dahulu.'); return; }
  const date = $('bookingDate').value, start = $('bookingStart').value, end = $('bookingEnd').value;
  if (date < localDateString()) { alert('Tanggal peminjaman tidak boleh di masa lalu.'); return; }
  if (!validateBookingTime(true)) return;
  const participantCount = Number($('borrowerCount').value);
  const roomCapacity = getConfiguredRoomCapacity(resource);
  if (!$('borrowerCount').value || participantCount < 1 || !Number.isInteger(participantCount)) {
    validateBorrowerCount(true); $('borrowerCount').focus(); return;
  }
  if (roomCapacity && participantCount > roomCapacity) {
    validateBorrowerCount(true); $('borrowerCount').focus(); return;
  }
  if (selectedCategory === 'classroom' || bookingFromMap) {
    const availability = getRoomBookingState(resource, date, start, end);
    if (availability.state !== 'available') { alert(availability.state === 'blocked' ? 'Ruangan sedang dinonaktifkan oleh admin.' : 'Ruangan sudah dipesan atau sedang menunggu persetujuan pada waktu tersebut. Pilih waktu atau ruangan lain.'); renderBookingRooms(); return; }
  } else {
    const conflict = requests.some(request => !['Ditolak','Cancelled','Dibatalkan'].includes(request.status) && request.resource === resource && request.date === date && start < request.end && end > request.start);
    if (conflict) { alert('Waktu fasilitas tersebut sudah memiliki pengajuan. Silakan pilih waktu lain.'); return; }
  }
  const roomLocation = bookingFromMap ? `${selectedRoomBuilding} · ${selectedRoomFloor} · ${resource}` : (selectedCategory === 'classroom' ? `${$('bookingBuilding').value === 'W' ? 'West Building' : 'East Building'} · Lantai ${$('bookingFloor').value}` : categoryNames[selectedCategory]);
  const facilities = Array.from($('bookingFacilityNeeds').selectedOptions).map(option => option.value);
  const newRequest={ id: Date.now(), username: currentUser.username, borrower: activeAccount().name || '', nim: activeAccount().nim || '', category: categoryNames[selectedCategory], resource, roomLocation, date, start, end, purpose: $('bookingPurpose').value.trim(), participantCount, facilities, status: 'Menunggu', createdAt:new Date().toISOString() };
  requests.push(newRequest);
  addBookingLog('room',newRequest.id,'Baru','Menunggu','Pengajuan ruangan dibuat');
  saveRequests(); this.reset(); selectedRoom = ''; selectedRoomName = ''; selectedRoomBuilding = ''; selectedRoomFloor = ''; bookingFromMap=false; alert('Pengajuan tersimpan. Status: Menunggu persetujuan admin.'); openTab('history'); renderAll();
});

// Planner
$('plannerForm').addEventListener('submit', function (event) {
  event.preventDefault();
  tasks.push({ id: Date.now(), username: currentUser.username, title: $('taskTitle').value.trim(), type: $('taskType').value, date: $('taskDate').value, done: false });
  localStorage.setItem('horizonHubTasks', JSON.stringify(tasks)); this.reset(); renderPlanner(); renderHomePlanner();
});
function renderHomePlanner() {
  const preview = $('homePlannerPreview');
  if (!preview || !currentUser || currentUser.role !== 'mahasiswa') return;
  const mine=tasks.filter(task=>task.username===currentUser.username);
  const active=mine.filter(task=>!task.done).sort((a,b)=>a.date.localeCompare(b.date));
  const today=localDateString();
  const upcoming=active.slice(0,4);
  preview.innerHTML=upcoming.length?upcoming.map(task=>{const due=task.date<today?'Terlambat':task.date===today?'Hari ini':new Date(task.date+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short'});return `<article class="home-task-item"><span class="home-task-date">${escapeHTML(due)}</span><div><b>${escapeHTML(task.title)}</b><small>${escapeHTML(task.type)}</small></div><span class="home-task-arrow">›</span></article>`;}).join(''):'<div class="empty-state">Belum ada tugas aktif. Kamu bisa menambahkan tugas melalui Student Planner.</div>';
  const completed=mine.filter(task=>task.done).length;const percent=mine.length?Math.round(completed/mine.length*100):0;
  $('homePlannerProgressText').textContent=`${percent}% selesai`;$('homePlannerProgressBar').style.width=percent+'%';
  $('overviewTaskCount').textContent=active.length;
  renderHomeTodayClass();renderHomeAnnouncements();renderNotificationCenter();renderHomeWelcome();
}
function renderHomeWelcome(){
  const account=activeAccount();const name=profileDisplayName(account);const hour=new Date().getHours();const greeting=hour<11?'Good Morning':hour<15?'Good Afternoon':hour<18?'Good Afternoon':'Good Evening';
  $('homeGreeting').innerHTML=`${greeting}, <em>${escapeHTML(name)}!</em>`;
  $('homeTodayDate').textContent=new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).toUpperCase();
}
function renderHomeTodayClass(){
  const target=$('homeTodayClass');if(!target)return;
  const names=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];const day=names[new Date().getDay()];const entry=studentScheduleForAccount(activeAccount()).find(x=>x.day===day);const classes=(entry?.classes||[]).filter(x=>x[1]!=='BREAK');
  if(!classes.length){target.innerHTML='<div class="today-empty"><b>Tidak ada jadwal kuliah hari ini</b><span>Gunakan waktumu untuk menyelesaikan tugas atau agenda lainnya.</span></div>';$('overviewNextClass').textContent='—';return;}
  const first=classes[0];const time=(first[0].split('–')[0]||first[0]).trim();$('overviewNextClass').textContent=time;
  target.innerHTML=classes.slice(0,3).map(x=>`<article class="today-class-row"><span class="today-class-time">${escapeHTML(x[0])}</span><span class="today-class-detail"><b>${escapeHTML(x[2])}</b><small>${escapeHTML(x[1])} · ${escapeHTML(x[3]||'Lokasi belum ditentukan')}</small></span><span class="today-class-dot"></span></article>`).join('');
}
function renderHomeAnnouncements(){
  const target=$('homeAnnouncementPreview');if(!target)return;const saved=announcementData().slice().reverse();
  const entries=saved.length?saved.slice(0,3):[{category:'Informasi Akademik',title:'Periksa Jadwal Perkuliahan',body:'Mahasiswa diimbau memeriksa jadwal dan tenggat tugas secara berkala.',date:'Informasi umum'},{category:'Sarana & Prasarana',title:'Layanan Peminjaman Kampus',body:'Pengajuan ruangan dan fasilitas dapat dilakukan melalui Horizon Hub.',date:'Informasi layanan'}];
  target.innerHTML=entries.map(x=>`<article class="home-announcement-row"><span class="announcement-category">${escapeHTML(x.category||'Informasi')}</span><span class="home-announcement-copy"><b>${escapeHTML(x.title)}</b><small>${escapeHTML(x.body)}</small></span><span class="home-announcement-date">${escapeHTML(x.date||'')}</span></article>`).join('');
}

function renderPlanner() {
  const mine = tasks.filter(task => task.username === currentUser.username).sort((a,b) => a.date.localeCompare(b.date));
  $('plannerList').innerHTML = mine.length ? mine.map(task => `<article class="task-card"><div class="request-head"><h3>${escapeHTML(task.title)}</h3><span class="status ${task.done ? 'approved' : 'pending'}">${task.done ? 'Selesai' : escapeHTML(task.type)}</span></div><p>Tanggal: ${escapeHTML(task.date)}</p><div class="action-row"><button class="approve" data-task-done="${task.id}">${task.done ? 'Batalkan selesai' : 'Tandai selesai'}</button><button class="reject" data-task-delete="${task.id}">Hapus</button></div></article>`).join('') : '<div class="empty-state">Belum ada agenda. Tambahkan tugas atau kegiatanmu di atas.</div>';
  $('plannerList').querySelectorAll('[data-task-done]').forEach(button => button.addEventListener('click', () => { const task = tasks.find(item => item.id == button.dataset.taskDone); if(task) task.done = !task.done; saveTasks(); renderPlanner(); renderHomePlanner(); }));
  $('plannerList').querySelectorAll('[data-task-delete]').forEach(button => button.addEventListener('click', () => { tasks = tasks.filter(item => item.id != button.dataset.taskDelete); saveTasks(); renderPlanner(); renderHomePlanner(); }));
  renderHomePlanner();
}
function saveTasks() { localStorage.setItem('horizonHubTasks', JSON.stringify(tasks)); }
function saveRequests() { localStorage.setItem('horizonHubRequests', JSON.stringify(requests)); }

// Riwayat dan persetujuan admin
function statusClass(status) { return ['Disetujui','Borrowed','Returned','Completed','Dikembalikan'].includes(status) ? 'approved' : ['Ditolak','Rejected','Overdue'].includes(status) ? 'rejected' : ['Cancelled','Dibatalkan'].includes(status) ? 'muted' : 'pending'; }
function hoursUntilBooking(date,start){const d=new Date(`${date}T${start}:00`);return (d.getTime()-Date.now())/3600000;}
function canStudentCancel(request){if(request.status==='Menunggu')return true;if(request.status!=='Disetujui')return false;return hoursUntilBooking(request.date,request.start)>=24;}
function addBookingLog(type,id,oldStatus,newStatus,note=''){const logs=readData('horizonHubBookingLogs');logs.push({id:Date.now()+Math.random(),type,bookingId:id,oldStatus,newStatus,note,actor:currentUser?.username||'system',at:new Date().toISOString()});localStorage.setItem('horizonHubBookingLogs',JSON.stringify(logs));}
function requestHTML(request, adminMode) {
  const cancelButton=!adminMode&&canStudentCancel(request)?`<button class="reject" data-cancel-room="${request.id}">Batalkan pengajuan</button>`:'';
  const reason=request.adminNote?`<p><b>Catatan admin:</b> ${escapeHTML(request.adminNote)}</p>`:'';
  return `<article class="request-card"><div class="request-head"><h3>${escapeHTML(request.resource)}</h3><span class="status ${statusClass(request.status)}">${escapeHTML(request.status)}</span></div><p><b>Peminjam:</b> ${escapeHTML(request.borrower)} · ${escapeHTML(request.nim)}</p><p><b>Kategori:</b> ${escapeHTML(request.category)}<br><b>Lokasi:</b> ${escapeHTML(request.roomLocation)}<br><b>Tanggal:</b> ${escapeHTML(request.date)} · ${escapeHTML(request.start)}–${escapeHTML(request.end)}</p><p><b>Keperluan:</b> ${escapeHTML(request.purpose)}</p>${request.facilities?.length?`<p><b>Fasilitas pendukung:</b> ${request.facilities.map(escapeHTML).join(', ')}</p>`:''}${reason}${adminMode && request.status === 'Menunggu' ? `<p class="hint"><b>Menunggu:</b> ${request.createdAt?Math.max(0,Math.floor((Date.now()-new Date(request.createdAt).getTime())/3600000))+' jam':'waktu pengajuan tidak tercatat'} · Perlu tindak lanjut admin</p><div class="action-row"><button class="approve" data-approve="${request.id}">Setujui</button><button class="reject" data-reject="${request.id}">Tolak</button></div>` : ''}${cancelButton?`<div class="action-row">${cancelButton}</div>`:''}${!adminMode&&request.status==='Disetujui'&&!canStudentCancel(request)?'<small class="hint">Pembatalan mandiri ditutup karena jadwal kurang dari 24 jam lagi. Hubungi admin jika ada kondisi darurat.</small>':''}</article>`;
}
function assetLoanHTML(row, adminMode=false){
  const borrower=accounts[row.username]?.name||row.borrower||row.username;
  const adminActions=adminMode&&row.status==='Menunggu'?`<div class="action-row"><button class="approve" data-approve-asset="${row.id}">Setujui</button><button class="reject" data-reject-asset="${row.id}">Tolak</button></div>`:'';
  const pickupAction=adminMode&&row.status==='Disetujui'?`<div class="action-row"><button class="approve" data-pickup-asset="${row.id}">Catat Pengambilan</button></div>`:'';
  const cancelAsset=!adminMode&&(['Menunggu'].includes(row.status)||(row.status==='Disetujui'&&hoursUntilBooking(row.date,row.start)>=24))?`<div class="action-row"><button class="reject" data-cancel-asset="${row.id}">Batalkan pengajuan</button></div>`:'';
  const returnAction=adminMode&&row.status==='Dipinjam'?`<div class="action-row"><button class="approve" data-return-asset="${row.id}">Catat Pengembalian</button><button class="outline-button" data-overdue-asset="${row.id}">Tandai Terlambat</button></div>`:'';
  return `<article class="request-card"><div class="request-head"><h3>${escapeHTML(row.item)} · ${row.quantity} unit</h3><span class="status ${statusClass(row.status)}">${escapeHTML(row.status)}</span></div><p><b>Peminjam:</b> ${escapeHTML(borrower)} · ${escapeHTML(row.nim||'')}</p><p><b>Lokasi:</b> ${escapeHTML(row.location||'Area kampus')}<br><b>Penggunaan:</b> ${escapeHTML(row.date)} ${escapeHTML(row.start||'')}<br><b>Pengembalian:</b> ${escapeHTML(row.returnDate||row.date)} ${escapeHTML(row.end||'')}</p><p><b>Keperluan:</b> ${escapeHTML(row.purpose)}</p>${row.adminNote?`<p><b>Catatan admin:</b> ${escapeHTML(row.adminNote)}</p>`:''}${adminActions}${pickupAction}${returnAction}${cancelAsset}</article>`;
}
function renderHistory() {
  const mine = requests.filter(request => request.username === currentUser.username).slice().reverse();
  const assetRows=readData('horizonHubAssetLoans').filter(row=>row.username===currentUser.username).slice().reverse();
  const entries=[...mine.map(x=>({date:x.createdAt||x.date,html:requestHTML(x,false)})),...assetRows.map(x=>({date:x.createdAt||x.date,html:assetLoanHTML(x,false)}))].sort((a,b)=>new Date(b.date)-new Date(a.date));
  $('studentHistory').innerHTML = entries.length ? entries.map(x=>x.html).join('') : '<div class="empty-state">Kamu belum memiliki pengajuan peminjaman.</div>';
  $('studentHistory').querySelectorAll('[data-cancel-room]').forEach(b=>b.addEventListener('click',()=>cancelRoomBooking(b.dataset.cancelRoom)));
  $('studentHistory').querySelectorAll('[data-cancel-asset]').forEach(b=>b.addEventListener('click',()=>cancelAssetBooking(b.dataset.cancelAsset)));
}
function cancelAssetBooking(id){const rows=assetLoanData();const row=rows.find(x=>x.id==id&&x.username===currentUser.username);if(!row)return;const allowed=row.status==='Menunggu'||(row.status==='Disetujui'&&hoursUntilBooking(row.date,row.start)>=24);if(!allowed){alert('Pengajuan inventaris yang sudah dipinjam atau kurang dari 24 jam menuju penggunaan tidak dapat dibatalkan mandiri.');return;}if(!confirm('Batalkan pengajuan inventaris ini?'))return;const old=row.status;row.status='Dibatalkan';row.cancelledAt=new Date().toISOString();row.adminNote='Dibatalkan oleh mahasiswa';saveAssetLoans(rows);addBookingLog('inventory',row.id,old,row.status,row.adminNote);renderHistory();renderAssetCards('studentInventoryCatalog');renderStats();alert('Pengajuan inventaris berhasil dibatalkan.');}
function cancelRoomBooking(id){const row=requests.find(x=>x.id==id&&x.username===currentUser.username);if(!row||!canStudentCancel(row)){alert('Pembatalan mandiri hanya tersedia sebelum batas 24 jam untuk booking yang sudah disetujui.');return;}if(!confirm('Batalkan pengajuan peminjaman ini?'))return;const old=row.status;row.status='Dibatalkan';row.cancelledAt=new Date().toISOString();addBookingLog('room',row.id,old,row.status,'Dibatalkan oleh mahasiswa');saveRequests();renderHistory();renderStats();renderBookingRooms();alert('Pengajuan berhasil dibatalkan. Slot jadwal dilepas.');}
function renderApprovals() {
  const pending = requests.filter(request => request.status === 'Menunggu').slice().reverse();
  $('approvalList').innerHTML = pending.length ? pending.map(request => requestHTML(request, true)).join('') : '<div class="empty-state">Tidak ada pengajuan ruangan yang menunggu persetujuan.</div>';
  $('approvalList').querySelectorAll('[data-approve]').forEach(button => button.addEventListener('click', () => updateRequestStatus(button.dataset.approve, 'Disetujui')));
  $('approvalList').querySelectorAll('[data-reject]').forEach(button => button.addEventListener('click', () => updateRequestStatus(button.dataset.reject, 'Ditolak')));
}
function updateRequestStatus(id, status) {
  const request = requests.find(item => item.id == id);
  if (!request || request.status!=='Menunggu') return;
  if (status === 'Disetujui') {
    const conflict = roomConflictDetails(request.resource,request.date,request.start,request.end,request.id);
    const capacity=getConfiguredRoomCapacity(request.resource);
    if(conflict){alert(`Tidak dapat menyetujui: ${conflict.message}`);return;}
    if(capacity&&Number(request.participantCount||0)>capacity){alert(`Tidak dapat menyetujui: kapasitas ruangan hanya ${capacity} orang.`);return;}
  }
  const old=request.status;request.status = status;request.adminId=currentUser.username;request.adminNote=status==='Ditolak'?(prompt('Masukkan alasan penolakan:')||'Tidak ada keterangan'):'Disetujui oleh admin';request.updatedAt=new Date().toISOString();addBookingLog('room',request.id,old,status,request.adminNote);saveRequests();renderApprovals();renderHistory();renderStats();renderBookingRooms();alert(`Pengajuan ${status.toLowerCase()}.`);
}
function renderStats() {
  const visible = currentUser.role === 'admin' ? requests : requests.filter(request => request.username === currentUser.username);
  $('homeTotal').textContent = visible.length;
  $('homePending').textContent = visible.filter(request => request.status === 'Menunggu').length;
  $('homeApproved').textContent = visible.filter(request => request.status === 'Disetujui').length;
  if($('homeRejected')) $('homeRejected').textContent=visible.filter(request=>request.status==='Ditolak').length;
  if($('overviewLoanCount')) $('overviewLoanCount').textContent=visible.filter(request=>request.status==='Menunggu').length;
  if(currentUser?.role==='mahasiswa') renderNotificationCenter();
}
function buildInitialAdminSchedule() {
  return defaultWeeklyClasses.flatMap(day => day.classes
    .filter(item => item[1] !== 'BREAK')
    .map(item => {
      const [time,code,course,room] = item;
      const detail = classOccurrenceDetails[`${day.day}|${code}|${time}`] || {};
      return {
        className:'IF-KA', semester:'Y1S1', day:day.day, time, code, course,
        lecturer:detail.lecturer || classDetails[code]?.lecturer || 'Belum ditentukan',
        room:detail.room || room || 'Belum ditentukan',
        mode:detail.mode || (room === 'Online' ? 'Online' : 'Offline'),
        note:detail.note || ''
      };
    }));
}
function adminScheduleData() {
  try {
    const raw = localStorage.getItem('horizonHubAdminSchedule');
    const migrated = localStorage.getItem('horizonHubAcademicSeedV69') === 'true';
    if (!migrated) {
      const existing = raw ? JSON.parse(raw) : [];
      const initial = Array.isArray(existing) && existing.length ? existing : buildInitialAdminSchedule();
      localStorage.setItem('horizonHubAdminSchedule', JSON.stringify(initial));
      localStorage.setItem('horizonHubAcademicSeedV69', 'true');
      return initial;
    }
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch(e) { return []; }
}
function selectedAdminClass(){return $('scheduleClassFilter')?.value || 'IF-KA';}
function renderAdminSchedules() {
  const all = adminScheduleData();
  const cls = selectedAdminClass();
  const sem = $('scheduleSemesterFilter')?.value || 'Y1S1';
  const filtered = all.map((item,index)=>({...item,_index:index})).filter(x=>x.className===cls && x.semester===sem);
  $('scheduleSelectedTitle').textContent = `Jadwal ${cls} · ${sem}`;
  $('scheduleSelectedCount').textContent = `${filtered.length} jadwal`;
  $('adminScheduleList').innerHTML = filtered.length ? filtered.map(x=>`<article class="request-card"><div class="request-head"><h3>${escapeHTML(x.day)} · ${escapeHTML(x.time)}</h3><div class="action-row"><button type="button" class="outline-button" data-edit-schedule="${x._index}">Ubah</button><button type="button" class="reject" data-delete-schedule="${x._index}">Hapus</button></div></div><p><strong>${escapeHTML(x.code)} · ${escapeHTML(x.course)}</strong></p><p>Dosen: ${escapeHTML(x.lecturer)} · Ruangan: ${escapeHTML(x.room)}</p></article>`).join('') : '<div class="empty-state">Belum ada jadwal untuk kelas dan semester ini. Tambahkan jadwal melalui formulir di sebelah kanan.</div>';
}

// Delegated schedule actions: remain clickable after every re-render (including iOS Safari).
$('addScheduleButton').addEventListener('click', () => {
  $('adminScheduleForm').reset();
  $('adminScheduleEditIndex').value = '';
  $('adminScheduleClass').value = selectedAdminClass();
  $('adminScheduleSemester').value = $('scheduleSemesterFilter').value;
  $('scheduleEditorTitle').textContent = 'Tambah Jadwal';
  $('adminScheduleForm').querySelector('button[type="submit"]').textContent = 'Simpan Jadwal';
  const editorCard = document.querySelector('.schedule-editor-card');
  if (editorCard) editorCard.classList.add('is-modal');
  document.body.classList.add('schedule-modal-open');
  $('closeScheduleModal').focus({ preventScroll: true });
});

$('adminScheduleList').addEventListener('click', function(event) {
  const editButton = event.target.closest('[data-edit-schedule]');
  if (editButton && this.contains(editButton)) {
    event.preventDefault();
    const index = Number(editButton.dataset.editSchedule);
    const item = adminScheduleData()[index];
    if (!item) return;
    const fields = {
      adminScheduleClass: item.className,
      adminScheduleSemester: item.semester,
      adminScheduleDay: item.day,
      adminScheduleTime: item.time,
      adminScheduleCode: item.code,
      adminScheduleCourse: item.course,
      adminScheduleLecturer: item.lecturer,
      adminScheduleRoom: item.room
    };
    Object.entries(fields).forEach(([id, value]) => {
      const field = $(id);
      if (field) field.value = value ?? '';
    });
    $('adminScheduleEditIndex').value = String(index);
    $('scheduleEditorTitle').textContent = 'Ubah Jadwal';
    $('adminScheduleForm').querySelector('button[type="submit"]').textContent = 'Simpan Perubahan';
    const editorCard = document.querySelector('.schedule-editor-card');
    if (editorCard) editorCard.classList.add('is-modal');
    document.body.classList.add('schedule-modal-open');
    const closeButton = $('closeScheduleModal');
    if (closeButton) closeButton.focus({ preventScroll: true });
    return;
  }

  const deleteButton = event.target.closest('[data-delete-schedule]');
  if (deleteButton && this.contains(deleteButton)) {
    event.preventDefault();
    if (!confirm('Hapus jadwal ini?')) return;
    const index = Number(deleteButton.dataset.deleteSchedule);
    const list = adminScheduleData();
    if (!Number.isInteger(index) || index < 0 || index >= list.length) return;
    list.splice(index, 1);
    syncAdminSchedule(list);
    renderAdminSchedules();
  }
});

function updateScheduleClassOptions(){const program=$('scheduleProgramFilter').value;const suffixes=['KA','KM','EC'];const select=$('scheduleClassFilter');const previous=select.value;select.innerHTML=suffixes.map(s=>`<option value="${program}-${s}">${program}-${s} · ${s==='KA'?'Kelas Malam':s==='KM'?'Kelas Pagi':'Employee Class'}</option>`).join('');if([...select.options].some(o=>o.value===previous))select.value=previous;$('adminScheduleClass').value=select.value;renderAdminSchedules();}
$('scheduleProgramFilter').addEventListener('change',updateScheduleClassOptions);
$('scheduleClassFilter').addEventListener('change',()=>{$('adminScheduleClass').value=selectedAdminClass();renderAdminSchedules();});
$('scheduleSemesterFilter').addEventListener('change',()=>{ $('adminScheduleSemester').value=$('scheduleSemesterFilter').value;renderAdminSchedules();});
function closeScheduleEditor({reset=true}={}) {
  const card = document.querySelector('.schedule-editor-card');
  if (card) card.classList.remove('is-modal');
  document.body.classList.remove('schedule-modal-open');
  if (reset) {
    $('adminScheduleForm').reset();
    $('adminScheduleEditIndex').value = '';
    $('adminScheduleClass').value = selectedAdminClass();
    $('adminScheduleSemester').value = $('scheduleSemesterFilter').value;
    $('scheduleEditorTitle').textContent = 'Tambah Jadwal';
    $('adminScheduleForm').querySelector('button[type=submit]').textContent = 'Simpan Jadwal';
  }
}
$('cancelScheduleEdit').addEventListener('click',()=>closeScheduleEditor());
$('closeScheduleModal').addEventListener('click',()=>closeScheduleEditor());
document.addEventListener('keydown',event=>{
  if(event.key==='Escape' && document.body.classList.contains('schedule-modal-open')) closeScheduleEditor();
});
document.addEventListener('click',event=>{
  if(event.target.matches('body.schedule-modal-open')) closeScheduleEditor();
});
function syncAdminSchedule(list) {
  localStorage.setItem('horizonHubAdminSchedule', JSON.stringify(list));
  renderSchedule();
  if (currentUser?.role === 'mahasiswa') renderHomeTodayClass();
  if (currentUser?.role === 'admin') $('adminScheduleCount').textContent = list.length;
  syncLecturersFromSchedules(list);
}
$('adminScheduleForm').addEventListener('submit',function(e){e.preventDefault();const item={className:selectedAdminClass(),semester:$('adminScheduleSemester').value,day:$('adminScheduleDay').value,time:$('adminScheduleTime').value.trim(),code:$('adminScheduleCode').value.trim().toUpperCase(),course:$('adminScheduleCourse').value.trim(),lecturer:$('adminScheduleLecturer').value.trim(),room:$('adminScheduleRoom').value.trim()};const list=adminScheduleData();const editIndex=$('adminScheduleEditIndex').value;if(editIndex!=='')list[Number(editIndex)]=item;else list.push(item);syncAdminSchedule(list);this.reset();$('adminScheduleClass').value=selectedAdminClass();$('adminScheduleSemester').value=$('scheduleSemesterFilter').value;$('adminScheduleEditIndex').value='';$('scheduleEditorTitle').textContent='Tambah Jadwal';this.querySelector('button[type=submit]').textContent='Simpan Jadwal';closeScheduleEditor({reset:false});renderAdminSchedules();alert('Jadwal berhasil disimpan pada prototipe.');});
function seedDirectoryFromExistingStudentCards() {
  const grid = $('studentDirectoryGrid');
  const seeded = [];
  if (grid) {
    [...grid.querySelectorAll(':scope > .contact-card')].forEach((card,index) => {
      const name = card.querySelector('b')?.textContent?.trim();
      if (!name) return;
      const anchors = [...card.querySelectorAll('a')].map(a => ({label:a.textContent.trim(),href:a.getAttribute('href') || ''}));
      const emailLink = anchors.find(a => a.href.startsWith('mailto:'));
      const links = anchors.filter(a => !a.href.startsWith('mailto:'));
      seeded.push({
        id:`seed-unit-${index+1}`, name, role:card.querySelector('span')?.textContent?.trim() || 'Unit Layanan',
        description:card.querySelector('p')?.textContent?.trim() || '',
        email:emailLink ? emailLink.href.replace(/^mailto:/,'') : '',
        hours:card.querySelector('small')?.textContent?.trim().replace(/\s+/g,' ') || '',
        links, type:'unit', origin:'existing-student-directory'
      });
    });
  }
  const lecturerCourses = new Map();
  defaultWeeklyClasses.forEach(day => day.classes.filter(x=>x[1] !== 'BREAK').forEach(([time,code,course]) => {
    const detail = classOccurrenceDetails[`${day.day}|${code}|${time}`] || {};
    const names = String(detail.lecturer || classDetails[code]?.lecturer || '').split('/').map(x=>x.trim()).filter(Boolean);
    names.forEach(name => {
      if (!lecturerCourses.has(name)) lecturerCourses.set(name,new Set());
      lecturerCourses.get(name).add(course);
    });
  }));
  let lecturerIndex = 0;
  lecturerCourses.forEach((courses,name) => seeded.push({
    id:`seed-lecturer-${++lecturerIndex}`, name, role:'Dosen Pengampu',
    description:`Mata kuliah: ${[...courses].join(', ')} · Data jadwal prototype IF-KA Y1S1.`,
    email:'', hours:'', links:[], type:'lecturer', origin:'schedule'
  }));
  return seeded;
}
function lecturerData() {
  try {
    const raw = localStorage.getItem('horizonHubLecturers');
    const migrated = localStorage.getItem('horizonHubDirectorySeedV69') === 'true';
    if (!migrated) {
      const existing = raw ? JSON.parse(raw) : [];
      const initial = Array.isArray(existing) && existing.length ? existing : seedDirectoryFromExistingStudentCards();
      localStorage.setItem('horizonHubLecturers', JSON.stringify(initial));
      localStorage.setItem('horizonHubDirectorySeedV69', 'true');
      return initial;
    }
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch(e) { return []; }
}
function directoryCardMarkup(x, index, admin = false) {
  const links = (x.links || []).map(link => `<a href="${escapeHTML(link.href)}" target="_blank" rel="noopener">${escapeHTML(link.label || 'Buka tautan')}</a>`).join('');
  return `<article class="contact-card">
    <b>${escapeHTML(x.name)}</b><span>${escapeHTML(x.role || (x.type==='lecturer'?'Dosen':'Staff'))}</span>
    <p>${escapeHTML(x.description || '')}</p>
    ${x.email ? `<a href="mailto:${escapeHTML(x.email)}">${escapeHTML(x.email)}</a>` : ''}
    ${links}
    <small>${escapeHTML(x.hours || (x.type==='lecturer'?'Informasi kontak belum ditambahkan':'Jam layanan belum diisi'))}</small>
    ${admin ? `<div class="action-row"><button class="outline-button" data-edit-lecturer="${index}">Edit</button><button class="reject" data-delete-lecturer="${index}">Hapus</button></div>` : ''}
  </article>`;
}
function renderAdminLecturers() {
  const list = lecturerData();
  $('adminLecturerList').innerHTML = list.length
    ? list.map((x,i)=>directoryCardMarkup(x,i,true)).join('')
    : '<div class="empty-state">Belum ada data dosen atau staff yang ditambahkan.</div>';
  document.querySelectorAll('[data-edit-lecturer]').forEach(b=>b.addEventListener('click',()=>{
    const x=lecturerData()[Number(b.dataset.editLecturer)]; if(!x)return;
    Object.entries({adminLecturerName:x.name,adminLecturerRole:x.role,adminLecturerEmail:x.email,adminLecturerHours:x.hours,adminLecturerDescription:x.description})
      .forEach(([id,val])=>$(id).value=val || '');
    $('adminLecturerEditIndex').value=b.dataset.editLecturer;
    $('adminLecturerForm').querySelector('button[type=submit]').textContent='Perbarui Data';
    $('adminLecturerForm').scrollIntoView({behavior:'smooth'});
  }));
  document.querySelectorAll('[data-delete-lecturer]').forEach(b=>b.addEventListener('click',()=>{
    if(!confirm('Hapus data ini dari direktori bersama mahasiswa dan admin?'))return;
    const d=lecturerData(); d.splice(Number(b.dataset.deleteLecturer),1);
    localStorage.setItem('horizonHubLecturers',JSON.stringify(d));
    renderAdminLecturers(); renderStudentDirectory();
  }));
}
$('adminLecturerForm').addEventListener('submit',function(e){
  e.preventDefault();
  const d=lecturerData();
  const editIndex=$('adminLecturerEditIndex').value;
  const previous=editIndex!=='' ? d[Number(editIndex)] || {} : {};
  const item={
    ...previous,
    name:$('adminLecturerName').value.trim(),
    role:$('adminLecturerRole').value.trim(),
    email:$('adminLecturerEmail').value.trim(),
    hours:$('adminLecturerHours').value.trim(),
    description:$('adminLecturerDescription').value.trim(),
    type:previous.type || 'staff',
    origin:previous.origin || 'admin',
    links:previous.links || []
  };
  if(editIndex!=='') d[Number(editIndex)]=item; else d.push(item);
  localStorage.setItem('horizonHubLecturers',JSON.stringify(d));
  this.reset(); $('adminLecturerEditIndex').value='';
  this.querySelector('button[type=submit]').textContent='Simpan Data';
  renderAdminLecturers(); renderStudentDirectory();
  alert('Data direktori berhasil disimpan dan langsung diperbarui pada tampilan mahasiswa di perangkat ini.');
});
function syncLecturersFromSchedules(list) {
  const directory=lecturerData();
  let changed=false;
  (list || []).forEach(item=>{
    const name=String(item.lecturer || '').trim();
    if(!name || name==='Belum ditentukan')return;
    const existing=directory.find(x=>x.type==='lecturer' && x.name.toLowerCase()===name.toLowerCase());
    if(existing) {
      const course=String(item.course || '').trim();
      if(course && !String(existing.description||'').includes(course)) {
        existing.description=`Mata kuliah: ${course}. Dosen pengampu pada jadwal prototype.`;
        changed=true;
      }
    } else {
      directory.push({id:`lecturer-${Date.now()}-${directory.length}`,name,role:'Dosen Pengampu',description:`Mata kuliah: ${item.course || 'Belum ditentukan'}. Data dari jadwal admin.`,email:'',hours:'',links:[],type:'lecturer',origin:'schedule'});
      changed=true;
    }
  });
  if(changed)localStorage.setItem('horizonHubLecturers',JSON.stringify(directory));
  if($('adminLecturerList')) renderAdminLecturers();
  if($('studentDirectoryGrid')) renderStudentDirectory();
}

function announcementData(){try{return JSON.parse(localStorage.getItem('horizonHubAnnouncements'))||[]}catch(e){return []}}
function renderStudentAnnouncements(){const saved=announcementData();const box=$('announcementsList');if(!box)return;const defaults='<article class="content-card"><span class="tag">INFORMASI AKADEMIK · CONTOH</span><h2>Periksa Jadwal Perkuliahan</h2><p>Mahasiswa diimbau memeriksa jadwal perkuliahan dan tenggat tugas secara berkala melalui Horizon Hub.</p></article><article class="content-card"><span class="tag">SARANA &amp; PRASARANA · CONTOH</span><h2>Layanan Peminjaman Ruangan</h2><p>Pengajuan peminjaman ruangan dan fasilitas dapat dilakukan melalui menu Peminjaman Ruangan. Pastikan tanggal dan waktu diisi dengan benar.</p></article>';box.innerHTML=saved.slice().reverse().map(x=>`<article class="content-card"><span class="tag">${escapeHTML(x.category)}</span><h2>${escapeHTML(x.title)}</h2><p>${escapeHTML(x.body)}</p><small>${escapeHTML(x.date)}</small></article>`).join('')+defaults;}
function renderStudentDirectory(){const grid=$('studentDirectoryGrid');if(!grid)return;const base=grid.dataset.baseHTML||(grid.dataset.baseHTML=grid.innerHTML);const d=lecturerData();grid.innerHTML=base+d.map(x=>`<article class="contact-card"><b>${escapeHTML(x.name)}</b><span>${escapeHTML(x.role)}</span><p>${escapeHTML(x.description||'')}</p><a href="mailto:${escapeHTML(x.email)}">${escapeHTML(x.email||'Email belum diisi')}</a><small>${escapeHTML(x.hours||'Jam layanan belum diisi')}</small></article>`).join('');}

function renderAdminAnnouncements(){const d=announcementData();$('adminAnnouncementList').innerHTML=d.length?d.slice().reverse().map((x,i)=>`<article class="content-card"><span class="tag">${escapeHTML(x.category)}</span><h2>${escapeHTML(x.title)}</h2><p>${escapeHTML(x.body)}</p><small>${escapeHTML(x.date)}</small><button class="reject" data-delete-announcement="${i}">Hapus</button></article>`).join(''):'<div class="empty-state">Belum ada pengumuman yang diterbitkan.</div>';document.querySelectorAll('[data-delete-announcement]').forEach(b=>b.addEventListener('click',()=>{const d=announcementData();d.splice(d.length-1-Number(b.dataset.deleteAnnouncement),1);localStorage.setItem('horizonHubAnnouncements',JSON.stringify(d));renderAdminAnnouncements();renderStudentAnnouncements();renderHomeAnnouncements();renderNotificationCenter();}));}
$('adminAnnouncementForm').addEventListener('submit',function(e){e.preventDefault();const d=announcementData();d.push({title:$('adminAnnouncementTitle').value.trim(),category:$('adminAnnouncementCategory').value,body:$('adminAnnouncementBody').value.trim(),date:new Date().toLocaleDateString('id-ID')});localStorage.setItem('horizonHubAnnouncements',JSON.stringify(d));this.reset();renderAdminAnnouncements();renderStudentAnnouncements();renderHomeAnnouncements();renderNotificationCenter();alert('Pengumuman diterbitkan pada prototipe.');});
function allCampusRooms() {
  const rooms=[];
  [['W',3],['E',10]].forEach(([building,floors])=>{
    for(let floor=1;floor<=floors;floor++) createRoomData(building,floor).forEach(room=>rooms.push(room));
  });
  return rooms;
}
function renderAdminRooms() {
  const building=$('adminRoomBuilding').value, floor=$('adminRoomFloor').value, query=$('adminRoomSearch').value.trim().toLowerCase();
  const blocked=readData('horizonHubBlockedRooms');
  const rooms=allCampusRooms().filter(room=>(building==='ALL'||room.code.startsWith(building))&&(floor==='ALL'||String(room.floor)===floor)&&(!query||`${room.code} ${room.building} ${room.floor}`.toLowerCase().includes(query)));
  $('adminRoomDirectory').innerHTML=rooms.map(room=>{
    const off=blocked.includes(room.code);
    const upcoming=requests.filter(r=>r.resource===room.code&&r.status!=='Ditolak').length;
    const capacities=readData('horizonHubRoomCapacities')||{};
    const capacity=Number(capacities[room.code])||'';
    return `<article class="room-admin-card"><div class="request-head"><b>${room.code}</b><span class="status ${off?'rejected':'approved'}">${off?'Tidak aktif':'Aktif'}</span></div><p>${room.building} · Lantai ${room.floor}</p><label class="room-capacity-editor">Kapasitas resmi (orang)<input type="number" min="1" step="1" value="${capacity}" placeholder="Belum didata" data-room-capacity="${room.code}"></label><button type="button" class="outline-button" data-save-capacity="${room.code}">Simpan kapasitas</button><small>${upcoming} pengajuan tersimpan</small><button class="${off?'approve':'reject'}" data-toggle-room="${room.code}">${off?'Aktifkan Ruangan':'Nonaktifkan Sementara'}</button></article>`;
  }).join('')||'<div class="empty-state">Ruangan tidak ditemukan.</div>';
  $('adminRoomDirectory').querySelectorAll('[data-save-capacity]').forEach(button=>button.addEventListener('click',()=>{
    const code=button.dataset.saveCapacity;
    const input=$('adminRoomDirectory').querySelector(`[data-room-capacity="${code}"]`);
    const value=Number(input?.value);
    if(!Number.isInteger(value)||value<1){alert('Masukkan kapasitas resmi berupa bilangan bulat minimal 1.');input?.focus();return;}
    const capacities=readData('horizonHubRoomCapacities')||{};capacities[code]=value;
    localStorage.setItem('horizonHubRoomCapacities',JSON.stringify(capacities));
    renderAdminRooms();syncBorrowerCapacity();renderBookingRooms();alert(`Kapasitas ${code} disimpan: ${value} orang.`);
  }));
  $('adminRoomDirectory').querySelectorAll('[data-toggle-room]').forEach(button=>button.addEventListener('click',()=>{
    const code=button.dataset.toggleRoom;let list=readData('horizonHubBlockedRooms');
    list=list.includes(code)?list.filter(x=>x!==code):[...list,code];
    localStorage.setItem('horizonHubBlockedRooms',JSON.stringify(list));renderAdminRooms();
  }));
}
$('adminRoomBuilding').addEventListener('change',()=>{
  const building=$('adminRoomBuilding').value;
  const max=building==='W'?3:10;
  $('adminRoomFloor').innerHTML='<option value="ALL">Semua Lantai</option>'+Array.from({length:max},(_,i)=>`<option value="${i+1}">Lantai ${i+1}</option>`).join('');
  renderAdminRooms();
});
$('adminRoomFloor').addEventListener('change',renderAdminRooms);
$('adminRoomSearch').addEventListener('input',renderAdminRooms);
const knownClasses=[['IF-KA','Informatika','Kelas Malam'],['IF-KM','Informatika','Kelas Pagi'],['IF-EC','Informatika','Employee Class'],['SI-KA','Sistem Informasi','Kelas Malam'],['SI-KM','Sistem Informasi','Kelas Pagi'],['SI-EC','Sistem Informasi','Employee Class'],['MNG-KA','Manajemen','Kelas Malam'],['MNG-KM','Manajemen','Kelas Pagi'],['MNG-EC','Manajemen','Employee Class']];
function renderAdminClasses(){
  const q=$('classDirectorySearch').value.trim().toLowerCase();
  const students=Object.values(accounts).filter(a=>a.role==='mahasiswa');
  const schedules=adminScheduleData();
  const rows=knownClasses.map(([code,program,type])=>({code,program,type,count:students.filter(a=>a.className===code).length,schedule:schedules.filter(x=>x.className===code).length})).filter(x=>!q||`${x.code} ${x.program} ${x.type}`.toLowerCase().includes(q));
  $('adminClassDirectory').innerHTML=rows.map(x=>`<article class="request-card"><div class="request-head"><h3>${x.code}</h3><span class="status approved">Terdaftar</span></div><p>${x.program} · ${x.type}</p><div class="mini-stats"><div><b>${x.count}</b><small>Mahasiswa</small></div><div><b>${x.schedule}</b><small>Jadwal tambahan</small></div></div></article>`).join('')||'<div class="empty-state">Kelas tidak ditemukan.</div>';
}
$('classDirectorySearch').addEventListener('input',renderAdminClasses);

function renderAdminStudents(){const d=Object.entries(accounts).filter(([u,a])=>a.role==='mahasiswa');$('adminStudentsList').innerHTML=d.length?d.map(([u,a])=>`<article class="request-card"><h3>${escapeHTML(a.name||u)}</h3><p>Username: ${escapeHTML(u)} · NIM: ${escapeHTML(a.nim||'—')}</p><p>${escapeHTML(a.program||'—')} · ${escapeHTML(a.className||'—')} · ${escapeHTML(a.semester||'—')}</p></article>`).join(''):'<div class="empty-state">Belum ada akun mahasiswa.</div>';}
// Pengaturan foto profil dan nickname (disimpan per akun pada browser ini).
let pendingProfilePhoto = null;
let cropSourceImage = null;
let cropObjectUrl = null;
const cropModal = $('photoCropModal');
const cropPreview = $('photoCropPreview');
function updateCropPreview(){
  if(!cropPreview)return;
  const zoom=Number($('photoCropZoom')?.value||1),x=Number($('photoCropX')?.value||50),y=Number($('photoCropY')?.value||50);
  cropPreview.style.transform=`scale(${zoom})`;cropPreview.style.objectPosition=`${x}% ${y}%`;
}
// WhatsApp-style direct manipulation: drag the image and pinch with two fingers.
const cropPointers = new Map();
let cropDragStart = null;
let cropPinchStart = null;
function cropOverflow(){
  const stage=$('photoCropStage') || cropPreview?.parentElement;
  if(!stage || !cropSourceImage)return {x:1,y:1};
  const w=stage.clientWidth,h=stage.clientHeight;
  const base=Math.max(w/cropSourceImage.width,h/cropSourceImage.height);
  const zoom=Number($('photoCropZoom')?.value||1);
  return {x:Math.max(1,cropSourceImage.width*base*zoom-w),y:Math.max(1,cropSourceImage.height*base*zoom-h)};
}
function cropDistance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
cropPreview?.addEventListener('pointerdown',e=>{
  e.preventDefault();cropPreview.setPointerCapture?.(e.pointerId);cropPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(cropPointers.size===1){cropDragStart={x:e.clientX,y:e.clientY,px:Number($('photoCropX').value),py:Number($('photoCropY').value)};cropPinchStart=null;}
  else if(cropPointers.size===2){const pts=[...cropPointers.values()];cropPinchStart={distance:cropDistance(pts[0],pts[1]),zoom:Number($('photoCropZoom').value)};cropDragStart=null;}
});
cropPreview?.addEventListener('pointermove',e=>{
  if(!cropPointers.has(e.pointerId))return;e.preventDefault();cropPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(cropPointers.size===1 && cropDragStart){const over=cropOverflow();$('photoCropX').value=Math.max(0,Math.min(100,cropDragStart.px-(e.clientX-cropDragStart.x)/over.x*100));$('photoCropY').value=Math.max(0,Math.min(100,cropDragStart.py-(e.clientY-cropDragStart.y)/over.y*100));updateCropPreview();}
  else if(cropPointers.size===2 && cropPinchStart){const pts=[...cropPointers.values()];const next=cropPinchStart.zoom*cropDistance(pts[0],pts[1])/Math.max(1,cropPinchStart.distance);$('photoCropZoom').value=Math.max(1,Math.min(3,next));updateCropPreview();}
});
function endCropPointer(e){cropPointers.delete(e.pointerId);if(cropPointers.size<2)cropPinchStart=null;if(cropPointers.size===1){const p=[...cropPointers.values()][0];cropDragStart={x:p.x,y:p.y,px:Number($('photoCropX').value),py:Number($('photoCropY').value)};}else cropDragStart=null;}
cropPreview?.addEventListener('pointerup',endCropPointer);cropPreview?.addEventListener('pointercancel',endCropPointer);cropPreview?.addEventListener('lostpointercapture',endCropPointer);
function closePhotoCrop(){cropModal?.classList.add('hidden');if(cropObjectUrl){URL.revokeObjectURL(cropObjectUrl);cropObjectUrl=null;}cropSourceImage=null;$('profilePhotoInput').value='';}
$('profilePhotoInput').addEventListener('change', event => {
  const file=event.target.files&&event.target.files[0];if(!file)return;
  if(!file.type.startsWith('image/')){$('profileSettingsMessage').textContent='Pilih file gambar yang valid.';event.target.value='';return;}
  if(file.size>8*1024*1024){$('profileSettingsMessage').textContent='Ukuran foto maksimal 8 MB.';event.target.value='';return;}
  if(cropObjectUrl)URL.revokeObjectURL(cropObjectUrl);cropObjectUrl=URL.createObjectURL(file);
  const img=new Image();img.onload=()=>{cropSourceImage=img;cropPreview.src=cropObjectUrl;$('photoCropZoom').value=1;$('photoCropX').value=50;$('photoCropY').value=50;updateCropPreview();cropModal.classList.remove('hidden');};
  img.onerror=()=>{$('profileSettingsMessage').textContent='Foto tidak dapat dibuka. Coba pilih gambar lain.';closePhotoCrop();};img.src=cropObjectUrl;
});
['photoCropZoom','photoCropX','photoCropY'].forEach(id=>$(id)?.addEventListener('input',updateCropPreview));
$('photoCropClose')?.addEventListener('click',closePhotoCrop);$('photoCropCancel')?.addEventListener('click',closePhotoCrop);
cropModal?.addEventListener('click',e=>{if(e.target===cropModal)closePhotoCrop();});
$('photoCropApply')?.addEventListener('click',()=>{
  if(!cropSourceImage)return;const size=640,zoom=Number($('photoCropZoom').value),px=Number($('photoCropX').value)/100,py=Number($('photoCropY').value)/100;
  const base=Math.max(size/cropSourceImage.width,size/cropSourceImage.height),scale=base*zoom,drawW=cropSourceImage.width*scale,drawH=cropSourceImage.height*scale;
  const overflowX=Math.max(0,drawW-size),overflowY=Math.max(0,drawH-size),dx=-overflowX*px,dy=-overflowY*py;
  const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,size,size);ctx.save();ctx.beginPath();ctx.arc(size/2,size/2,size/2,0,Math.PI*2);ctx.clip();ctx.drawImage(cropSourceImage,dx,dy,drawW,drawH);ctx.restore();
  pendingProfilePhoto=canvas.toDataURL('image/png');const profilePhoto=$('profileStudentPhoto');if(profilePhoto)profilePhoto.src=pendingProfilePhoto;
  $('profileSettingsMessage').textContent='Pratinjau foto bulat berhasil dibuat. Tekan Simpan Perubahan untuk menyimpan.';closePhotoCrop();
});
$('settingsNickname').addEventListener('input', () => {
  const profileName = $('profileStudentName'); if (profileName) profileName.textContent = $('settingsNickname').value.trim() || $('settingsFullName').value || 'Pengguna';
});
document.querySelectorAll('input[name="profileDisplayMode"]').forEach(input => input.addEventListener('change', () => {
  const profileName = $('profileStudentName'); if (profileName) profileName.textContent = input.value === 'nickname' && $('settingsNickname').value.trim() ? $('settingsNickname').value.trim() : $('settingsFullName').value;
}));
$('saveProfileSettings').addEventListener('click', () => {
  if (!currentUser) return;
  const account = activeAccount();
  account.nickname = $('settingsNickname').value.trim();
  account.displayMode = document.querySelector('input[name="profileDisplayMode"]:checked')?.value || 'fullname';
  if (pendingProfilePhoto) account.photo = pendingProfilePhoto;
  accounts[currentUser.username] = account; saveAccounts(); pendingProfilePhoto = null;
  updateHeaderProfile();
  const profileName = $('profileStudentName'); if (profileName) profileName.textContent = profileDisplayName(account);
  $('profileSettingsMessage').textContent = 'Profil berhasil disimpan pada perangkat ini.';
  if (currentUser.role === 'mahasiswa') renderStudentProfile();
});
$('resetProfilePhoto').addEventListener('click', () => {
  if (!currentUser) return;
  const account = activeAccount(); delete account.photo; accounts[currentUser.username] = account; saveAccounts(); pendingProfilePhoto = null;
  const fallback = account.role === 'admin' ? 'assets/logo-horizon.webp' : 'assets/avatar-default.svg';
  const profilePhoto = $('profileStudentPhoto'); if (profilePhoto) profilePhoto.src = fallback; $('profilePhotoInput').value = ''; updateHeaderProfile();
  $('profileSettingsMessage').textContent = 'Foto profil dikembalikan ke foto default.';
});

// Keamanan dan preferensi profil mahasiswa (prototipe lokal).
$('profilePasswordForm')?.addEventListener('submit',event=>{event.preventDefault();const account=activeAccount();const current=$('profileCurrentPassword').value;const next=$('profileNewPassword').value;const confirm=$('profileConfirmPassword').value;const msg=$('profilePasswordMessage');if(current!==account.password){msg.textContent='Password saat ini tidak sesuai.';return;}if(next.length<6){msg.textContent='Password baru minimal 6 karakter.';return;}if(next!==confirm){msg.textContent='Konfirmasi password belum sama.';return;}account.password=next;accounts[currentUser.username]=account;saveAccounts();$('profilePasswordForm').reset();msg.textContent='Password berhasil diperbarui pada perangkat ini.';});
function loadProfilePreferences(){const prefs=activeAccount().preferences||{};document.querySelectorAll('[data-pref]').forEach(input=>input.checked=prefs[input.dataset.pref]!==false);}
$('saveProfilePreferences')?.addEventListener('click',()=>{const account=activeAccount();account.preferences={};document.querySelectorAll('[data-pref]').forEach(input=>account.preferences[input.dataset.pref]=input.checked);accounts[currentUser.username]=account;saveAccounts();$('profilePreferencesMessage').textContent='Preferensi berhasil disimpan pada perangkat ini.';});
if ($('scheduleProgramFilter')) { $('adminScheduleClass').value=selectedAdminClass(); $('adminScheduleSemester').value=$('scheduleSemesterFilter').value; renderAdminSchedules(); }

window.addEventListener('storage', event => {
  if (!event.key) return;
  if (event.key === 'horizonHubAdminSchedule') {
    if (currentUser?.role === 'mahasiswa') { renderSchedule(); renderHomeTodayClass(); }
    if (currentUser?.role === 'admin') { renderAdminSchedules(); renderAdminClasses(); $('adminScheduleCount').textContent=adminScheduleData().length; }
  }
  if (event.key === 'horizonHubLecturers') {
    if (currentUser?.role === 'mahasiswa') renderStudentDirectory();
    if (currentUser?.role === 'admin') renderAdminLecturers();
  }
});

function renderAll() { renderStats(); if (currentUser.role === 'mahasiswa') renderHomePlanner(); if (currentUser.role === 'admin') { renderApprovals(); renderInventoryAdmin(); renderAdminClasses(); renderAdminRooms(); renderAdminLecturers(); renderAdminStudents(); $('adminStudentCount').textContent=Object.values(accounts).filter(a=>a.role==='mahasiswa').length; $('adminPendingCount').textContent=requests.filter(r=>r.status==='Menunggu').length+assetLoanData().filter(r=>r.status==='Menunggu').length; $('adminApprovedCount').textContent=requests.filter(r=>r.status==='Disetujui').length+assetLoanData().filter(r=>['Disetujui','Dipinjam','Dikembalikan'].includes(r.status)).length; $('adminScheduleCount').textContent=adminScheduleData().length; } }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }

// Pencarian sederhana untuk menu
$('globalSearch').addEventListener('input', function () {
  const query = this.value.trim().toLowerCase();
  document.querySelectorAll('.nav-button').forEach(button => {
    button.classList.toggle('search-hidden', query && !button.textContent.toLowerCase().includes(query));
  });
});

// Isi pilihan lantai saat halaman pertama kali dibuka
fillFloorSelect($('bookingFloor'), 'W');
renderSchedule();
renderOfficialMap();
renderBookingRooms();

/* v65 – Student inventory lending + admin approval workflow (local prototype) */
const campusAssetCatalog = [
  {name:'Proyektor',stock:3,category:'av',description:'Perangkat proyeksi untuk presentasi, perkuliahan, dan kegiatan kampus.',condition:'Baik · data kondisi simulasi',location:'Dikonfirmasi admin saat persetujuan',image:'assets/proyektor.jpg'},
  {name:'Speaker',stock:4,category:'av',description:'Perangkat audio untuk mendukung seminar, diskusi, dan kegiatan mahasiswa.',condition:'Baik · data kondisi simulasi',location:'Dikonfirmasi admin saat persetujuan'},
  {name:'Mikrofon',stock:6,category:'av',description:'Mikrofon untuk presentasi, seminar, dan kegiatan di lingkungan kampus.',condition:'Baik · data kondisi simulasi',location:'Dikonfirmasi admin saat persetujuan'},
  {name:'Kamera',stock:2,category:'av',description:'Kamera untuk dokumentasi kegiatan dan kebutuhan akademik.',condition:'Baik · data kondisi simulasi',location:'Dikonfirmasi admin saat persetujuan'},
  {name:'Kursi',stock:40,category:'furniture',description:'Kursi tambahan untuk rapat, diskusi kelompok, dan kegiatan kampus.',condition:'Baik · data kondisi simulasi',location:'Dikonfirmasi admin saat persetujuan'},
  {name:'Meja',stock:12,category:'furniture',description:'Meja tambahan untuk kegiatan akademik dan organisasi mahasiswa.',condition:'Baik · data kondisi simulasi',location:'Dikonfirmasi admin saat persetujuan'},
  {name:'Kabel / adaptor',stock:10,category:'accessory',description:'Kabel dan adaptor pendukung penggunaan perangkat presentasi.',condition:'Baik · data kondisi simulasi',location:'Dikonfirmasi admin saat persetujuan'}
];
function assetStockData(){try{return JSON.parse(localStorage.getItem('horizonHubAssetStock'))||Object.fromEntries(campusAssetCatalog.map(x=>[x.name,x.stock]));}catch(e){return Object.fromEntries(campusAssetCatalog.map(x=>[x.name,x.stock]));}}
function assetLoanData(){return readData('horizonHubAssetLoans');}
function saveAssetLoans(rows){localStorage.setItem('horizonHubAssetLoans',JSON.stringify(rows));}
function assetInterval(row){const start=new Date(`${row.date}T${row.start||'00:00'}:00`).getTime();const end=new Date(`${row.returnDate||row.date}T${row.end||'23:59'}:00`).getTime();return {start,end};}
function assetLoanOverlaps(row,date,start,returnDate,end){const a=assetInterval(row);const b={start:new Date(`${date}T${start}:00`).getTime(),end:new Date(`${returnDate}T${end}:00`).getTime()};return b.start<a.end&&b.end>a.start;}
function reservedAssetQuantity(item,date,start,returnDate,end,excludeId=null){return assetLoanData().filter(row=>row.id!==excludeId&&row.item===item&&['Menunggu','Disetujui','Dipinjam','Overdue'].includes(row.status)&&assetLoanOverlaps(row,date,start,returnDate,end)).reduce((sum,row)=>sum+Number(row.quantity||0),0);}
function assetIconSVG(name,extraClass=''){
  const common=`class="asset-svg ${extraClass}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  const shapes={
    'Proyektor':'<rect x="7" y="13" width="34" height="22" rx="4"/><circle cx="30" cy="24" r="6"/><path d="M12 35v3m24-3v3M16 18h5"/>',
    'Speaker':'<rect x="13" y="5" width="22" height="38" rx="4"/><circle cx="24" cy="18" r="4"/><circle cx="24" cy="31" r="7"/><circle cx="24" cy="31" r="2"/>',
    'Mikrofon':'<rect x="18" y="5" width="12" height="24" rx="6"/><path d="M12 22a12 12 0 0 0 24 0M24 34v8m-7 0h14"/>',
    'Kamera':'<path d="M7 16h8l3-5h12l3 5h8v23H7z"/><circle cx="24" cy="27" r="8"/><circle cx="24" cy="27" r="3"/>',
    'Kursi':'<path d="M13 8v17h22V8M13 25v7h22v-7M16 32l-2 10m18-10 2 10M12 17h24"/>',
    'Meja':'<path d="M6 15h36v6H6zM10 21v21m28-21v21M7 42h34"/>',
    'Kabel / adaptor':'<path d="M17 8v9m-5-9v9m-2 0h14v5a8 8 0 0 1-8 8h-1v5a6 6 0 0 0 6 6h8"/><rect x="27" y="35" width="10" height="8" rx="2"/>'
  };
  return `<svg ${common}>${shapes[name]||'<rect x="8" y="8" width="32" height="32" rx="6"/><path d="M16 24h16M24 16v16"/>'}</svg>`;
}
function assetCurrentCounts(itemName){
  const now=Date.now();
  const active=assetLoanData().filter(row=>row.item===itemName&&['Menunggu','Disetujui','Dipinjam','Overdue'].includes(row.status)&&(()=>{const interval=assetInterval(row);return now>=interval.start&&now<interval.end;})());
  const reserved=active.reduce((sum,row)=>sum+Number(row.quantity||0),0);
  const borrowed=active.filter(row=>['Dipinjam','Overdue'].includes(row.status)).reduce((sum,row)=>sum+Number(row.quantity||0),0);
  return {reserved,borrowed};
}
function getAssetCategoryFilter(targetId){const prefix=targetId==='inventoryAdminCatalog'?'admin':'student';return {query:($(prefix+'InventorySearch')?.value||'').trim().toLowerCase(),category:$(prefix+'InventoryCategory')?.value||'all'};}
function renderAssetCards(targetId){
  const target=$(targetId);if(!target)return;
  const stocks=assetStockData(),filter=getAssetCategoryFilter(targetId);
  const items=campusAssetCatalog.filter(item=>(filter.category==='all'||item.category===filter.category)&&(!filter.query||item.name.toLowerCase().includes(filter.query)||item.description.toLowerCase().includes(filter.query)));
  if(!items.length){target.innerHTML='<div class="inventory-empty"><b>Inventaris tidak ditemukan.</b><br>Coba kata kunci atau kategori lain.</div>';return;}
  target.innerHTML=items.map(item=>{
    const total=Math.max(0,Number(stocks[item.name]??item.stock)),counts=assetCurrentCounts(item.name),available=Math.max(0,total-counts.reserved),availability=available>0?'Tersedia':'Tidak tersedia';
    return `<article class="inventory-item inventory-item-v68" data-asset-card="${escapeHTML(item.name)}">
      <button type="button" class="inventory-card-main" data-asset-detail="${escapeHTML(item.name)}" aria-label="Lihat detail ${escapeHTML(item.name)}">
        <span class="inventory-icon">${assetIconSVG(item.name)}</span>
        <span class="inventory-copy"><b>${escapeHTML(item.name)}</b><small>${total} unit total · ${counts.borrowed} unit sedang dipinjam</small><span class="inventory-availability ${available>0?'available':'unavailable'}">${availability} · ${available} unit</span></span>
        <span class="inventory-card-chevron" aria-hidden="true">›</span>
      </button>
      ${targetId==='studentInventoryCatalog'?`<button type="button" class="inventory-quick-request" data-asset-request="${escapeHTML(item.name)}">Pilih untuk dipinjam</button>`:''}
    </article>`;
  }).join('');
  target.querySelectorAll('[data-asset-detail]').forEach(button=>button.addEventListener('click',()=>openAssetDetail(button.dataset.assetDetail)));
  target.querySelectorAll('[data-asset-request]').forEach(button=>button.addEventListener('click',()=>selectAssetForRequest(button.dataset.assetRequest)));
}
function openAssetDetail(name){
  const item=campusAssetCatalog.find(x=>x.name===name);if(!item)return;
  const stock=assetStockData(),total=Math.max(0,Number(stock[item.name]??item.stock)),counts=assetCurrentCounts(item.name),available=Math.max(0,total-counts.reserved);
  const visual=item.image?`<img class="asset-detail-photo" src="${item.image}" alt="${escapeHTML(item.name)}" onerror="this.hidden=true">`:`<div class="asset-detail-illustration">${assetIconSVG(item.name,'asset-svg-large')}</div>`;
  const content=$('assetDetailContent');if(!content)return;
  content.innerHTML=`<div class="asset-detail-heading"><div><h2 id="assetDetailTitle">${escapeHTML(item.name)}</h2><p>Informasi inventaris kampus</p></div><span class="inventory-availability ${available>0?'available':'unavailable'}">${available>0?'Tersedia':'Tidak tersedia'}</span></div>
    ${visual}<p class="asset-detail-description">${escapeHTML(item.description)}</p>
    <div class="asset-detail-stats"><div><strong>${available}</strong><span>Tersedia sekarang</span></div><div><strong>${counts.borrowed}</strong><span>Sedang dipinjam</span></div><div><strong>${total}</strong><span>Stok total</span></div></div>
    <div class="asset-detail-meta"><div><span>Kondisi</span><b>${escapeHTML(item.condition)}</b></div><div><span>Lokasi pengambilan</span><b>${escapeHTML(item.location)}</b></div><div><span>Aturan penggunaan</span><b>Hanya di area kampus</b></div></div>
    <p class="notice">Jumlah stok merupakan data simulasi prototype, bukan inventaris resmi kampus. Ketersediaan akhir akan diperiksa kembali oleh admin saat persetujuan.</p>
    <div class="modal-actions"><button type="button" class="outline-button" id="assetDetailCloseBottom">Tutup</button>${currentUser?.role==='mahasiswa'?`<button type="button" class="primary-button" id="assetDetailRequest" ${available<1?'disabled':''}>Ajukan Peminjaman</button>`:''}</div>`;
  const modal=$('assetDetailModal');modal?.classList.remove('hidden');
  $('closeAssetDetail')?.focus();
  $('assetDetailCloseBottom')?.addEventListener('click',closeAssetDetail);
  $('assetDetailRequest')?.addEventListener('click',()=>{closeAssetDetail();selectAssetForRequest(item.name);});
}
function closeAssetDetail(){$('assetDetailModal')?.classList.add('hidden');}
function selectAssetForRequest(name){const select=$('assetLoanItem');if(!select)return;select.value=name;updateAssetAvailabilityHint();$('assetLoanForm')?.scrollIntoView({behavior:'smooth',block:'start'});select.focus({preventScroll:true});}
function bindAssetCatalogFilters(){[['studentInventorySearch','studentInventoryCategory','studentInventoryCatalog'],['adminInventorySearch','adminInventoryCategory','inventoryAdminCatalog']].forEach(([search,category,target])=>{[search,category].forEach(id=>$(id)?.addEventListener(id===search?'input':'change',()=>renderAssetCards(target)));});}
bindAssetCatalogFilters();
$('closeAssetDetail')?.addEventListener('click',closeAssetDetail);
$('assetDetailModal')?.addEventListener('click',event=>{if(event.target.id==='assetDetailModal')closeAssetDetail();});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeAssetDetail();});
function renderStudentInventory(){renderAssetCards('studentInventoryCatalog');const date=$('assetLoanDate');if(date)date.min=localDateString();const ret=$('assetReturnDate');if(ret)ret.min=date?.value||localDateString();updateAssetAvailabilityHint();}
function updateAssetAvailabilityHint(){const box=$('assetStockAvailability');if(!box)return;const item=$('assetLoanItem')?.value,date=$('assetLoanDate')?.value,start=$('assetLoanStart')?.value,returnDate=$('assetReturnDate')?.value,end=$('assetLoanEnd')?.value,qty=Number($('assetLoanQty')?.value||0);if(!item||!date||!start||!returnDate||!end){box.textContent='Pilih barang dan periode peminjaman untuk melihat ketersediaan stok simulasi.';box.classList.remove('is-available','is-unavailable');return;}if(returnDate<date||(returnDate===date&&end<=start)){box.textContent='Periksa kembali tanggal dan waktu pengembalian.';box.classList.remove('is-available');box.classList.add('is-unavailable');return;}const stock=assetStockData(),reserved=reservedAssetQuantity(item,date,start,returnDate,end),available=Math.max(0,Number(stock[item]||0)-reserved);box.textContent=`Stok tersedia pada periode tersebut: ${available} dari ${Number(stock[item]||0)} unit${qty>0?` · Permintaanmu: ${qty} unit`:''}.`;box.classList.toggle('is-available',available>0&&(!qty||qty<=available));box.classList.toggle('is-unavailable',available===0||(qty>available));}
function renderInventoryAdmin(){
  renderAssetCards('inventoryAdminCatalog');const rows=assetLoanData();const pending=rows.filter(x=>x.status==='Menunggu');const ready=rows.filter(x=>x.status==='Disetujui');const borrowed=rows.filter(x=>['Dipinjam','Overdue'].includes(x.status));const returned=rows.filter(x=>x.status==='Dikembalikan').length;
  const summary=$('inventoryAdminSummary');if(summary)summary.innerHTML=`<div class="inventory-admin-stat"><b>${pending.length}</b><span>Menunggu approval</span></div><div class="inventory-admin-stat"><b>${borrowed.length}</b><span>Sedang dipinjam</span></div><div class="inventory-admin-stat"><b>${returned}</b><span>Dikembalikan</span></div>`;
  const readyList=$('inventoryReadyList');if(readyList){readyList.innerHTML=ready.length?ready.slice().reverse().map(x=>assetLoanHTML(x,true)).join(''):'<div class="empty-state">Tidak ada barang yang menunggu diambil.</div>';readyList.querySelectorAll('[data-pickup-asset]').forEach(b=>b.addEventListener('click',()=>updateAssetLoanStatus(b.dataset.pickupAsset,'Dipinjam')));}
  const approval=$('inventoryApprovalList');if(approval){approval.innerHTML=pending.length?pending.slice().reverse().map(x=>assetLoanHTML(x,true)).join(''):'<div class="empty-state">Tidak ada pengajuan inventaris yang menunggu.</div>';approval.querySelectorAll('[data-approve-asset]').forEach(b=>b.addEventListener('click',()=>updateAssetLoanStatus(b.dataset.approveAsset,'Disetujui')));approval.querySelectorAll('[data-reject-asset]').forEach(b=>b.addEventListener('click',()=>updateAssetLoanStatus(b.dataset.rejectAsset,'Ditolak')));}
  const active=$('inventoryBorrowedList');if(active){active.innerHTML=borrowed.length?borrowed.slice().reverse().map(x=>assetLoanHTML(x,true)).join(''):'<div class="empty-state">Belum ada barang yang sedang dipinjam.</div>';active.querySelectorAll('[data-return-asset]').forEach(b=>b.addEventListener('click',()=>updateAssetLoanStatus(b.dataset.returnAsset,'Dikembalikan')));active.querySelectorAll('[data-overdue-asset]').forEach(b=>b.addEventListener('click',()=>updateAssetLoanStatus(b.dataset.overdueAsset,'Overdue')));}
}
function updateAssetLoanStatus(id,status){const rows=assetLoanData();const row=rows.find(x=>x.id==id);if(!row)return;const old=row.status;if(status==='Disetujui'){const stock=assetStockData();const reserved=reservedAssetQuantity(row.item,row.date,row.start,row.returnDate||row.date,row.end,row.id);if(reserved+Number(row.quantity)>Number(stock[row.item]||0)){alert('Stok demo tidak mencukupi untuk tanggal tersebut.');return;}row.status='Disetujui';row.approvedAt=new Date().toISOString();row.adminNote='Disetujui. Silakan ambil barang sesuai jadwal.';}else if(status==='Ditolak'){row.status=status;row.adminNote=prompt('Alasan penolakan:')||'Tidak ada keterangan';}else if(status==='Dipinjam'){row.status=status;row.pickedUpAt=new Date().toISOString();row.adminNote='Pengambilan barang dicatat oleh petugas.';}else if(status==='Dikembalikan'){row.status=status;row.returnedAt=new Date().toISOString();row.adminNote='Pengembalian dicatat oleh petugas.';}else{row.status=status;row.adminNote='Ditandai terlambat oleh petugas.';}row.adminId=currentUser.username;saveAssetLoans(rows);addBookingLog('inventory',row.id,old,row.status,row.adminNote);renderInventoryAdmin();renderAssetCards('studentInventoryCatalog');renderStats();alert(`Status inventaris diperbarui: ${row.status}.`);}
['assetLoanItem','assetLoanQty','assetLoanDate','assetLoanStart','assetReturnDate','assetLoanEnd'].forEach(id=>$(id)?.addEventListener('input',()=>{if(id==='assetLoanDate'&&$('assetReturnDate'))$('assetReturnDate').min=$('assetLoanDate').value||localDateString();updateAssetAvailabilityHint();}));
$('assetLoanForm')?.addEventListener('submit',function(event){
  event.preventDefault();if(!currentUser||currentUser.role!=='mahasiswa'){alert('Silakan login sebagai mahasiswa.');return;}
  const item=$('assetLoanItem').value,quantity=Number($('assetLoanQty').value),date=$('assetLoanDate').value,start=$('assetLoanStart').value,returnDate=$('assetReturnDate').value,end=$('assetLoanEnd').value,location=$('assetUsageLocation').value.trim();
  if(!item||!Number.isInteger(quantity)||quantity<1||!date||!start||!returnDate||!end||!location){alert('Lengkapi seluruh data peminjaman.');return;}
  if(date<localDateString()||returnDate<date||(date===returnDate&&end<=start)){alert('Periksa tanggal dan waktu penggunaan serta pengembalian.');return;}
  if(date===localDateString()){const now=new Date(),current=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;if(start<current){alert('Waktu mulai sudah lewat.');return;}}
  const rows=assetLoanData(),stock=assetStockData(),held=reservedAssetQuantity(item,date,start,returnDate,end),available=Number(stock[item]||0)-held;
  if(quantity>available){alert(`Stok demo yang dapat diajukan untuk ${item}: ${Math.max(0,available)} unit.`);return;}
  const row={id:Date.now(),username:currentUser.username,borrower:activeAccount().name,nim:activeAccount().nim,item,quantity,date,start,returnDate,end,location,purpose:$('assetLoanPurpose').value.trim(),status:'Menunggu',createdAt:new Date().toISOString()};rows.push(row);saveAssetLoans(rows);addBookingLog('inventory',row.id,'Baru','Menunggu','Pengajuan inventaris dibuat');this.reset();$('assetLoanMessage').textContent='Pengajuan berhasil dikirim dan menunggu persetujuan admin.';renderStudentInventory();renderHistory();renderStats();
});


// v91 — lightweight homepage photo carousel
(function initStudentPhotoCarousel(){
  const banner=document.querySelector('#appPage .student-photo-carousel');
  if(!banner)return;
  const slides=[...banner.querySelectorAll('.student-photo-slide')];
  const dots=[...banner.querySelectorAll('.student-photo-dots button')];
  if(slides.length<2||slides.length!==dots.length)return;
  let active=0,timer=null;
  const show=(index)=>{
    active=(index+slides.length)%slides.length;
    slides.forEach((slide,i)=>slide.classList.toggle('is-active',i===active));
    dots.forEach((dot,i)=>{
      const selected=i===active;
      dot.classList.toggle('is-active',selected);
      dot.setAttribute('aria-pressed',String(selected));
    });
  };
  const stop=()=>{if(timer){clearInterval(timer);timer=null;}};
  const start=()=>{
    stop();
    if(!document.hidden&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      timer=setInterval(()=>show(active+1),5600);
    }
  };
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>{show(i);start();}));

  // Swipe support for touch screens (including iPhone Safari) and mouse/trackpad drag.
  let gestureStartX=0,gestureStartY=0,gestureActive=false;
  const swipeThreshold=42;
  banner.addEventListener('touchstart',event=>{
    if(!event.touches||event.touches.length!==1)return;
    gestureStartX=event.touches[0].clientX;
    gestureStartY=event.touches[0].clientY;
    gestureActive=true;
    stop();
  },{passive:true});
  banner.addEventListener('touchend',event=>{
    if(!gestureActive||!event.changedTouches||!event.changedTouches.length)return;
    const dx=event.changedTouches[0].clientX-gestureStartX;
    const dy=event.changedTouches[0].clientY-gestureStartY;
    gestureActive=false;
    if(Math.abs(dx)>=swipeThreshold&&Math.abs(dx)>Math.abs(dy)*1.15){
      show(active+(dx<0?1:-1));
    }
    start();
  },{passive:true});
  banner.addEventListener('touchcancel',()=>{gestureActive=false;start();},{passive:true});
  let mouseStartX=null;
  banner.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse'&&event.button===0)mouseStartX=event.clientX;
  });
  banner.addEventListener('pointerup',event=>{
    if(mouseStartX===null)return;
    const dx=event.clientX-mouseStartX;mouseStartX=null;
    if(Math.abs(dx)>=swipeThreshold) {show(active+(dx<0?1:-1));start();}
  });
  banner.addEventListener('mouseenter',stop);
  banner.addEventListener('mouseleave',start);
  document.addEventListener('visibilitychange',start);
  show(0);start();
})();
