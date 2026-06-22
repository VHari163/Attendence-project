import { Link, Outlet, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { useContext } from 'react'
import './layout.css'

const nav = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/students', label: 'Students' },
  { to: '/admin/faculty', label: 'Faculty' },
  { to: '/admin/subjects', label: 'Subjects' },
  { to: '/admin/reports', label: 'Reports' },
]

export default function AdminLayout() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">Admin ERP</div>
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
          <div className="title">Admin</div>
          <div className="right">Manage Students • Faculty • Subjects</div>
        </div>

        <Outlet />
      </main>
    </div>
  )
}

