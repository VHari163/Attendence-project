import { useState } from 'react'

export default function AdminDashboard() {
  const [counts] = useState(() => ({ students: '-', faculty: '-', subjects: '-', attendance: '-' }))




  return (
    <div>
      <div className="cards">
        <div className="card">
          <div className="k">Total Students</div>
          <div className="v">{counts?.students}</div>
        </div>
        <div className="card">
          <div className="k">Total Faculty</div>
          <div className="v">{counts?.faculty}</div>
        </div>
        <div className="card">
          <div className="k">Total Subjects</div>
          <div className="v">{counts?.subjects}</div>
        </div>
        <div className="card">
          <div className="k">Total Attendance Records</div>
          <div className="v">{counts?.attendance}</div>
        </div>
      </div>

      <div style={{ marginTop: 14, opacity: 0.8 }}>
        Connect backend endpoints (GAS Web App) to show real metrics.
      </div>

      <style>{`.cards{display:grid;grid-template-columns:repeat(4,minmax(180px,1fr));gap:12px}.card{border:1px solid var(--border);border-radius:14px;padding:14px;background:rgba(170,59,255,.04)}.k{font-size:13px;opacity:.8}.v{font-size:24px;font-weight:800;margin-top:6px}@media(max-width:900px){.cards{grid-template-columns:repeat(2,1fr)}}`}</style>
    </div>
  )
}

