import { createContext, useEffect, useMemo, useState, useContext } from 'react'
import {
  loginAdmin,
  validateFacultyLogin,
  validateStudentLogin,
} from '../services/googleSheets'

const AuthContext = createContext(null)


const initialSession = () => {
  try {
    const raw = sessionStorage.getItem('attendance_session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function AuthProvider({ children }) {
  const [session, setSession] = useState(initialSession)

  useEffect(() => {
    if (session) sessionStorage.setItem('attendance_session', JSON.stringify(session))
    else sessionStorage.removeItem('attendance_session')
  }, [session])

  const value = useMemo(() => {
    return {
      session,
      login: async ({ role, username, password }) => {
        if (role === 'admin') {
          const ok = await loginAdmin(username, password)
          if (!ok) throw new Error('Invalid admin credentials')
          setSession({ role: 'admin', username })
          return
        }

        if (role === 'faculty') {
          const faculty = await validateFacultyLogin(username, password)
          if (!faculty) throw new Error('Invalid faculty credentials')
          setSession({ role: 'faculty', faculty })
          return
        }

        if (role === 'student') {
          const student = await validateStudentLogin(username, password)
          if (!student) throw new Error('Invalid student credentials')
          setSession({ role: 'student', student })
          return
        }

        throw new Error('Unknown role')
      },
      logout: () => setSession(null),
    }
  }, [session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function RequireRole({ role, children }) {
  const ctx = useContext(AuthContext)
  const session = ctx?.session

  if (session?.role !== role) return null
  return children
}

export { AuthContext, AuthProvider, RequireRole }




