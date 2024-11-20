import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar'; // Import Calendar component
import 'react-calendar/dist/Calendar.css'; // Import Calendar CSS
import './StudentDashboard.css'; // Import custom CSS

function StudentDashboard() {
  const [classes, setClasses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [username, setUsername] = useState('');
  const [calendarAssignments, setCalendarAssignments] = useState([]); // Add state for calendar assignments
  const [hoveredDate, setHoveredDate] = useState(null); // Add state for hovered date
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
      try {
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
        setCalendarAssignments(assignmentResponse.data.map(assignment => ({
          date: new Date(assignment.due_date),
          className: assignment.Class.name,
          assignmentName: assignment.title,
          assignmentId: assignment.id,
        }))); // Set calendar assignments

        const submissionResponse = await axios.get('/api/submissions/student/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmissions(submissionResponse.data);
      } catch (error) {
        console.error('Failed to fetch data', error);
      }
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

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const assignmentsForDate = calendarAssignments.filter(a => a.date.toDateString() === date.toDateString());
      if (assignmentsForDate.length > 0) {
        return (
          <div
            onMouseEnter={() => setHoveredDate(date)}
            onMouseLeave={() => setHoveredDate(null)}
          >
            <span role="img" aria-label="assignment">📅</span>
            {hoveredDate && hoveredDate.toDateString() === date.toDateString() && (
              <div className="popup">
                {assignmentsForDate.map(assignment => {
                  const isSubmitted = submissions.some(submission => submission.assignment_id === assignment.assignmentId);
                  return (
                    <div key={assignment.assignmentId} style={{ color: isSubmitted ? 'green' : 'red' }}>
                      {assignment.className}: {assignment.assignmentName}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }
    }
    return null;
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
      <h2>Assignment Calendar</h2>
      <Calendar
        tileContent={tileContent}
      />
    </div>
  );
}

export default StudentDashboard;