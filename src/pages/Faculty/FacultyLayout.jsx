import { Link, Outlet, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { useContext } from 'react'
import './layout.css'

const nav = [
  { to: '/faculty', label: 'Dashboard' },
  { to: '/faculty/attendance', label: 'Attendance' },
  { to: '/faculty/reports', label: 'Reports' },
]

export default function FacultyLayout() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">Faculty ERP</div>
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
          <div className="title">Faculty</div>
          <div className="right">Mark attendance & view reports</div>
        </div>
        <Outlet />
      </main>
    </div>
  )
}

