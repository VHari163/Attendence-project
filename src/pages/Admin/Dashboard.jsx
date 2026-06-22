import { useEffect, useState } from 'react'
import { reportsApi } from '../../services/googleSheets'

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ students: 0, faculty: 0, subjects: 0, attendance: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await reportsApi.dashboardStats()
        if (!ignore) {
          setCounts({
            students: res?.students || 0,
            faculty: res?.faculty || 0,
            subjects: res?.subjects || 0,
            attendance: res?.attendance || 0,
          })
        }
      } catch (err) {
        if (!ignore) setError(err?.message || 'Failed to load dashboard stats')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div>
      {error ? (
        <div style={{ color: '#b91c1c', background: 'rgba(255,0,0,.08)', border: '1px solid rgba(255,0,0,.25)', padding: 10, borderRadius: 10, marginBottom: 12 }}>
          {error}
        </div>
      ) : null}

      <div className="cards">
        <div className="card">
          <div className="k">Total Students</div>
          <div className="v">{loading ? '...' : counts.students}</div>
        </div>
        <div className="card">
          <div className="k">Total Faculty</div>
          <div className="v">{loading ? '...' : counts.faculty}</div>
        </div>
        <div className="card">
          <div className="k">Total Subjects</div>
          <div className="v">{loading ? '...' : counts.subjects}</div>
        </div>
        <div className="card">
          <div className="k">Total Attendance Records</div>
          <div className="v">{loading ? '...' : counts.attendance}</div>
        </div>
      </div>

      <style>{`.cards{display:grid;grid-template-columns:repeat(4,minmax(180px,1fr));gap:12px}.card{border:1px solid var(--border);border-radius:14px;padding:14px;background:rgba(170,59,255,.04)}.k{font-size:13px;opacity:.8}.v{font-size:24px;font-weight:800;margin-top:6px}@media(max-width:900px){.cards{grid-template-columns:repeat(2,1fr)}}`}</style>
    </div>
  )
}

