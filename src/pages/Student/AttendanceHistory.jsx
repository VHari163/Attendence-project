import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { reportsApi } from '../../services/googleSheets'

export default function StudentAttendanceHistory() {
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
        if (!ignore) setError(err?.message || 'Failed to load attendance history')
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
      <h2>Attendance History</h2>
      {error ? <div style={{ color: '#b91c1c', background: 'rgba(255,0,0,.08)', border: '1px solid rgba(255,0,0,.25)', padding: 10, borderRadius: 10 }}>{error}</div> : null}
      {loading ? <div style={{ opacity: 0.8 }}>Loading history…</div> : null}
      {!loading && report?.records?.length ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Date', 'Subject', 'Semester', 'Section', 'Status'].map((h) => <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '10px 8px' }}>{h}</th>)}</tr></thead>
            <tbody>{(report.records || []).map((r, i) => <tr key={`${r.Date}-${r.Subject}-${i}`}><td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{r.Date}</td><td>{r.Subject}</td><td>{r.Semester}</td><td>{r.Section}</td><td>{r.Status}</td></tr>)}</tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

