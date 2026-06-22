import { useEffect, useMemo, useState } from 'react'
import { facultyApi, subjectsApi } from '../../services/googleSheets'

export default function AdminSubjects() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [subjects, setSubjects] = useState([])
  const [faculty, setFaculty] = useState([])
  const [query, setQuery] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [mode, setMode] = useState('add')
  const [form, setForm] = useState({
    subjectCode: '',
    subjectName: '',
    semester: '',
    facultyId: '',
  })
  const [assignForm, setAssignForm] = useState({ subjectCode: '', facultyId: '' })

  const semesters = useMemo(() => {
    const s = new Set(subjects.map((x) => String(x.semester || '').trim()).filter(Boolean))
    return [...s].sort()
  }, [subjects])

  const refreshSubjects = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await subjectsApi.list()
      setSubjects(res?.subjects || [])
    } catch (err) {
      setError(err?.message || 'Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  const refreshFaculty = async () => {
    try {
      const all = []
      for (const sem of semesters) {
        const res = await facultyApi.listBySemester(sem)
        all.push(...(res?.faculty || []))
      }
      setFaculty(all)
    } catch (err) {
      setError(err?.message || 'Failed to load faculty')
    }
  }

  useEffect(() => {
    ;(async () => {
      await refreshSubjects()
    })()
  }, [])

  useEffect(() => {
    if (semesters.length) {
      ;(async () => {
        await refreshFaculty()
      })()
    }
  }, [semesters])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return subjects.filter((s) => {
      const matchesQuery =
        !q ||
        String(s.subjectCode || '').toLowerCase().includes(q) ||
        String(s.subjectName || '').toLowerCase().includes(q)
      const matchesSemester = !semesterFilter || String(s.semester || '').trim() === semesterFilter
      return matchesQuery && matchesSemester
    })
  }, [subjects, query, semesterFilter])

  const startEdit = (sub) => {
    setMode('edit')
    setForm({
      subjectCode: String(sub.subjectCode || ''),
      subjectName: String(sub.subjectName || ''),
      semester: String(sub.semester || ''),
      facultyId: String(sub.facultyId || ''),
    })
  }

  const resetForm = () => {
    setMode('add')
    setForm({ subjectCode: '', subjectName: '', semester: '', facultyId: '' })
  }

  const onSave = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (mode === 'add') {
        await subjectsApi.add(form)
      } else {
        const { subjectCode, ...updates } = form
        await subjectsApi.update(subjectCode, updates)
      }
      resetForm()
      await refreshSubjects()
    } catch (err) {
      setError(err?.message || 'Failed to save subject')
    }
  }

  const onDelete = async (subjectCode) => {
    if (!window.confirm(`Delete subject ${subjectCode}?`)) return
    setError('')
    try {
      await subjectsApi.remove(subjectCode)
      await refreshSubjects()
    } catch (err) {
      setError(err?.message || 'Failed to delete subject')
    }
  }

  const onAssign = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await subjectsApi.assignFaculty(assignForm)
      await refreshSubjects()
    } catch (err) {
      setError(err?.message || 'Failed to assign faculty')
    }
  }

  return (
    <div>
      <h2>Subjects</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr', gap: 14, alignItems: 'start' }}>
        <section>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search subject code / name"
              style={{ flex: '1 1 260px', padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}
            />
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              style={{ width: 220, padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}
            >
              <option value="">All Semesters</option>
              {semesters.map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </select>
            <button type="button" className="primary" onClick={refreshSubjects} disabled={loading}>Refresh</button>
          </div>

          {error ? <div style={{ color: '#b91c1c', background: 'rgba(255,0,0,.08)', border: '1px solid rgba(255,0,0,.25)', padding: 10, borderRadius: 10 }}>{error}</div> : null}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Subject Code', 'Subject Name', 'Semester', 'Faculty ID'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '10px 8px', fontSize: 13, opacity: 0.8 }}>{h}</th>
                  ))}
                  <th style={{ borderBottom: '1px solid var(--border)', padding: '10px 8px', fontSize: 13, opacity: 0.8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => (
                  <tr key={sub.subjectCode}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{sub.subjectCode}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{sub.subjectName}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{sub.semester}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{sub.facultyId || '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>
                      <button type="button" onClick={() => startEdit(sub)} style={{ marginRight: 8, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>Edit</button>
                      <button type="button" onClick={() => onDelete(sub.subjectCode)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,0,0,.35)', background: 'rgba(255,0,0,.08)', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!filtered.length ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, opacity: 0.7 }}>No subjects found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 14, background: 'rgba(170,59,255,.03)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 18 }}>{mode === 'add' ? 'Add Subject' : 'Edit Subject'}</h3>
            <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input value={form.subjectCode} onChange={(e) => setForm((p) => ({ ...p, subjectCode: e.target.value }))} placeholder="Subject Code" required disabled={mode === 'edit'} style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }} />
              <input value={form.subjectName} onChange={(e) => setForm((p) => ({ ...p, subjectName: e.target.value }))} placeholder="Subject Name" required style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }} />
              <input value={form.semester} onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))} placeholder="Semester" required style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }} />
              <input value={form.facultyId} onChange={(e) => setForm((p) => ({ ...p, facultyId: e.target.value }))} placeholder="Faculty ID (optional)" style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="primary" type="submit" style={{ flex: 1 }}>{mode === 'add' ? 'Add Subject' : 'Update Subject'}</button>
                <button type="button" onClick={resetForm} style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 14, background: 'rgba(170,59,255,.03)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 18 }}>Assign Faculty</h3>
            <form onSubmit={onAssign} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select value={assignForm.subjectCode} onChange={(e) => setAssignForm((p) => ({ ...p, subjectCode: e.target.value }))} required style={{ width: '100%', padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}>
                <option value="">Select Subject</option>
                {subjects.map((sub) => <option key={sub.subjectCode} value={sub.subjectCode}>{sub.subjectCode} - {sub.subjectName}</option>)}
              </select>
              <select value={assignForm.facultyId} onChange={(e) => setAssignForm((p) => ({ ...p, facultyId: e.target.value }))} required style={{ width: '100%', padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}>
                <option value="">Select Faculty</option>
                {faculty.map((f) => <option key={`${f.facultyId}-${f.semester}`} value={f.facultyId}>{f.facultyId} - {f.facultyName}</option>)}
              </select>
              <button className="primary" type="submit">Assign Faculty</button>
            </form>
          </div>
        </aside>
      </div>

      <style>{`.primary{margin-top:2px;padding:12px 14px;border-radius:12px;border:1px solid var(--accent-border);background:var(--accent-bg);color:var(--text-h);font-weight:600;cursor:pointer}.primary:disabled{opacity:.6;cursor:not-allowed}@media(max-width:900px){div[style*='grid-template-columns: 1.3fr 0.9fr']{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}

