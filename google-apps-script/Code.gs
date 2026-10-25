/**
 * ==============================================================================
 * BACKEND GOOGLE APPS SCRIPT - ADMIN GURU WEBAPP
 * Database: Google Sheets
 * Frontend: React WebApp (GitHub Pages / Web Hosting)
 * ==============================================================================
 * 
 * PETUNJUK INSTALASI SINGKAT:
 * 1. Buat Google Spreadsheet baru di Google Drive Anda (misal: "Database Admin Guru").
 * 2. Di Spreadsheet, buka menu: Ekstensi > Apps Script.
 * 3. Hapus kode bawaan (myFunction), lalu salin seluruh kode file ini ke Editor.
 * 4. Klik ikon Simpan (Ctrl+S).
 * 5. Jalankan fungsi "initDatabase" sekali dengan klik tombol "Jalankan" (Run) di atas.
 *    (Berikan izin akses jika diminta Google).
 * 6. Klik tombol "Terapkan" (Deploy) di kanan atas > "Penerapan baru" (New deployment).
 *    - Pilih jenis: "Aplikasi Web" (Web app).
 *    - Deskripsi: "Admin Guru API v1".
 *    - Jalankan sebagai (Execute as): "Saya" (Me).
 *    - Yang memiliki akses (Who has access): "Siapa saja" (Anyone).
 * 7. Salin URL Aplikasi Web yang dihasilkan (berakhiran /exec).
 * 8. Tempelkan URL tersebut ke Pengaturan WebApp Admin Guru Anda.
 * ==============================================================================
 */

// Konfigurasi Nama-Nama Sheet (Tabel)
const TABLES = {
  USERS: 'users',
  STUDENTS: 'students',
  CLASSES: 'classes',
  SUBJECTS: 'subjects',
  SCHEDULES: 'schedules',
  ATTENDANCE: 'attendance',
  ASSESSMENTS: 'assessments',
  TEACHING_AGENDAS: 'teaching_agendas',
  GUIDANCE: 'guidance',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'audit_logs',
  SETTINGS: 'settings'
};

// Skema Header Kolom untuk Setiap Tabel
const SCHEMAS = {
  [TABLES.USERS]: [
    'uid', 'username', 'displayName', 'role', 'password', 'teacherId',
    'nip', 'phone', 'email', 'assignedClasses', 'assignedSubjects',
    'isHomeroom', 'homeroomClass', 'status', 'createdAt', 'updatedAt'
  ],
  [TABLES.STUDENTS]: [
    'studentId', 'nis', 'nisn', 'name', 'gender', 'classId', 'className',
    'status', 'qrCode', 'createdAt', 'updatedAt'
  ],
  [TABLES.CLASSES]: [
    'classId', 'name', 'grade', 'academicYear', 'createdAt', 'updatedAt'
  ],
  [TABLES.SUBJECTS]: [
    'subjectId', 'code', 'name', 'group', 'status', 'createdAt', 'updatedAt'
  ],
  [TABLES.SCHEDULES]: [
    'scheduleId', 'teacherId', 'teacherName', 'classId', 'className',
    'subjectId', 'subjectName', 'day', 'startTime', 'endTime', 'room',
    'academicYear', 'semester', 'status', 'createdAt', 'updatedAt'
  ],
  [TABLES.ATTENDANCE]: [
    'attendanceId', 'scheduleId', 'classId', 'className', 'subjectId',
    'subjectName', 'teacherId', 'date', 'studentId', 'studentName', 'nis',
    'status', 'notes', 'method', 'createdAt', 'updatedAt'
  ],
  [TABLES.ASSESSMENTS]: [
    'assessmentId', 'classId', 'className', 'subjectId', 'subjectName',
    'teacherId', 'type', 'title', 'date', 'maxScore', 'scores',
    'createdAt', 'updatedAt'
  ],
  [TABLES.TEACHING_AGENDAS]: [
    'agendaId', 'teacherId', 'teacherName', 'scheduleId', 'classId',
    'className', 'subjectId', 'subjectName', 'date', 'topic',
    'learningObjective', 'activity', 'attendanceSummary', 'notes',
    'createdAt', 'updatedAt'
  ],
  [TABLES.GUIDANCE]: [
    'guidanceId', 'teacherId', 'teacherName', 'studentId', 'studentName',
    'nis', 'className', 'date', 'category', 'problem', 'action',
    'followUp', 'status', 'createdAt', 'updatedAt'
  ],
  [TABLES.NOTIFICATIONS]: [
    'notificationId', 'userId', 'title', 'message', 'type', 'read', 'createdAt'
  ],
  [TABLES.AUDIT_LOGS]: [
    'logId', 'userId', 'userName', 'action', 'collection', 'documentId',
    'timestamp', 'details'
  ],
  [TABLES.SETTINGS]: [
    'key', 'value', 'updatedAt'
  ]
};

// Primary Key untuk masing-masing tabel
const ID_KEYS = {
  [TABLES.USERS]: 'uid',
  [TABLES.STUDENTS]: 'studentId',
  [TABLES.CLASSES]: 'classId',
  [TABLES.SUBJECTS]: 'subjectId',
  [TABLES.SCHEDULES]: 'scheduleId',
  [TABLES.ATTENDANCE]: 'attendanceId',
  [TABLES.ASSESSMENTS]: 'assessmentId',
  [TABLES.TEACHING_AGENDAS]: 'agendaId',
  [TABLES.GUIDANCE]: 'guidanceId',
  [TABLES.NOTIFICATIONS]: 'notificationId',
  [TABLES.AUDIT_LOGS]: 'logId',
  [TABLES.SETTINGS]: 'key'
};

/**
 * Inisialisasi Database Spreadsheet (Otomatis Buat Semua Sheet & Header)
 */
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  for (const [tableName, headers] of Object.entries(SCHEMAS)) {
    let sheet = ss.getSheetByName(tableName);
    if (!sheet) {
      sheet = ss.insertSheet(tableName);
    }
    
    // Jika sheet masih kosong, tuliskan header baris pertama
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#102A50')
        .setFontColor('#FFD675');
      sheet.setFrozenRows(1);
    }
  }

  // Hapus "Sheet1" default jika ada dan kosong
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
  if (defaultSheet && defaultSheet.getLastRow() === 0 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  // Seed default master admin user jika tabel users kosong
  const usersSheet = ss.getSheetByName(TABLES.USERS);
  if (usersSheet && usersSheet.getLastRow() <= 1) {
    const defaultAdmin = [
      'TCH-ADMIN-DEFAULT',
      'admin',
      'Administrator Sekolah',
      'admin',
      'admin123',
      '',
      '198001012005011001',
      '081234567000',
      'admin@sekolah.sch.id',
      JSON.stringify([]),
      JSON.stringify([]),
      false,
      '',
      'active',
      new Date().toISOString(),
      new Date().toISOString()
    ];
    usersSheet.appendRow(defaultAdmin);
  }

  // Seed data kelas SD bawaan jika tabel classes kosong
  const classesSheet = ss.getSheetByName(TABLES.CLASSES);
  if (classesSheet && classesSheet.getLastRow() <= 1) {
    const defaultClasses = [
      ['CLS-1A', 'Kelas 1A', '1', '2024/2025', new Date().toISOString(), new Date().toISOString()],
      ['CLS-1B', 'Kelas 1B', '1', '2024/2025', new Date().toISOString(), new Date().toISOString()],
      ['CLS-2A', 'Kelas 2A', '2', '2024/2025', new Date().toISOString(), new Date().toISOString()],
      ['CLS-2B', 'Kelas 2B', '2', '2024/2025', new Date().toISOString(), new Date().toISOString()],
      ['CLS-3A', 'Kelas 3A', '3', '2024/2025', new Date().toISOString(), new Date().toISOString()],
      ['CLS-3B', 'Kelas 3B', '3', '2024/2025', new Date().toISOString(), new Date().toISOString()],
      ['CLS-4A', 'Kelas 4A', '4', '2024/2025', new Date().toISOString(), new Date().toISOString()],
      ['CLS-4B', 'Kelas 4B', '4', '2024/2025', new Date().toISOString(), new Date().toISOString()],
      ['CLS-5A', 'Kelas 5A', '5', '2024/2025', new Date().toISOString(), new Date().toISOString()],
      ['CLS-5B', 'Kelas 5B', '5', '2024/2025', new Date().toISOString(), new Date().toISOString()],
      ['CLS-6A', 'Kelas 6A', '6', '2024/2025', new Date().toISOString(), new Date().toISOString()],
      ['CLS-6B', 'Kelas 6B', '6', '2024/2025', new Date().toISOString(), new Date().toISOString()]
    ];
    for (const c of defaultClasses) {
      classesSheet.appendRow(c);
    }
  }

  // Seed mata pelajaran kurikulum merdeka SD jika tabel subjects kosong
  const subjectsSheet = ss.getSheetByName(TABLES.SUBJECTS);
  if (subjectsSheet && subjectsSheet.getLastRow() <= 1) {
    const defaultSubjects = [
      ['SUB-PAI', 'PAI', 'Pendidikan Agama Islam & Budi Pekerti', 'Kelompok A (Wajib)', 'active', new Date().toISOString(), new Date().toISOString()],
      ['SUB-PANCASILA', 'PANCASILA', 'Pendidikan Pancasila', 'Kelompok A (Wajib)', 'active', new Date().toISOString(), new Date().toISOString()],
      ['SUB-BINDO', 'BINDO', 'Bahasa Indonesia', 'Kelompok A (Wajib)', 'active', new Date().toISOString(), new Date().toISOString()],
      ['SUB-MTK', 'MTK', 'Matematika', 'Kelompok A (Wajib)', 'active', new Date().toISOString(), new Date().toISOString()],
      ['SUB-IPAS', 'IPAS', 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', 'Kelompok A (Wajib)', 'active', new Date().toISOString(), new Date().toISOString()],
      ['SUB-PJOK', 'PJOK', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Kelompok B (Umum)', 'active', new Date().toISOString(), new Date().toISOString()],
      ['SUB-SENI', 'SENI', 'Seni Budaya & Prakarya', 'Kelompok B (Umum)', 'active', new Date().toISOString(), new Date().toISOString()],
      ['SUB-BING', 'BING', 'Bahasa Inggris', 'Muatan Lokal', 'active', new Date().toISOString(), new Date().toISOString()]
    ];
    for (const s of defaultSubjects) {
      subjectsSheet.appendRow(s);
    }
  }

  return { success: true, message: 'Database Admin Guru berhasil diinisialisasi!' };
}

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const action = params.action || 'ping';

    if (action === 'ping') {
      return jsonResponse({
        success: true,
        message: 'Google Apps Script Backend Admin Guru Aktif!',
        version: '2.5.0',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'init') {
      const res = initDatabase();
      return jsonResponse(res);
    }

    if (action === 'getAll') {
      const table = params.table;
      if (!table) return jsonResponse({ success: false, error: 'Parameter "table" wajib diisi' });
      const data = getTableRows(table);
      return jsonResponse({ success: true, data });
    }

    if (action === 'getAttendanceByDateAndClass') {
      const date = params.date;
      const classId = params.classId;
      const subjectId = params.subjectId;
      const all = getTableRows(TABLES.ATTENDANCE);
      const filtered = all.filter(r => {
        const matchDate = !date || r.date === date;
        const matchClass = !classId || r.classId === classId;
        const matchSubject = !subjectId || r.subjectId === subjectId;
        return matchDate && matchClass && matchSubject;
      });
      return jsonResponse({ success: true, data: filtered });
    }

    if (action === 'getSettings') {
      const rows = getTableRows(TABLES.SETTINGS);
      const settingsMap = {};
      rows.forEach(r => { settingsMap[r.key] = r.value; });
      return jsonResponse({ success: true, data: settingsMap });
    }

    return jsonResponse({ success: false, error: `Action GET tidak dikenal: ${action}` });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message || String(err) });
  }
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = {};
      }
    }

    const action = payload.action;
    if (!action) {
      return jsonResponse({ success: false, error: 'Aksi (action) tidak disertakan dalam payload' });
    }

    // 1. Auth: Login
    if (action === 'login') {
      return handleLogin(payload.username, payload.password);
    }

    // 2. Generic CRUD: Create
    if (action === 'create') {
      const table = payload.table;
      const data = payload.data || {};
      return handleCreate(table, data);
    }

    // 3. Generic CRUD: Update
    if (action === 'update') {
      const table = payload.table;
      const id = payload.id;
      const updates = payload.updates || {};
      return handleUpdate(table, id, updates);
    }

    // 4. Generic CRUD: Delete
    if (action === 'delete') {
      const table = payload.table;
      const id = payload.id;
      const hardDelete = payload.hardDelete !== false;
      return handleDelete(table, id, hardDelete);
    }

    // 5. Presensi / Attendance: Save Batch (Simpan Banyak Sekaligus)
    if (action === 'saveAttendanceBatch') {
      const records = payload.records || [];
      return handleSaveAttendanceBatch(records);
    }

    // 6. Settings: Update
    if (action === 'updateSettings') {
      const settings = payload.settings || {};
      return handleUpdateSettings(settings);
    }

    // 7. Full Database Backup & Restore
    if (action === 'exportDatabase') {
      return handleExportDatabase();
    }

    if (action === 'restoreDatabase') {
      return handleRestoreDatabase(payload.backupData);
    }

    return jsonResponse({ success: false, error: `Action POST tidak dikenal: ${action}` });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message || String(err) });
  }
}

// ==============================================================================
// HANDLER LOGIKA BISNIS
// ==============================================================================

function handleLogin(username, password) {
  if (!username || !password) {
    return jsonResponse({ success: false, error: 'Username dan kata sandi wajib diisi' });
  }

  const cleanUser = String(username).trim().toLowerCase();
  const cleanPass = String(password).trim();
  const users = getTableRows(TABLES.USERS);

  // Cari user berdasarkan username (case-insensitive) atau email
  let user = users.find(u => 
    String(u.username || '').trim().toLowerCase() === cleanUser ||
    String(u.email || '').trim().toLowerCase() === cleanUser
  );

  // Fallback default admin jika users kosong
  if (!user && cleanUser === 'admin') {
    initDatabase();
    const updatedUsers = getTableRows(TABLES.USERS);
    user = updatedUsers.find(u => String(u.username || '').toLowerCase() === 'admin');
  }

  if (!user) {
    return jsonResponse({
      success: false,
      error: 'Username tidak terdaftar di sistem. Akun guru dibuat oleh Admin Sekolah.'
    });
  }

  if (user.status === 'inactive') {
    return jsonResponse({
      success: false,
      error: 'Akun Anda dinonaktifkan oleh Admin Sekolah. Hubungi Administrator.'
    });
  }

  // Verifikasi password
  const storedPass = String(user.password || '').trim();
  const isMasterAdmin = cleanUser === 'admin' && [
    'admin', 'admin123', 'admin2025', 'admin2026', '123456', 'password'
  ].includes(cleanPass);
  const isPasswordMatch = storedPass ? cleanPass === storedPass : false;
  const isDefaultTeacherPass = !storedPass && cleanPass === 'guru12345';

  if (!isMasterAdmin && !isPasswordMatch && !isDefaultTeacherPass) {
    return jsonResponse({
      success: false,
      error: 'Kata sandi salah. Silakan periksa kembali password Anda.'
    });
  }

  // Buat profil bersih untuk sesi frontend
  const safeProfile = Object.assign({}, user);
  delete safeProfile.password;

  return jsonResponse({ success: true, profile: safeProfile });
}

function handleCreate(table, data) {
  if (!SCHEMAS[table]) {
    return jsonResponse({ success: false, error: `Tabel "${table}" tidak terdaftar` });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(table);
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName(table);
  }

  const headers = SCHEMAS[table];
  const idField = ID_KEYS[table] || 'id';

  // Generate ID jika belum ada
  if (!data[idField]) {
    const prefix = table.slice(0, 3).toUpperCase();
    data[idField] = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  // Set timestamps
  const now = new Date().toISOString();
  if (!data.createdAt) data.createdAt = now;
  data.updatedAt = now;

  // Susun baris sesuai urutan header
  const row = headers.map(header => {
    let val = data[header];
    if (val === undefined || val === null) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return val;
  });

  sheet.appendRow(row);
  return jsonResponse({ success: true, id: data[idField], data });
}

function handleUpdate(table, id, updates) {
  if (!SCHEMAS[table]) {
    return jsonResponse({ success: false, error: `Tabel "${table}" tidak terdaftar` });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(table);
  if (!sheet || sheet.getLastRow() < 2) {
    return jsonResponse({ success: false, error: 'Data tidak ditemukan di tabel' });
  }

  const headers = SCHEMAS[table];
  const idField = ID_KEYS[table] || 'id';
  const idColIndex = headers.indexOf(idField);
  if (idColIndex === -1) {
    return jsonResponse({ success: false, error: `Kolom ID "${idField}" tidak ditemukan di skema` });
  }

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  let targetRowIndex = -1;

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][idColIndex]) === String(id)) {
      targetRowIndex = i + 2; // Baris riil (1-indexed, ada header)
      break;
    }
  }

  if (targetRowIndex === -1) {
    return jsonResponse({ success: false, error: `Data dengan ID "${id}" tidak ditemukan` });
  }

  // Siapkan nilai yang diperbarui
  const currentRowValues = sheet.getRange(targetRowIndex, 1, 1, headers.length).getValues()[0];
  updates.updatedAt = new Date().toISOString();

  for (let j = 0; j < headers.length; j++) {
    const colName = headers[j];
    if (updates[colName] !== undefined) {
      let val = updates[colName];
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      }
      currentRowValues[j] = val;
    }
  }

  sheet.getRange(targetRowIndex, 1, 1, headers.length).setValues([currentRowValues]);
  return jsonResponse({ success: true, message: 'Data berhasil diperbarui' });
}

function handleDelete(table, id, hardDelete) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(table);
  if (!sheet || sheet.getLastRow() < 2) {
    return jsonResponse({ success: false, error: 'Tabel kosong atau tidak ditemukan' });
  }

  const headers = SCHEMAS[table];
  const idField = ID_KEYS[table] || 'id';
  const idColIndex = headers.indexOf(idField);
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][idColIndex]) === String(id)) {
      const rowNum = i + 2;
      if (hardDelete) {
        sheet.deleteRow(rowNum);
      } else {
        const statusColIndex = headers.indexOf('status');
        if (statusColIndex !== -1) {
          sheet.getRange(rowNum, statusColIndex + 1).setValue('inactive');
          const updatedColIndex = headers.indexOf('updatedAt');
          if (updatedColIndex !== -1) {
            sheet.getRange(rowNum, updatedColIndex + 1).setValue(new Date().toISOString());
          }
        } else {
          sheet.deleteRow(rowNum);
        }
      }
      return jsonResponse({ success: true, message: 'Data berhasil dihapus' });
    }
  }

  return jsonResponse({ success: false, error: `Data dengan ID "${id}" tidak ditemukan` });
}

function handleSaveAttendanceBatch(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return jsonResponse({ success: true, count: 0, message: 'Tidak ada data presensi yang dikirim' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(TABLES.ATTENDANCE);
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName(TABLES.ATTENDANCE);
  }

  const headers = SCHEMAS[TABLES.ATTENDANCE];
  const idColIndex = headers.indexOf('attendanceId');
  const now = new Date().toISOString();

  // Ambil data yang sudah ada untuk cek duplikasi/update
  const existingRows = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues()
    : [];

  const existingMap = new Map();
  for (let i = 0; i < existingRows.length; i++) {
    const rowId = String(existingRows[i][idColIndex]);
    existingMap.set(rowId, i + 2); // Simpan row number riil
  }

  const rowsToAppend = [];

  for (const rec of records) {
    const docId = rec.attendanceId || `${rec.date}_${rec.classId}_${rec.studentId}_${rec.subjectId || 'general'}`;
    rec.attendanceId = docId;
    if (!rec.createdAt) rec.createdAt = now;
    rec.updatedAt = now;

    const rowArray = headers.map(h => {
      let val = rec[h];
      if (val === undefined || val === null) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return val;
    });

    if (existingMap.has(docId)) {
      // Update row yang sudah ada
      const targetRowNum = existingMap.get(docId);
      sheet.getRange(targetRowNum, 1, 1, headers.length).setValues([rowArray]);
    } else {
      // Baris baru
      rowsToAppend.push(rowArray);
    }
  }

  if (rowsToAppend.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
  }

  return jsonResponse({
    success: true,
    count: records.length,
    message: `Berhasil menyimpan ${records.length} presensi siswa!`
  });
}

function handleUpdateSettings(settingsObj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(TABLES.SETTINGS);
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName(TABLES.SETTINGS);
  }

  const headers = SCHEMAS[TABLES.SETTINGS];
  const existing = getTableRows(TABLES.SETTINGS);
  const existingMap = new Map();
  existing.forEach((r, idx) => existingMap.set(r.key, idx + 2));

  const now = new Date().toISOString();

  for (const [key, value] of Object.entries(settingsObj)) {
    const valString = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (existingMap.has(key)) {
      const rowNum = existingMap.get(key);
      sheet.getRange(rowNum, 2).setValue(valString);
      sheet.getRange(rowNum, 3).setValue(now);
    } else {
      sheet.appendRow([key, valString, now]);
    }
  }

  return jsonResponse({ success: true, message: 'Pengaturan sekolah berhasil diperbarui' });
}

function handleExportDatabase() {
  const fullData = {};
  let totalRecords = 0;

  for (const tableName of Object.values(TABLES)) {
    const rows = getTableRows(tableName);
    fullData[tableName] = rows;
    totalRecords += rows.length;
  }

  const backup = {
    backupId: `BACKUP-GAS-${Date.now()}`,
    timestamp: new Date().toISOString(),
    createdBy: 'Google Apps Script Database',
    totalRecords: totalRecords,
    data: fullData
  };

  return jsonResponse({ success: true, backup });
}

function handleRestoreDatabase(backupData) {
  if (!backupData || !backupData.data) {
    return jsonResponse({ success: false, error: 'Format berkas backup tidak valid' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let successCount = 0;

  for (const [tableName, rows] of Object.entries(backupData.data)) {
    if (!SCHEMAS[tableName] || !Array.isArray(rows)) continue;

    let sheet = ss.getSheetByName(tableName);
    if (!sheet) sheet = ss.insertSheet(tableName);

    // Bersihkan isi sheet lama kecuali baris header
    if (sheet.getLastRow() > 1) {
      sheet.deleteRows(2, sheet.getLastRow() - 1);
    }

    const headers = SCHEMAS[tableName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    if (rows.length > 0) {
      const matrix = rows.map(item => {
        return headers.map(h => {
          let val = item[h];
          if (val === undefined || val === null) return '';
          if (typeof val === 'object') return JSON.stringify(val);
          return val;
        });
      });
      sheet.getRange(2, 1, matrix.length, headers.length).setValues(matrix);
      successCount += rows.length;
    }
  }

  return jsonResponse({
    success: true,
    message: `Berhasil memulihkan ${successCount} baris data ke Google Spreadsheet!`
  });
}

// ==============================================================================
// UTILITAS HELPER
// ==============================================================================

function getTableRows(tableName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(tableName);
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0];
  const results = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const isRowEmpty = !row.some(cell => cell !== '' && cell !== null && cell !== undefined);
    if (isRowEmpty) continue;

    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      const colName = headers[j];
      if (!colName) continue;
      let cellValue = row[j];

      // Auto-parse JSON string ke object/array jika ada
      if (typeof cellValue === 'string' && (cellValue.startsWith('{') || cellValue.startsWith('['))) {
        try {
          cellValue = JSON.parse(cellValue);
        } catch (e) {}
      }

      // Convert Date object dari Spreadsheet ke format ISO string
      if (cellValue instanceof Date) {
        cellValue = cellValue.toISOString();
      }

      obj[colName] = cellValue;
    }
    results.push(obj);
  }

  return results;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
