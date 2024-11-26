import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ClassDetails from './pages/ClassDetails';
import ViewSubmissions from './pages/ViewSubmissions';
import Grades from './pages/Grades'; // Import the Grades component
import UserManagement from './pages/UserManagement'; // Import the UserManagement component
import NavbarComponent from './components/navbarComponent';

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login';

  return (
    <>
      {!hideNavbar && <NavbarComponent />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/class/:classId" element={<ClassDetails />} />
        <Route path="/assignments/:assignmentId/submissions" element={<ViewSubmissions />} />
        <Route path="/class/:classId/assignments/:assignmentId/submissions" element={<ViewSubmissions />} />
        <Route path="/class/:classId/grades" element={<Grades />} /> {/* Add the Grades route */}
        <Route path="/user-management" element={<UserManagement />} /> {/* Add the UserManagement route */}
      </Routes>
    </>
  );
}

export default App;
