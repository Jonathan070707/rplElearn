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
  const [searchTerm, setSearchTerm] = useState(''); // Add state for search term
  const [searchResult, setSearchResult] = useState([]); // Add state for search result
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
        setSearchResult(classResponse.data); // Show all classes initially

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

  const handleSearch = (searchTerm) => {
    const filteredClasses = classes.filter(cls => 
      new RegExp(searchTerm, 'i').test(cls.name) // Filter classes by search term using regex
    );
    setSearchResult(filteredClasses);
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
      <div className='text-center custom-gradient-login-bg text-white text-xl p-2 border-t-4 border-blue-500'>
        <div className=' text-3xl space-y-5'>
          <input className='border-gray-500 hover:bg-gray-200 rounded-lg text-black p-1 '
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearch(e.target.value); // Automatically apply search when typing
            }}
            placeholder="Cari kelas disini"
          />
        </div>      
      </div>
      <div className='space-y-3 text-2xl mx-8'>
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
        <h2 className='flex justify-center items-center bg-slate-800 rounded-xl p-2 text-zinc-300'>Daftar Kelas - Mata Pelajaran:</h2>
        <ul className='mx-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5'>
          {searchResult.map((cls) => (
            <li key={cls.id} className='bg-blue-500 rounded-lg p-3 text-gray-300 hover:bg-slate-800'>
              <div className='flex flex-col'>
                <span className='hover:text-sky-800 truncate-2-lines' style={{ cursor: 'pointer' }} onClick={() => handleClassClick(cls.id)}>{cls.name}</span>
                {/* Display enrollment code */}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <h2>Assignment Calendar</h2>
      <Calendar
        tileContent={tileContent}
      />
    </div>
  );
}

export default StudentDashboard;