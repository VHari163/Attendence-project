import { useEffect, useMemo, useState } from 'react'
import { facultyApi, subjectsApi } from '../../services/googleSheets'

export default function AdminFaculty() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [semester, setSemester] = useState('')
  const [faculty, setFaculty] = useState([])

  const [subjects, setSubjects] = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)

  const semesters = useMemo(() => {
    const s = new Set(
      subjects.map((x) => String(x.semester || '').trim()).filter(Boolean)
    )
    return [...s].sort()
  }, [subjects])

  const availableSubjects = useMemo(() => {
    const sem = String(semester || '').trim()
    if (!sem) return []
    return subjects.filter((sub) => String(sub.semester || '').trim() === sem)
  }, [subjects, semester])

  const refreshSubjects = async () => {
    setSubjectsLoading(true)
    try {
      const res = await subjectsApi.list()
      setSubjects(res?.subjects || [])
    } catch (err) {
      setError(err?.message || '')
    } finally {
      setSubjectsLoading(false)
    }
  }

  const refreshFaculty = async (sem) => {
    const s = sem ?? semester
    if (!s) return

    setLoading(true)
    setError('')
    try {
      const res = await facultyApi.listBySemester(s)
      setFaculty(res?.faculty || [])
    } catch (err) {
      setError(err?.message || 'Failed to load faculty')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      await refreshSubjects()
    })()
  }, [])



  useEffect(() => {
    if (!semester) return

    ;(async () => {
      await refreshFaculty(semester)
      // note: we don't guard against setState after unmount to keep ESLint happy
    })()

    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semester])


  const [form, setForm] = useState({
    facultyId: '',
    facultyName: '',
    email: '',
    password: '',
    subject: '',
    semester: '',
  })

  const onAppend = async (e) => {
    e.preventDefault()
    setError('')

    try {
      await facultyApi.appendNew({
        facultyId: form.facultyId,
        facultyName: form.facultyName,
        email: form.email,
        password: form.password,
        subject: form.subject,
        semester: form.semester,
      })

      setForm({
        facultyId: '',
        facultyName: '',
        email: '',
        password: '',
        subject: '',
        semester: '',
      })

      if (semester) await refreshFaculty(semester)
    } catch (err) {
      setError(err?.message || 'Failed to add faculty')
    }
  }

  return (
    <div>
      <h2>Faculty</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14, alignItems: 'start' }}>
        <section>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              style={{ width: 240, padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}
            >
              <option value="">Select Semester</option>
              {semesters.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="primary"
              onClick={() => refreshFaculty(semester)}
              disabled={loading || !semester}
            >
              {loading ? 'Loading...' : 'Load'}
            </button>
          </div>

          {error ? (
            <div
              style={{
                color: '#b91c1c',
                background: 'rgba(255,0,0,.08)',
                border: '1px solid rgba(255,0,0,.25)',
                padding: 10,
                borderRadius: 10,
              }}
            >
              {error}
            </div>
          ) : null}

          <div style={{ overflowX: 'auto', marginTop: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Faculty ID', 'Faculty Name', 'Email', 'Semester', 'Subject'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        borderBottom: '1px solid var(--border)',
                        padding: '10px 8px',
                        fontSize: 13,
                        opacity: 0.8,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {faculty.map((f, idx) => (
                  <tr key={`${f.facultyId}-${f.subject}-${idx}`}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{f.facultyId}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{f.facultyName}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{f.email}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{f.semester}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{f.subject}</td>
                  </tr>
                ))}

                {!loading && !faculty.length ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, opacity: 0.7 }}>
                      No faculty found for selected semester.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <aside style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 14, background: 'rgba(170,59,255,.03)' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 18 }}>Add Faculty (Append-only)</h3>

          <form onSubmit={onAppend} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input
                value={form.facultyId}
                onChange={(e) => setForm((p) => ({ ...p, facultyId: e.target.value }))}
                placeholder="Faculty ID (e.g., F005)"
                required
                style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}
              />
              <input
                value={form.facultyName}
                onChange={(e) => setForm((p) => ({ ...p, facultyName: e.target.value }))}
                placeholder="Faculty Name"
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

            <select
              value={form.semester}
              onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))}
              required
              style={{ width: '100%', padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}
            >
              <option value="">Select Semester</option>
              {semesters.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>

            <select
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              required
              disabled={!form.semester || subjectsLoading}
              style={{ width: '100%', padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}
            >
              <option value="">
                {!form.semester
                  ? 'Select semester first'
                  : subjectsLoading
                    ? 'Loading subjects...'
                    : 'Select Subject'}
              </option>
              {availableSubjects.map((sub) => {
                const code = sub['Subject Code'] || sub.subjectCode || ''
                const name = sub['Subject Name'] || sub.subjectName || ''
                return (
                  <option key={code || name} value={code || name}>
                    {code} {name ? `- ${name}` : ''}
                  </option>
                )
              })}
            </select>

            <button className="primary" type="submit">
              Append Faculty Record
            </button>

            <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 4 }}>
              Append-only behavior preserves old semesters in <b>Faculty</b> sheet.
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

