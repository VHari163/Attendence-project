# College Attendance Management System - TODO

## 0) Scaffolding & Routing
- [ ] Add routing (React Router) + App layout
- [ ] Create AuthContext (sessionStorage) + Login page
- [ ] Add sidebar/navbar + responsive base styles


## 1) Frontend Services (Google Apps Script API client)
- [ ] Create `src/services/api.js` (fetch wrapper)
- [ ] Create `src/services/googleSheets.js` (CRUD + attendance + reports calls)

## 2) UI Components & Pages
- [ ] Implement Admin pages: Dashboard, Students, Faculty, Subjects, Reports
- [ ] Implement Faculty pages: Dashboard, Attendance, Reports
- [ ] Implement Student pages: Dashboard, AttendanceHistory
- [ ] Implement reusable tables/components + search/filter/pagination basics
- [ ] Add toasts/loading/spinners

## 3) Attendance Logic
- [ ] Prevent duplicate attendance for same date/semester/section/subject/rollNo
- [ ] Allow editing attendance for the current day (same-day update)

## 4) Export Features
- [ ] Export Excel (xlsx)
- [ ] Export PDF (jspdf)

## 5) Google Apps Script Backend
- [ ] Create `backend/Code.gs` implementing:

  - [ ] Admin credential check
  - [ ] Faculty/Student login from Sheets
  - [ ] CRUD for Students
  - [ ] Faculty semester-wise append-only insert (next empty row, never overwrite)
  - [ ] CRUD for Subjects + assign Faculty
  - [ ] Attendance load/save w/ duplicate prevention and same-day edit
  - [ ] Reports generation endpoints
- [ ] Add `backend/README.md` with deployment steps

## 6) Wiring & Testing
- [ ] Wire frontend to backend endpoints
- [ ] Run npm install + npm run dev
- [ ] Manual test flows (Admin/Faculty/Student)

