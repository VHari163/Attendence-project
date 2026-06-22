import { useEffect, useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { facultyApi, reportsApi, studentsApi, subjectsApi } from '../../services/googleSheets'

export default function AdminReports() {
  const [students, setStudents] = useState([])
  const [faculty, setFaculty] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedFaculty, setSelectedFaculty] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [studentReport, setStudentReport] = useState(null)
  const [subjectReport, setSubjectReport] = useState(null)
  const [facultyReport, setFacultyReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const semesters = useMemo(() => {
    const s = new Set(subjects.map((x) => String(x.semester || '').trim()).filter(Boolean))
    return [...s].sort()
  }, [subjects])

  useEffect(() => {
    ;(async () => {
      try {
        const [studentsRes, subjectsRes, facultyRes] = await Promise.all([
          studentsApi.list(),
          subjectsApi.list(),
          facultyApi.listBySemester(''),
        ])
        setStudents(studentsRes?.students || [])
        setSubjects(subjectsRes?.subjects || [])
        setFaculty(facultyRes?.faculty || [])
      } catch (err) {
        setError(err?.message || 'Failed to load reports data')
      }
    })()
  }, [])

  const loadStudentReport = async () => {
    if (!selectedStudent) return
    setLoading(true)
    setError('')
    try {
      const res = await reportsApi.studentReport({ rollNo: selectedStudent })
      setStudentReport(res)
    } catch (err) {
      setError(err?.message || 'Failed to load student report')
    } finally {
      setLoading(false)
    }
  }

  const loadSubjectReport = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await reportsApi.subjectReport({ semester: selectedSemester || undefined })
      setSubjectReport(res)
    } catch (err) {
      setError(err?.message || 'Failed to load subject report')
    } finally {
      setLoading(false)
    }
  }

  const loadFacultyReport = async () => {
    if (!selectedFaculty) return
    setLoading(true)
    setError('')
    try {
      const res = await reportsApi.facultyReport({ facultyId: selectedFaculty })
      setFacultyReport(res)
    } catch (err) {
      setError(err?.message || 'Failed to load faculty report')
    } finally {
      setLoading(false)
    }
  }

  const exportTable = (title, rows, headers) => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, title)
    XLSX.writeFile(wb, `${title}.xlsx`)
  }

  const exportPdf = (title, rows, headers) => {
    const doc = new jsPDF()
    doc.text(title, 14, 14)
    autoTable(doc, { head: [headers], body: rows, startY: 22 })
    doc.save(`${title}.pdf`)
  }

  return (
    <div>
      <h2>Reports</h2>
      {error ? <div style={{ color: '#b91c1c', background: 'rgba(255,0,0,.08)', border: '1px solid rgba(255,0,0,.25)', padding: 10, borderRadius: 10, marginBottom: 10 }}>{error}</div> : null}

      <div style={{ display: 'grid', gap: 14 }}>
        <section style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
          <h3 style={{ marginTop: 0 }}>Student Report</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} style={{ minWidth: 260, padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}>
              <option value="">Select Student</option>
              {students.map((s) => <option key={s.rollNo} value={s.rollNo}>{s.rollNo} - {s.studentName}</option>)}
            </select>
            <button className="primary" onClick={loadStudentReport} disabled={loading || !selectedStudent}>Load</button>
            {studentReport ? (
              <>
                <button className="primary" onClick={() => exportTable('Student Report', studentReport.records || [], ['Date', 'Subject', 'Status'])}>Excel</button>
                <button className="primary" onClick={() => exportPdf('Student Report', (studentReport.records || []).map((r) => [r.Date, r.Subject, r.Status]), ['Date', 'Subject', 'Status'])}>PDF</button>
              </>
            ) : null}
          </div>
          {studentReport ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div className="pill">Attendance %: {studentReport.attendancePercentage || 0}%</div>
                <div className="pill">Present: {studentReport.present || 0}</div>
                <div className="pill">Absent: {studentReport.absent || 0}</div>
              </div>
              <div style={{ overflowX: 'auto', marginTop: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Date', 'Subject', 'Status'].map((h) => <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '10px 8px' }}>{h}</th>)}</tr></thead>
                  <tbody>{(studentReport.records || []).map((r, i) => <tr key={`${r.Date}-${r.Subject}-${i}`}><td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{r.Date}</td><td>{r.Subject}</td><td>{r.Status}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>

        <section style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
          <h3 style={{ marginTop: 0 }}>Subject Report</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} style={{ minWidth: 220, padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}>
              <option value="">All Semesters</option>
              {semesters.map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </select>
            <button className="primary" onClick={loadSubjectReport} disabled={loading}>Load</button>
            {subjectReport ? (
              <>
                <button className="primary" onClick={() => exportTable('Subject Report', subjectReport.subjects || [], ['Subject', 'Total', 'Present', 'Absent', 'Percentage'])}>Excel</button>
                <button className="primary" onClick={() => exportPdf('Subject Report', (subjectReport.subjects || []).map((s) => [s.subject, s.total, s.present, s.absent, s.percentage]), ['Subject', 'Total', 'Present', 'Absent', 'Percentage'])}>PDF</button>
              </>
            ) : null}
          </div>
          {subjectReport ? (
            <div style={{ overflowX: 'auto', marginTop: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Subject', 'Total', 'Present', 'Absent', '%'].map((h) => <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '10px 8px' }}>{h}</th>)}</tr></thead>
                <tbody>{(subjectReport.subjects || []).map((s) => <tr key={s.subject}><td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{s.subject}</td><td>{s.total}</td><td>{s.present}</td><td>{s.absent}</td><td>{s.percentage}%</td></tr>)}</tbody>
              </table>
            </div>
          ) : null}
        </section>

        <section style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
          <h3 style={{ marginTop: 0 }}>Faculty Report</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)} style={{ minWidth: 260, padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}>
              <option value="">Select Faculty</option>
              {faculty.map((f) => <option key={`${f.facultyId}-${f.semester}`} value={f.facultyId}>{f.facultyId} - {f.facultyName}</option>)}
            </select>
            <button className="primary" onClick={loadFacultyReport} disabled={loading || !selectedFaculty}>Load</button>
            {facultyReport ? (
              <>
                <button className="primary" onClick={() => exportTable('Faculty Report', facultyReport.records || [], ['Date', 'Subject', 'Status'])}>Excel</button>
                <button className="primary" onClick={() => exportPdf('Faculty Report', (facultyReport.records || []).map((r) => [r.Date, r.Subject, r.Status]), ['Date', 'Subject', 'Status'])}>PDF</button>
              </>
            ) : null}
          </div>
          {facultyReport ? (
            <div style={{ marginTop: 12 }}>
              <div className="pill">Classes Conducted: {facultyReport.classesConducted || 0}</div>
            </div>
          ) : null}
        </section>
      </div>

      <style>{`.primary{margin-top:2px;padding:12px 14px;border-radius:12px;border:1px solid var(--accent-border);background:var(--accent-bg);color:var(--text-h);font-weight:600;cursor:pointer}.primary:disabled{opacity:.6;cursor:not-allowed}.pill{display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;background:var(--accent-bg);font-size:13px}`}</style>
    </div>
  )
}

