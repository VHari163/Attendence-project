# Google Apps Script Backend (Web App)

## 1) Prepare Google Sheets
Create sheets (by name):
- **Students**
- **Faculty**
- **Subjects**
- **Attendance**

Ensure headers match the prompt (exact strings including spaces):
- Students: Roll No | Student Name | Semester | Section | Email | Password
- Faculty: Faculty ID | Faculty Name | Email | Password | Subject | Semester
- Subjects: Subject Code | Subject Name | Semester | Faculty ID
- Attendance: Date | Semester | Section | Subject | Roll No | Student Name | Status

## 2) Deploy Apps Script
1. In Google Drive → **New → More → Google Apps Script**
2. Copy/paste `Code.gs` contents into `Code.gs` in Apps Script editor
3. In Apps Script editor: deploy
   - **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (or at least “Anyone with the link”)
4. Copy the **Web app URL**

## 3) Configure frontend
In Vite, set:
- `VITE_GAS_WEBAPP_URL=<YOUR_WEBAPP_URL>`

Example:
- Create `.env` at project root with:
  - `VITE_GAS_WEBAPP_URL=https://script.google.com/macros/s/XXXXX/exec`

## 4) Frontend expected actions
This backend supports `action` values called from `src/services/googleSheets.js`:
- facultyLogin
- studentLogin
- studentsList / studentAdd / studentUpdate / studentDelete
- subjectsList / subjectAdd / subjectUpdate / subjectDelete / subjectAssignFaculty
- facultyListBySemester / facultyAppend
- attendanceLoadFaculty / attendanceUpsertDay / attendanceLoadStudent
- reportStudent / reportFaculty

## 5) Important requirement: faculty append-only
When adding faculty for a semester:
- backend appends the row into the next empty row
- it never overwrites previous faculty records
- previous semester records are preserved

