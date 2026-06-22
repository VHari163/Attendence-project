import { Link, Outlet, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { useContext } from 'react'
import './layout.css'

const nav = [
  { to: '/student', label: 'Dashboard' },
  { to: '/student/history', label: 'Attendance History' },
]

export default function StudentLayout() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">Student ERP</div>
        <nav className="nav">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="navLink">
              {n.label}
            </Link>
          ))}
        </nav>
        <button
          className="logout"
          onClick={() => {
            auth?.logout?.()
            navigate('/')
          }}
        >
          Logout
        </button>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="title">Student</div>
          <div className="right">Attendance % & subject-wise history</div>
        </div>
        <Outlet />
      </main>
    </div>
  )
}

