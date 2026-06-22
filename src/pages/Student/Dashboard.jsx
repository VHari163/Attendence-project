import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { reportsApi } from '../../services/googleSheets'

export default function StudentDashboard() {
  const { session } = useContext(AuthContext)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session?.student?.rollNo) return

    let ignore = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await reportsApi.studentReport({ rollNo: session.student.rollNo })
        if (!ignore) setReport(res)
      } catch (err) {
        if (!ignore) setError(err?.message || 'Failed to load student overview')
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
      <h2>My Dashboard</h2>
      {error ? <div style={{ color: '#b91c1c', background: 'rgba(255,0,0,.08)', border: '1px solid rgba(255,0,0,.25)', padding: 10, borderRadius: 10 }}>{error}</div> : null}
      <div className="cards">
        <div className="card"><div className="k">Attendance %</div><div className="v">{loading ? '...' : `${report?.attendancePercentage || 0}%`}</div></div>
        <div className="card"><div className="k">Present</div><div className="v">{loading ? '...' : report?.present || 0}</div></div>
        <div className="card"><div className="k">Absent</div><div className="v">{loading ? '...' : report?.absent || 0}</div></div>
      </div>
      <div style={{ marginTop: 14 }}>
        <h3 style={{ marginBottom: 8 }}>Subject-wise Attendance</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Subject', 'Total', 'Present', 'Absent', '%'].map((h) => <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '10px 8px' }}>{h}</th>)}</tr></thead>
            <tbody>{(report?.subjects || []).map((s) => <tr key={s.subject}><td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{s.subject}</td><td>{s.total}</td><td>{s.present}</td><td>{s.absent}</td><td>{s.percentage}%</td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <style>{`.cards{display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:12px}.card{border:1px solid var(--border);border-radius:14px;padding:14px;background:rgba(170,59,255,.04)}.k{font-size:13px;opacity:.8}.v{font-size:24px;font-weight:800;margin-top:6px}@media(max-width:900px){.cards{grid-template-columns:1fr}}`}</style>
    </div>
  )
}

