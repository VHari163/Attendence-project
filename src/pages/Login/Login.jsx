import { useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AuthContext } from '../../context/AuthContext'
import './login.css'

export default function Login() {
  const navigate = useNavigate()
  const auth = useContext(AuthContext)

  const [role, setRole] = useState('admin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hint = useMemo(() => {
    if (role === 'admin') return 'Use admin / admin123'
    if (role === 'faculty') return 'Enter Faculty Email or Faculty ID'
    return 'Enter Student Email'
  }, [role])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await auth.login({ role, username, password })
      if (role === 'admin') navigate('/admin')
      if (role === 'faculty') navigate('/faculty')
      if (role === 'student') navigate('/student')
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="loginWrap">
      <div className="loginCard">
        <h1 className="loginTitle">College Attendance</h1>
        <p className="loginSubtitle">ERP-style Attendance Management</p>

        <form className="loginForm" onSubmit={onSubmit}>
          <div className="row">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div className="row">
            <label>{role === 'student' ? 'Email' : 'Username / Email / Faculty ID'}</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={role === 'admin' ? 'admin' : ''}
              required
            />
          </div>

          <div className="row">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="hint">{hint}</div>

          {error ? <div className="error">{error}</div> : null}

          <button className="primary" disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="footerNote">
          Backend: Google Sheets via Google Apps Script Web App
        </div>
      </div>
    </div>
  )
}

