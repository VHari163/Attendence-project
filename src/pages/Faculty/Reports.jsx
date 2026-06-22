import { useContext, useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { AuthContext } from '../../context/AuthContext'
import { reportsApi } from '../../services/googleSheets'

export default function FacultyReports() {
  const { session } = useContext(AuthContext)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session?.faculty?.facultyId) return

    let ignore = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await reportsApi.facultyReport({ facultyId: session.faculty.facultyId })
        if (!ignore) setReport(res)
      } catch (err) {
        if (!ignore) setError(err?.message || 'Failed to load faculty report')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [session])

  const exportXlsx = () => {
    const rows = (report?.records || []).map((r) => ({ Date: r.Date, Subject: r.Subject, Semester: r.Semester, Section: r.Section, RollNo: r['Roll No'], Status: r.Status }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Faculty Report')
    XLSX.writeFile(wb, 'faculty-report.xlsx')
  }

  const exportPdf = () => {
    const doc = new jsPDF()
    doc.text('Faculty Attendance Report', 14, 14)
    autoTable(doc, {
      head: [['Date', 'Subject', 'Semester', 'Section', 'Roll No', 'Status']],
      body: (report?.records || []).map((r) => [r.Date, r.Subject, r.Semester, r.Section, r['Roll No'], r.Status]),
      startY: 22,
    })
    doc.save('faculty-report.pdf')
  }

  return (
    <div>
      <h2>Reports</h2>
      {error ? <div style={{ color: '#b91c1c', background: 'rgba(255,0,0,.08)', border: '1px solid rgba(255,0,0,.25)', padding: 10, borderRadius: 10 }}>{error}</div> : null}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <button className="primary" onClick={exportXlsx} disabled={!report}>Excel</button>
        <button className="primary" onClick={exportPdf} disabled={!report}>PDF</button>
      </div>
      <div className="cards">
        <div className="card"><div className="k">Faculty ID</div><div className="v">{session?.faculty?.facultyId || '-'}</div></div>
        <div className="card"><div className="k">Classes Conducted</div><div className="v">{loading ? '...' : report?.classesConducted || 0}</div></div>
        <div className="card"><div className="k">Attendance Records</div><div className="v">{loading ? '...' : report?.attendanceCount || 0}</div></div>
      </div>
      {report?.records?.length ? (
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Date', 'Subject', 'Semester', 'Section', 'Roll No', 'Status'].map((h) => <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '10px 8px' }}>{h}</th>)}</tr></thead>
            <tbody>{report.records.map((r, i) => <tr key={`${r.Date}-${r['Roll No']}-${i}`}><td>{r.Date}</td><td>{r.Subject}</td><td>{r.Semester}</td><td>{r.Section}</td><td>{r['Roll No']}</td><td>{r.Status}</td></tr>)}</tbody>
          </table>
        </div>
      ) : null}
      <style>{`.cards{display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:12px}.card{border:1px solid var(--border);border-radius:14px;padding:14px;background:rgba(170,59,255,.04)}.k{font-size:13px;opacity:.8}.v{font-size:24px;font-weight:800;margin-top:6px}.primary{margin-top:2px;padding:12px 14px;border-radius:12px;border:1px solid var(--accent-border);background:var(--accent-bg);color:var(--text-h);font-weight:600;cursor:pointer}.primary:disabled{opacity:.6;cursor:not-allowed}@media(max-width:900px){.cards{grid-template-columns:1fr}}`}</style>
    </div>
  )
}

