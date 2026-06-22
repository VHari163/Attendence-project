import { useEffect, useMemo, useState } from 'react'
import { studentsApi } from '../../services/googleSheets'

export default function AdminStudents() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [students, setStudents] = useState([])

  const [query, setQuery] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')

  const semesters = useMemo(() => {
    const s = new Set(students.map((x) => String(x.semester || '').trim()).filter(Boolean))
    return [...s].sort()
  }, [students])

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await studentsApi.list()
      setStudents(res?.students || [])
    } catch (e) {
      setError(e?.message || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      await refresh()
    })()
  }, [])



  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students.filter((s) => {
      const matchesQuery =
        !q ||
        String(s.rollNo || '').toLowerCase().includes(q) ||
        String(s.studentName || '').toLowerCase().includes(q) ||
        String(s.email || '').toLowerCase().includes(q)

      const matchesSemester = !semesterFilter || String(s.semester || '').trim() === semesterFilter
      return matchesQuery && matchesSemester
    })
  }, [students, query, semesterFilter])

  const [form, setForm] = useState({
    rollNo: '',
    studentName: '',
    semester: '',
    section: '',
    email: '',
    password: '',
  })

  const [mode, setMode] = useState('add') // add | edit

  const startEdit = (s) => {
    setMode('edit')
    setForm({
      rollNo: String(s.rollNo || ''),
      studentName: String(s.studentName || ''),
      semester: String(s.semester || ''),
      section: String(s.section || ''),
      email: String(s.email || ''),
      password: String(s.password || ''),
    })
  }

  const resetForm = () => {
    setMode('add')
    setForm({ rollNo: '', studentName: '', semester: '', section: '', email: '', password: '' })
  }

  const onSave = async (e) => {
    e.preventDefault()
    setError('')

    try {
      if (mode === 'add') {
        await studentsApi.add(form)
      } else {
        const { rollNo, ...updates } = form
        await studentsApi.update(rollNo, updates)
      }
      resetForm()
      await refresh()
    } catch (err) {
      setError(err?.message || 'Save failed')
    }
  }

  const onDelete = async (rollNo) => {
    if (!window.confirm(`Delete student ${rollNo}?`)) return
    setError('')
    try {
      await studentsApi.remove(rollNo)
      await refresh()
    } catch (err) {
      setError(err?.message || 'Delete failed')
    }
  }

  return (
    <div>
      <h2>Students</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, alignItems: 'start' }}>
        <section>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Roll No / Name / Email"
              style={{ flex: '1 1 280px', padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}
            />
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              style={{ width: 220, padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}
            >
              <option value="">All Semesters</option>
              {semesters.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
            <button type="button" className="primary" onClick={refresh} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {error ? <div style={{ color: '#b91c1c', background: 'rgba(255,0,0,.08)', border: '1px solid rgba(255,0,0,.25)', padding: 10, borderRadius: 10 }}>{error}</div> : null}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
              <thead>
                <tr>
                  {['Roll No', 'Name', 'Semester', 'Section', 'Email'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '10px 8px', fontSize: 13, opacity: 0.8 }}>
                      {h}
                    </th>
                  ))}
                  <th style={{ borderBottom: '1px solid var(--border)', padding: '10px 8px', fontSize: 13, opacity: 0.8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.rollNo}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{s.rollNo}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{s.studentName}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{s.semester}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{s.section}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{s.email}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>
                      <button type="button" onClick={() => startEdit(s)} style={{ marginRight: 8, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>
                        Edit
                      </button>
                      <button type="button" onClick={() => onDelete(s.rollNo)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,0,0,.35)', background: 'rgba(255,0,0,.08)', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!filtered.length ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 16, opacity: 0.7 }}>
                      No students found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <aside style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 14, background: 'rgba(170,59,255,.03)' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 18 }}>{mode === 'add' ? 'Add Student' : 'Edit Student'}</h3>

          <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={form.rollNo}
              onChange={(e) => setForm((p) => ({ ...p, rollNo: e.target.value }))}
              placeholder="Roll No"
              required
              style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}
              disabled={mode === 'edit'}
            />
            <input
              value={form.studentName}
              onChange={(e) => setForm((p) => ({ ...p, studentName: e.target.value }))}
              placeholder="Student Name"
              required
              style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input
                value={form.semester}
                onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))}
                placeholder="Semester"
                required
                style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}
              />
              <input
                value={form.section}
                onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))}
                placeholder="Section"
                required
                style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}
              />
            </div>

            <input
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="Email"
              required
              style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Password"
              required
              style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button className="primary" type="submit" style={{ flex: 1 }}>
                {mode === 'add' ? 'Add' : 'Update'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  cursor: 'pointer',
                  flex: 0.7,
                }}
              >
                Cancel
              </button>
            </div>

            <div style={{ fontSize: 12.5, opacity: 0.7 }}>
              Uses backend: <code style={{ fontFamily: 'var(--mono)' }}>studentsList/studentAdd/studentUpdate/studentDelete</code>
            </div>
          </form>
        </aside>
      </div>

      <style>{`
        .primary{margin-top:2px;padding:12px 14px;border-radius:12px;border:1px solid var(--accent-border);background:var(--accent-bg);color:var(--text-h);font-weight:600;cursor:pointer}
        .primary:disabled{opacity:.6;cursor:not-allowed}
      `}</style>
    </div>
  )
}


