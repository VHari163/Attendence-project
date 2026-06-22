import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { reportsApi, subjectsApi } from '../../services/googleSheets'

export default function FacultyDashboard() {
  const { session } = useContext(AuthContext)
  const [assignedSubjects, setAssignedSubjects] = useState([])
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
        const [subjectsRes, reportRes] = await Promise.all([
          subjectsApi.list(),
          reportsApi.facultyReport({ facultyId: session.faculty.facultyId }),
        ])
        if (!ignore) {
          setAssignedSubjects((subjectsRes?.subjects || []).filter((s) => String(s.facultyId || '').trim() === String(session.faculty.facultyId).trim()))
          setReport(reportRes)
        }
      } catch (err) {
        if (!ignore) setError(err?.message || 'Failed to load dashboard data')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [session])

  return (
    <div>
      <h2>Dashboard</h2>
      {error ? <div style={{ color: '#b91c1c', background: 'rgba(255,0,0,.08)', border: '1px solid rgba(255,0,0,.25)', padding: 10, borderRadius: 10 }}>{error}</div> : null}
      <div className="cards">
        <div className="card"><div className="k">Assigned Subjects</div><div className="v">{loading ? '...' : assignedSubjects.length}</div></div>
        <div className="card"><div className="k">Classes Conducted</div><div className="v">{loading ? '...' : report?.classesConducted || 0}</div></div>
        <div className="card"><div className="k">Attendance Records</div><div className="v">{loading ? '...' : report?.attendanceCount || 0}</div></div>
      </div>
      <div style={{ marginTop: 14 }}>
        <h3 style={{ marginBottom: 8 }}>Assigned Subjects</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Subject Code', 'Subject Name', 'Semester'].map((h) => <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '10px 8px' }}>{h}</th>)}</tr></thead>
            <tbody>{assignedSubjects.map((s) => <tr key={s.subjectCode}><td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{s.subjectCode}</td><td>{s.subjectName}</td><td>{s.semester}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <style>{`.cards{display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:12px}.card{border:1px solid var(--border);border-radius:14px;padding:14px;background:rgba(170,59,255,.04)}.k{font-size:13px;opacity:.8}.v{font-size:24px;font-weight:800;margin-top:6px}@media(max-width:900px){.cards{grid-template-columns:1fr}}`}</style>
    </div>
  )
}

