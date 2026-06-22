import { useContext, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { attendanceApi } from '../../services/googleSheets'

export default function FacultyAttendance() {
  const { session } = useContext(AuthContext)
  const [semester, setSemester] = useState('')
  const [section, setSection] = useState('')
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const sections = useMemo(() => {
    const s = new Set(students.map((x) => String(x.section || '').trim()).filter(Boolean))
    return [...s].sort()
  }, [students])

  useEffect(() => {
    if (session?.faculty?.semester) setSemester(String(session.faculty.semester))
  }, [session])

  useEffect(() => {
    if (!semester || !section || !session?.faculty?.facultyId) return
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await attendanceApi.loadForFaculty({
          semester,
          section,
          facultyId: session.faculty.facultyId,
          date,
        })
        setStudents(res?.students || [])
        setSubjects(res?.subjects || [])
      } catch (err) {
        setError(err?.message || 'Failed to load attendance data')
      } finally {
        setLoading(false)
      }
    })()
  }, [semester, section, date, session])

  const rows = useMemo(() => {
    return students.map((student) => ({
      rollNo: student.rollNo,
      studentName: student.studentName,
      status: 'Present',
    }))
  }, [students])

  const updateStatus = (rollNo, status) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.rollNo === rollNo
          ? { ...student, _status: status }
          : student
      )
    )
  }

  const onSave = async () => {
    if (!semester || !section || !subject || !date) {
      setError('Please select semester, section, subject, and date')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await attendanceApi.saveAttendanceForDay({
        date,
        semester,
        section,
        subject,
        rows: students.map((student) => ({
          rollNo: student.rollNo,
          studentName: student.studentName,
          status: student._status || 'Present',
        })),
      })
      setSuccess('Attendance saved successfully')
    } catch (err) {
      setError(err?.message || 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2>Attendance</h2>
      {error ? <div style={{ color: '#b91c1c', background: 'rgba(255,0,0,.08)', border: '1px solid rgba(255,0,0,.25)', padding: 10, borderRadius: 10 }}>{error}</div> : null}
      {success ? <div style={{ color: '#166534', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.35)', padding: 10, borderRadius: 10 }}>{success}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }} />
        <input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="Semester" style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }} />
        <select value={section} onChange={(e) => setSection(e.target.value)} style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}>
          <option value="">Select Section</option>
          {sections.map((sec) => <option key={sec} value={sec}>{sec}</option>)}
        </select>
        <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent' }}>
          <option value="">Select Subject</option>
          {subjects.map((s) => <option key={s.subjectCode || s.subjectName} value={s.subjectCode || s.subjectName}>{s.subjectCode || s.subjectName} - {s.subjectName || ''}</option>)}
        </select>
      </div>

      {loading ? <div style={{ opacity: 0.8 }}>Loading students…</div> : null}

      {!loading && students.length ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Roll No', 'Student Name', 'Present', 'Absent'].map((h) => <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '10px 8px' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.rollNo}>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{student.rollNo}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{student.studentName}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}><button type="button" onClick={() => updateStatus(student.rollNo, 'Present')} style={{ padding: '8px 10px', borderRadius: 10, background: student._status === 'Present' ? 'rgba(34,197,94,.15)' : 'transparent', border: '1px solid var(--border)', cursor: 'pointer' }}>Present</button></td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}><button type="button" onClick={() => updateStatus(student.rollNo, 'Absent')} style={{ padding: '8px 10px', borderRadius: 10, background: student._status === 'Absent' ? 'rgba(248,113,113,.15)' : 'transparent', border: '1px solid var(--border)', cursor: 'pointer' }}>Absent</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <button className="primary" onClick={onSave} disabled={saving || !students.length} style={{ marginTop: 12 }}>{saving ? 'Saving...' : 'Save Attendance'}</button>
      <style>{`.primary{margin-top:2px;padding:12px 14px;border-radius:12px;border:1px solid var(--accent-border);background:var(--accent-bg);color:var(--text-h);font-weight:600;cursor:pointer}.primary:disabled{opacity:.6;cursor:not-allowed}@media(max-width:900px){div[style*='grid-template-columns: repeat(4, minmax(180px, 1fr))']{grid-template-columns:1fr 1fr!important}}`}</style>
    </div>
  )
}

