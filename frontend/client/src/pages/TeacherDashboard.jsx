import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function TeacherDashboard() {
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [newClassName, setNewClassName] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyRole = async () => {
      const token = localStorage.getItem('token');
      console.log('Token:', token); // Add logging
      const userResponse = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('User role:', userResponse.data.role); // Add logging
      setUsername(userResponse.data.name); // Set the username
      if (userResponse.data.role !== 'teacher') {
        navigate('/login');
      }
    };

    verifyRole();

    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const classResponse = await axios.get('/api/classes/teacher/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(classResponse.data);

      const enrollmentResponse = await axios.get('/api/enrollments/teacher/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnrollments(enrollmentResponse.data);

      const lessonResponse = await axios.get('/api/lessons/teacher/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLessons(lessonResponse.data);

      const assignmentResponse = await axios.get('/api/assignments/teacher/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(assignmentResponse.data);

      const submissionResponse = await axios.get('/api/submissions/teacher/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmissions(submissionResponse.data);
    };

    fetchData();
  }, [navigate]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const userResponse = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teacherId = userResponse.data.id;
      const response = await axios.post('/api/classes', { name: newClassName, teacher_id: teacherId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses([...classes, response.data]);
      setNewClassName('');
    } catch (error) {
      console.error('Failed to create class', error);
    }
  };

  const handleClassClick = (classId) => {
    navigate(`/class/${classId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div>
      <h1>Teacher Dashboard</h1>
      <p>Welcome, {username}</p> {/* Display the username */}
      <button onClick={handleLogout}>Logout</button> {/* Add logout button */}
      <button onClick={() => navigate('/user-management')}>Manage Users</button> {/* Add button to redirect to user management page */}
      <h2>Classes</h2>
      <ul>
        {classes.map((cls) => (
          <li key={cls.id} onClick={() => handleClassClick(cls.id)} style={{ cursor: 'pointer' }}>
            {cls.name} - Enrollment Code: {cls.enrollment_code} {/* Display enrollment code */}
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreateClass}>
        <input
          type="text"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          placeholder="New Class Name"
          required
        />
        <button type="submit">Create Class</button>
      </form>
    </div>
  );
}

export default TeacherDashboard;