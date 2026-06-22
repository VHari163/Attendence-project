/**
 * College Attendance Management System - Google Apps Script Backend
 *
 * Sheets are used as the database.
 *
 * Expected sheets (by name):
 *  - Students
 *  - Faculty
 *  - Subjects
 *  - Attendance
 *
 * Actions are invoked as:  <WEBAPP_URL>?action=<action>
 * Body (POST JSON): { ...payload }
 */

const SHEET_NAMES = {
  students: 'Students',
  faculty: 'Faculty',
  subjects: 'Subjects',
  attendance: 'Attendance',
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || ''
  const message = action
    ? `Apps Script backend is reachable. Action received: ${action}`
    : 'Apps Script backend is reachable. Use POST requests with the action parameter.'

  return withCors_(ContentService.createTextOutput(JSON.stringify({
    ok: true,
    message,
    action,
  })))
}

function doPost(e) {
  try {
    const action = (e.parameter && e.parameter.action) || ''
    const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {}

    let result
    switch (action) {
      // Auth
      case 'facultyLogin':
        result = { faculty: facultyLogin(body) }
        break
      case 'studentLogin':
        result = { student: studentLogin(body) }
        break

      // Dashboard / analytics
      case 'dashboardStats':
        result = dashboardStats()
        break
      case 'attendanceList':
        result = attendanceList()
        break

      // Admin CRUD - Students
      case 'studentsList':
        result = studentsList()
        break
      case 'studentAdd':
        result = studentAdd(body)
        break
      case 'studentUpdate':
        result = studentUpdate(body)
        break
      case 'studentDelete':
        result = studentDelete(body)
        break

      // Subjects
      case 'subjectsList':
        result = subjectsList()
        break
      case 'subjectAdd':
        result = subjectAdd(body)
        break
      case 'subjectUpdate':
        result = subjectUpdate(body)
        break
      case 'subjectDelete':
        result = subjectDelete(body)
        break
      case 'subjectAssignFaculty':
        result = subjectAssignFaculty(body)
        break

      // Faculty (semester-wise append-only)
      case 'facultyListBySemester':
        result = facultyListBySemester(body)
        break
      case 'facultyAppend':
        result = facultyAppend(body)
        break

      // Attendance
      case 'attendanceLoadFaculty':
        result = attendanceLoadFaculty(body)
        break
      case 'attendanceUpsertDay':
        result = attendanceUpsertDay(body)
        break
      case 'attendanceLoadStudent':
        result = attendanceLoadStudent(body)
        break

      // Reports
      case 'reportStudent':
        result = reportStudent(body)
        break
      case 'reportSubject':
        result = reportSubject(body)
        break
      case 'reportFaculty':
        result = reportFaculty(body)
        break

      default:
        result = { error: `Unknown action: ${action}` }
    }

    return withCors_(ContentService.createTextOutput(JSON.stringify(result)))
  } catch (err) {
    return withCors_(ContentService.createTextOutput(JSON.stringify({ error: String(err) })))
  }
}

function doOptions(e) {
  // Preflight response for CORS.
  return withCors_(ContentService.createTextOutput(JSON.stringify({ ok: true })))
}

function withCors_(output) {
  output.setMimeType(ContentService.MimeType.JSON)

  // Apps Script TextOutput does not support setHeader for arbitrary CORS headers.
  // We only set the JSON content type here; the web app can still be called once
  // the script is deployed with the correct access settings.
  return output
}


function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sh = ss.getSheetByName(name)
  if (!sh) throw new Error(`Missing sheet: ${name}`)
  return sh
}

function getHeaderMap_(values) {
  // values[0] is header row
  const headers = values[0]
  const map = {}
  for (let i = 0; i < headers.length; i++) {
    map[String(headers[i]).trim()] = i
  }
  return map
}

function getAllRows_(sheet) {
  const values = sheet.getDataRange().getValues()
  if (values.length < 2) return { header: values[0] || [], rows: [] }
  return { header: values[0], rows: values.slice(1) }
}

function rowToObj_(headers, row) {
  const obj = {}
  for (let i = 0; i < headers.length; i++) {
    obj[String(headers[i]).trim()] = row[i]
  }
  return obj
}

function findRowByField_(sheet, fieldName, fieldValue) {
  const values = sheet.getDataRange().getValues()
  if (values.length < 2) return -1
  const header = values[0]
  const map = getHeaderMap_(values)
  const col = map[fieldName]
  if (col == null) return -1
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][col]).trim() === String(fieldValue).trim()) {
      return r + 1 // sheet row number
    }
  }
  return -1
}

function nextEmptyRow_(sheet) {
  // Finds the first row (starting from 2) where all cells are empty.
  // If sheet has no content, returns 2.
  const last = sheet.getLastRow()
  if (last < 2) return 2

  const colCount = sheet.getLastColumn() || 1
  const start = 2
  for (let r = start; r <= last + 1; r++) {
    const row = sheet.getRange(r, 1, 1, colCount).getValues()[0]
    const any = row.some((c) => c !== '' && c != null)
    if (!any) return r
  }
  return last + 1
}

// ---------------- AUTH ----------------
function facultyLogin(body) {
  const { emailOrId, password } = body || {}
  if (!emailOrId || !password) return null

  const sh = getSheet_(SHEET_NAMES.faculty)
  const values = sh.getDataRange().getValues()
  if (values.length < 2) return null
  const headers = values[0]

  for (let r = 1; r < values.length; r++) {
    const row = values[r]
    const obj = rowToObj_(headers, row)

    const facultyOk =
      (String(obj['Faculty ID'] || '').trim() === String(emailOrId).trim() ||
        String(obj['Email'] || '').trim() === String(emailOrId).trim()) &&
      String(obj['Password'] || '').trim() === String(password).trim()

    if (facultyOk) {
      return {
        facultyId: obj['Faculty ID'],
        facultyName: obj['Faculty Name'],
        email: obj['Email'],
        semester: obj['Semester'],
      }
    }
  }
  return null
}

function studentLogin(body) {
  const { email, password } = body || {}
  if (!email || !password) return null

  const sh = getSheet_(SHEET_NAMES.students)
  const values = sh.getDataRange().getValues()
  if (values.length < 2) return null
  const headers = values[0]

  for (let r = 1; r < values.length; r++) {
    const row = values[r]
    const obj = rowToObj_(headers, row)
    const ok =
      String(obj['Email'] || '').trim() === String(email).trim() &&
      String(obj['Password'] || '').trim() === String(password).trim()

    if (ok) {
      return {
        rollNo: obj['Roll No'],
        studentName: obj['Student Name'],
        semester: obj['Semester'],
        section: obj['Section'],
        email: obj['Email'],
      }
    }
  }
  return null
}

// ---------------- STUDENTS ----------------
function studentsList() {
  const sh = getSheet_(SHEET_NAMES.students)
  const values = sh.getDataRange().getValues()
  if (values.length < 2) return { students: [] }

  const headers = values[0]
  const rows = values.slice(1).map((row) => rowToObj_(headers, row))
  return { students: rows }
}

function studentAdd(body) {
  const sh = getSheet_(SHEET_NAMES.students)
  const values = sh.getDataRange().getValues()
  const headers = values[0]
  const idx = headers

  const map = {}
  for (let i = 0; i < headers.length; i++) map[String(headers[i]).trim()] = i

  const rollNo = body.rollNo
  if (!rollNo) return { error: 'rollNo required' }

  // Avoid overwrite: if rollNo exists, do not insert.
  const existingRow = findRowByField_(sh, 'Roll No', rollNo)
  if (existingRow !== -1) {
    return { error: `Student Roll No ${rollNo} already exists` }
  }

  const newRow = new Array(headers.length).fill('')
  newRow[map['Roll No']] = body.rollNo
  newRow[map['Student Name']] = body.studentName
  newRow[map['Semester']] = body.semester
  newRow[map['Section']] = body.section
  newRow[map['Email']] = body.email
  newRow[map['Password']] = body.password

  const rowNumber = nextEmptyRow_(sh)
  sh.getRange(rowNumber, 1, 1, newRow.length).setValues([newRow])
  return { ok: true }
}

function studentUpdate(body) {
  const sh = getSheet_(SHEET_NAMES.students)
  const { rollNo, studentName, semester, section, email, password } = body || {}
  if (!rollNo) return { error: 'rollNo required' }

  const rowNumber = findRowByField_(sh, 'Roll No', rollNo)
  if (rowNumber === -1) return { error: 'Student not found' }

  const values = sh.getDataRange().getValues()
  const headers = values[0]
  const map = getHeaderMap_(values)

  const row = sh.getRange(rowNumber, 1, 1, headers.length).getValues()[0]
  const obj = rowToObj_(headers, row)

  if (studentName != null) obj['Student Name'] = studentName
  if (semester != null) obj['Semester'] = semester
  if (section != null) obj['Section'] = section
  if (email != null) obj['Email'] = email
  if (password != null) obj['Password'] = password

  const updated = new Array(headers.length).fill('')
  for (let i = 0; i < headers.length; i++) updated[i] = obj[headers[i]]

  sh.getRange(rowNumber, 1, 1, headers.length).setValues([updated])
  return { ok: true }
}

function studentDelete(body) {
  const sh = getSheet_(SHEET_NAMES.students)
  const { rollNo } = body || {}
  if (!rollNo) return { error: 'rollNo required' }

  const rowNumber = findRowByField_(sh, 'Roll No', rollNo)
  if (rowNumber === -1) return { error: 'Student not found' }

  sh.deleteRow(rowNumber)
  return { ok: true }
}

// ---------------- FACULTY (append-only) ----------------
function facultyListBySemester(body) {
  const { semester } = body || {}
  const sh = getSheet_(SHEET_NAMES.faculty)
  const values = sh.getDataRange().getValues()
  if (values.length < 2) return { faculty: [] }

  const headers = values[0]
  const rows = values.slice(1).map((row) => rowToObj_(headers, row))
  const filtered = semester ? rows.filter((r) => String(r['Semester']).trim() === String(semester).trim()) : rows
  return { faculty: filtered }
}

function facultyAppend(body) {
  const sh = getSheet_(SHEET_NAMES.faculty)
  const values = sh.getDataRange().getValues()
  if (values.length < 1) return { error: 'Faculty sheet missing header' }
  const headers = values[0]
  const map = getHeaderMap_(values)

  const facultyId = body.facultyId
  const facultyName = body.facultyName
  const email = body.email
  const password = body.password
  const subject = body.subject
  const semester = body.semester

  if (!facultyId || !facultyName || !email || !password || !subject || !semester) {
    return { error: 'Missing faculty fields' }
  }

  // Important: append-only, next empty row, never overwrite
  const newRow = new Array(headers.length).fill('')
  newRow[map['Faculty ID']] = facultyId
  newRow[map['Faculty Name']] = facultyName
  newRow[map['Email']] = email
  newRow[map['Password']] = password
  newRow[map['Subject']] = subject
  newRow[map['Semester']] = semester

  const rowNumber = nextEmptyRow_(sh)
  sh.getRange(rowNumber, 1, 1, newRow.length).setValues([newRow])
  return { ok: true }
}

// ---------------- SUBJECTS ----------------
function subjectsList() {
  const sh = getSheet_(SHEET_NAMES.subjects)
  const values = sh.getDataRange().getValues()
  if (values.length < 2) return { subjects: [] }
  const headers = values[0]
  const rows = values.slice(1).map((row) => rowToObj_(headers, row))
  return { subjects: rows }
}

function subjectAdd(body) {
  const sh = getSheet_(SHEET_NAMES.subjects)
  const values = sh.getDataRange().getValues()
  const headers = values[0]
  const map = getHeaderMap_(values)

  const subjectCode = body.subjectCode
  if (!subjectCode) return { error: 'subjectCode required' }

  const existingRow = findRowByField_(sh, 'Subject Code', subjectCode)
  if (existingRow !== -1) return { error: `Subject ${subjectCode} already exists` }

  const newRow = new Array(headers.length).fill('')
  newRow[map['Subject Code']] = subjectCode
  newRow[map['Subject Name']] = body.subjectName
  newRow[map['Semester']] = body.semester
  newRow[map['Faculty ID']] = body.facultyId || ''

  const rowNumber = nextEmptyRow_(sh)
  sh.getRange(rowNumber, 1, 1, newRow.length).setValues([newRow])
  return { ok: true }
}

function subjectUpdate(body) {
  const { subjectCode, subjectName, semester } = body || {}
  if (!subjectCode) return { error: 'subjectCode required' }

  const sh = getSheet_(SHEET_NAMES.subjects)
  const rowNumber = findRowByField_(sh, 'Subject Code', subjectCode)
  if (rowNumber === -1) return { error: 'Subject not found' }

  const values = sh.getDataRange().getValues()
  const headers = values[0]
  const row = sh.getRange(rowNumber, 1, 1, headers.length).getValues()[0]
  const obj = rowToObj_(headers, row)

  if (subjectName != null) obj['Subject Name'] = subjectName
  if (semester != null) obj['Semester'] = semester

  const updated = new Array(headers.length).fill('')
  for (let i = 0; i < headers.length; i++) updated[i] = obj[headers[i]]

  sh.getRange(rowNumber, 1, 1, headers.length).setValues([updated])
  return { ok: true }
}

function subjectDelete(body) {
  const { subjectCode } = body || {}
  if (!subjectCode) return { error: 'subjectCode required' }
  const sh = getSheet_(SHEET_NAMES.subjects)
  const rowNumber = findRowByField_(sh, 'Subject Code', subjectCode)
  if (rowNumber === -1) return { error: 'Subject not found' }
  sh.deleteRow(rowNumber)
  return { ok: true }
}

function subjectAssignFaculty(body) {
  const { subjectCode, facultyId } = body || {}
  if (!subjectCode || !facultyId) return { error: 'subjectCode and facultyId required' }

  const sh = getSheet_(SHEET_NAMES.subjects)
  const rowNumber = findRowByField_(sh, 'Subject Code', subjectCode)
  if (rowNumber === -1) return { error: 'Subject not found' }

  const values = sh.getDataRange().getValues()
  const headers = values[0]
  const map = getHeaderMap_(values)

  sh.getRange(rowNumber, map['Faculty ID'] + 1).setValue(facultyId)
  return { ok: true }
}

// ---------------- ATTENDANCE ----------------
// Attendance row schema:
// Date | Semester | Section | Subject | Roll No | Student Name | Status
function attendanceRowsHeader_() {
  // Using sheet headers
  const sh = getSheet_(SHEET_NAMES.attendance)
  const values = sh.getDataRange().getValues()
  if (!values.length) throw new Error('Attendance sheet missing header')
  return values[0]
}

function attendanceLoadFaculty(body) {
  const { semester, section, facultyId, date } = body || {}

  // We cannot reliably map faculty->subject without joining; but subject is already present.
  // Frontend will pass `subject` during attendance saving. For loading we return all students
  // matching semester/section and the subjects assigned to this faculty for the semester.

  const studentsSh = getSheet_(SHEET_NAMES.students)
  const studentsValues = studentsSh.getDataRange().getValues()
  if (studentsValues.length < 2) return { students: [], subjects: [] }
  const sHeaders = studentsValues[0]

  const students = studentsValues
    .slice(1)
    .map((row) => rowToObj_(sHeaders, row))
    .filter((s) => String(s['Semester']).trim() === String(semester).trim() && String(s['Section']).trim() === String(section).trim())

  const subjectsSh = getSheet_(SHEET_NAMES.subjects)
  const subjValues = subjectsSh.getDataRange().getValues()
  const subHeaders = subjValues[0]
  const subjects = subjValues.length < 2
    ? []
    : subjValues
        .slice(1)
        .map((row) => rowToObj_(subHeaders, row))
        .filter((sub) => String(sub['Semester']).trim() === String(semester).trim() && String(sub['Faculty ID']).trim() === String(facultyId).trim())

  // For each subject, we also can load existing attendance for that date.
  return { students, subjects, existing: [] }
}

function attendanceUpsertDay(body) {
  const { date, semester, section, subject, rows } = body || {}
  if (!date || !semester || !section || !subject || !rows) return { error: 'Missing attendance payload' }

  const sh = getSheet_(SHEET_NAMES.attendance)
  const values = sh.getDataRange().getValues()
  const headers = values[0]
  const map = getHeaderMap_(values)

  // Find existing rows for this date/semester/section/subject
  const targetKey = {
    date: String(date).trim(),
    semester: String(semester).trim(),
    section: String(section).trim(),
    subject: String(subject).trim(),
  }

  let updatedCount = 0
  let insertedCount = 0

  // Build index: key -> rowNumber
  const index = {}
  for (let r = 1; r < values.length; r++) {
    const obj = rowToObj_(headers, values[r])
    const key = [
      String(obj['Date']).trim(),
      String(obj['Semester']).trim(),
      String(obj['Section']).trim(),
      String(obj['Subject']).trim(),
      String(obj['Roll No']).trim(),
    ].join('|')
    index[key] = r + 1
  }

  rows.forEach((it) => {
    const rollNo = it.rollNo
    const studentName = it.studentName
    const status = it.status

    const key = [
      targetKey.date,
      targetKey.semester,
      targetKey.section,
      targetKey.subject,
      String(rollNo).trim(),
    ].join('|')

    const rowNumber = index[key]

    if (rowNumber) {
      // Edit same day (same key)
      sh.getRange(rowNumber, map['Status'] + 1).setValue(status)
      updatedCount++
    } else {
      // Insert in next empty row (append)
      const newRow = new Array(headers.length).fill('')
      newRow[map['Date']] = date
      newRow[map['Semester']] = semester
      newRow[map['Section']] = section
      newRow[map['Subject']] = subject
      newRow[map['Roll No']] = rollNo
      newRow[map['Student Name']] = studentName
      newRow[map['Status']] = status

      const rowNum = nextEmptyRow_(sh)
      sh.getRange(rowNum, 1, 1, newRow.length).setValues([newRow])
      insertedCount++
    }
  })

  return { ok: true, updatedCount, insertedCount }
}

function attendanceLoadStudent(body) {
  const { rollNo } = body || {}
  if (!rollNo) return { records: [] }

  const sh = getSheet_(SHEET_NAMES.attendance)
  const values = sh.getDataRange().getValues()
  if (values.length < 2) return { records: [] }

  const headers = values[0]
  const rows = values
    .slice(1)
    .map((row) => rowToObj_(headers, row))
    .filter((r) => String(r['Roll No']).trim() === String(rollNo).trim())

  // compute percentage per subject and overall
  return { records: rows }
}

function attendanceList() {
  const sh = getSheet_(SHEET_NAMES.attendance)
  const values = sh.getDataRange().getValues()
  if (values.length < 2) return { records: [] }

  const headers = values[0]
  const records = values.slice(1).map((row) => rowToObj_(headers, row))
  return { records }
}

function dashboardStats() {
  const students = studentsList().students || []
  const subjects = subjectsList().subjects || []
  const faculty = facultyListBySemester({}).faculty || []
  const attendance = attendanceList().records || []

  return {
    students: students.length,
    faculty: faculty.length,
    subjects: subjects.length,
    attendance: attendance.length,
  }
}

// ---------------- REPORTS ----------------
function reportStudent(body) {
  const { rollNo } = body || {}
  const load = attendanceLoadStudent({ rollNo })
  const records = load.records || []

  const total = records.length
  const present = records.filter((r) => String(r['Status']).toLowerCase() === 'present').length
  const absent = records.filter((r) => String(r['Status']).toLowerCase() === 'absent').length

  const bySubject = {}
  records.forEach((r) => {
    const sub = String(r['Subject']).trim()
    if (!bySubject[sub]) bySubject[sub] = { subject: sub, total: 0, present: 0, absent: 0 }
    bySubject[sub].total++
    if (String(r['Status']).toLowerCase() === 'present') bySubject[sub].present++
    if (String(r['Status']).toLowerCase() === 'absent') bySubject[sub].absent++
  })

  const subjects = Object.values(bySubject).map((s) => ({
    ...s,
    percentage: s.total ? Math.round((s.present / s.total) * 100) : 0,
  }))

  return {
    rollNo,
    total,
    present,
    absent,
    attendancePercentage: total ? Math.round((present / total) * 100) : 0,
    subjects,
    records,
  }
}

function reportSubject(body) {
  const { semester } = body || {}
  const records = attendanceList().records || []

  const bySubject = {}
  records.forEach((r) => {
    const sub = String(r['Subject'] || '').trim()
    const sem = String(r['Semester'] || '').trim()
    if (semester && sem !== String(semester).trim()) return
    if (!sub) return
    if (!bySubject[sub]) {
      bySubject[sub] = { subject: sub, total: 0, present: 0, absent: 0 }
    }
    const entry = bySubject[sub]
    entry.total++
    if (String(r['Status']).toLowerCase() === 'present') entry.present++
    if (String(r['Status']).toLowerCase() === 'absent') entry.absent++
  })

  const subjects = Object.values(bySubject).map((item) => ({
    ...item,
    percentage: item.total ? Math.round((item.present / item.total) * 100) : 0,
  }))

  return { subjects }
}

function reportFaculty(body) {
  const { facultyId } = body || {}
  if (!facultyId) return { error: 'facultyId required' }

  // Subjects assigned to faculty
  const subjectsSh = getSheet_(SHEET_NAMES.subjects)
  const subValues = subjectsSh.getDataRange().getValues()
  const subHeaders = subValues[0]
  const assignedSubjects = subValues.length < 2
    ? []
    : subValues.slice(1).map((row) => rowToObj_(subHeaders, row)).filter((s) => String(s['Faculty ID']).trim() === String(facultyId).trim())

  const attendanceSh = getSheet_(SHEET_NAMES.attendance)
  const values = attendanceSh.getDataRange().getValues()
  if (values.length < 2) return { facultyId, classesConducted: 0, attendanceCount: 0, records: [] }
  const headers = values[0]

  const records = values
    .slice(1)
    .map((row) => rowToObj_(headers, row))
    .filter((r) => {
      const attSub = String(r['Subject']).trim()
      return assignedSubjects.some((s) => {
        const code = String(s['Subject Code'] || '').trim()
        const name = String(s['Subject Name'] || '').trim()
        return (code && attSub === code) || (name && attSub === name)
      })
    })

  const dates = new Set(records.map((r) => String(r['Date']).trim()).filter(Boolean))

  return {
    facultyId,
    classesConducted: dates.size,
    attendanceCount: records.length,
    records,
  }
}

