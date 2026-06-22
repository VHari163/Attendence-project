import { postJson } from './api'

export async function loginAdmin(username, password) {
  return username === 'admin' && password === 'admin123'
}

export async function validateFacultyLogin(emailOrId, password) {
  const result = await postJson('facultyLogin', {
    emailOrId,
    password,
  })
  return result?.faculty || null
}

export async function validateStudentLogin(email, password) {
  const result = await postJson('studentLogin', {
    email,
    password,
  })
  return result?.student || null
}

// ---- Students CRUD ----
export const studentsApi = {
  list: async () => postJson('studentsList'),
  add: async (student) => postJson('studentAdd', student),
  update: async (rollNo, updates) => postJson('studentUpdate', { rollNo, ...updates }),
  remove: async (rollNo) => postJson('studentDelete', { rollNo }),
}

// ---- Faculty (semester-wise append-only) ----
export const facultyApi = {
  listBySemester: async (semester) => postJson('facultyListBySemester', { semester }),
  appendNew: async ({ facultyId, facultyName, email, password, subject, semester }) =>
    postJson('facultyAppend', {
      facultyId,
      facultyName,
      email,
      password,
      subject,
      semester,
    }),
}

// ---- Subjects ----
export const subjectsApi = {
  list: async () => postJson('subjectsList'),
  add: async (subject) => postJson('subjectAdd', subject),
  update: async (subjectCode, updates) =>
    postJson('subjectUpdate', { subjectCode, ...updates }),
  remove: async (subjectCode) => postJson('subjectDelete', { subjectCode }),
  assignFaculty: async ({ subjectCode, facultyId }) =>
    postJson('subjectAssignFaculty', { subjectCode, facultyId }),
}

// ---- Attendance ----
export const attendanceApi = {
  listAll: async () => postJson('attendanceList'),
  loadForFaculty: async ({ semester, section, facultyId, date }) =>
    postJson('attendanceLoadFaculty', { semester, section, facultyId, date }),

  saveAttendanceForDay: async ({ date, semester, section, subject, rows }) =>
    postJson('attendanceUpsertDay', { date, semester, section, subject, rows }),

  loadForStudent: async ({ rollNo }) => postJson('attendanceLoadStudent', { rollNo }),
}

// ---- Reports / Analytics ----
export const reportsApi = {
  dashboardStats: async () => postJson('dashboardStats'),
  studentReport: async ({ rollNo }) => postJson('reportStudent', { rollNo }),
  subjectReport: async ({ semester } = {}) => postJson('reportSubject', { semester }),
  facultyReport: async ({ facultyId }) => postJson('reportFaculty', { facultyId }),
}

