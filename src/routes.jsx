import { createBrowserRouter, RouterProvider } from 'react-router-dom';


import Login from './pages/Login/Login.jsx';
import AdminLayout from './pages/Admin/AdminLayout.jsx';
import AdminDashboard from './pages/Admin/Dashboard.jsx';
import AdminStudents from './pages/Admin/Students.jsx';
import AdminFaculty from './pages/Admin/Faculty.jsx';
import AdminSubjects from './pages/Admin/Subjects.jsx';
import AdminReports from './pages/Admin/Reports.jsx';

import FacultyLayout from './pages/Faculty/FacultyLayout.jsx';
import FacultyDashboard from './pages/Faculty/Dashboard.jsx';
import FacultyAttendance from './pages/Faculty/Attendance.jsx';
import FacultyReports from './pages/Faculty/Reports.jsx';

import StudentLayout from './pages/Student/StudentLayout.jsx';
import StudentDashboard from './pages/Student/Dashboard.jsx';
import StudentAttendanceHistory from './pages/Student/AttendanceHistory.jsx';

import { RequireRole } from './context/AuthContext.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/admin',
    element: (
      <RequireRole role="admin">
        <AdminLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'students', element: <AdminStudents /> },
      { path: 'faculty', element: <AdminFaculty /> },
      { path: 'subjects', element: <AdminSubjects /> },
      { path: 'reports', element: <AdminReports /> },
    ],
  },
  {
    path: '/faculty',
    element: (
      <RequireRole role="faculty">
        <FacultyLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <FacultyDashboard /> },
      { path: 'dashboard', element: <FacultyDashboard /> },
      { path: 'attendance', element: <FacultyAttendance /> },
      { path: 'reports', element: <FacultyReports /> },
    ],
  },
  {
    path: '/student',
    element: (
      <RequireRole role="student">
        <StudentLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <StudentDashboard /> },
      { path: 'dashboard', element: <StudentDashboard /> },
      { path: 'history', element: <StudentAttendanceHistory /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}

