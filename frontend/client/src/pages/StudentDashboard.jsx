import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function StudentDashboard() {
  const [classes, setClasses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyRole = async () => {
      const token = localStorage.getItem('token');
      const userResponse = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsername(userResponse.data.name); // Set the username
      if (userResponse.data.role !== 'student') {
        navigate('/login');
      }
    };

    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const classResponse = await axios.get('/api/classes/student/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(classResponse.data);

      const lessonResponse = await axios.get('/api/lessons/student/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLessons(lessonResponse.data);

      const assignmentResponse = await axios.get('/api/assignments/student/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(assignmentResponse.data);

      const submissionResponse = await axios.get('/api/submissions/student/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmissions(submissionResponse.data);
    };

    verifyRole();
    fetchData();
  }, [navigate]);

  const handleEnroll = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/enrollments', { enrollment_code: enrollmentCode }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnrollmentCode('');
      // Refresh classes after enrollment
      const classResponse = await axios.get('/api/classes/student/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(classResponse.data);
    } catch (error) {
      console.error('Failed to enroll in class', error);
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
      <h1>Student Dashboard</h1>
      <p>Welcome, {username}</p> {/* Display the username */}
      <button onClick={handleLogout}>Logout</button> {/* Add logout button */}
      <h2>Classes</h2>
      <ul>
        {classes.map((cls) => (
          <li key={cls.id} onClick={() => handleClassClick(cls.id)} style={{ cursor: 'pointer' }}>
            {cls.name}
          </li>
        ))}
      </ul>
      <form onSubmit={handleEnroll}>
        <input
          type="text"
          value={enrollmentCode}
          onChange={(e) => setEnrollmentCode(e.target.value)}
          placeholder="Class Enrollment Code"
          required
        />
        <button type="submit">Enroll</button>
      </form>
      <h2>Lessons</h2>
      <ul>
        {lessons.map((lesson) => (
          <li key={lesson.id}>{lesson.title}</li>
        ))}
      </ul>
      <h2>Assignments</h2>
      <ul>
        {assignments.map((assignment) => (
          <li key={assignment.id}>{assignment.title}</li>
        ))}
      </ul>
      <h2>Submissions</h2>
      <ul>
        {submissions.map((submission) => (
          <li key={submission.id}>
            {submission.assignment.title} - {submission.grade}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StudentDashboard;