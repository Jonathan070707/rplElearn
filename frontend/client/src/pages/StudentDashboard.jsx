import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar'; // Import Calendar component
import 'react-calendar/dist/Calendar.css'; // Import Calendar CSS
import './StudentDashboard.css'; // Import custom CSS
import { format } from 'date-fns-tz';

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

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const gmt8DueDate = format(new Date(newAssignment.due_date), 'yyyy-MM-dd HH:mm:ssXXX', { timeZone: 'Etc/GMT-8' });
      const response = await axios.post(`/api/assignments/class/${classId}/assignments`, { ...newAssignment, due_date: gmt8DueDate }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments([...assignments, response.data]);
      setNewAssignment({ title: '', description: '', due_date: '' });
    } catch (error) {
      console.error('Failed to create assignment', error);
    }
  };

  return (
    <div>
      <div className='flex justify-center items-center border-b-4 mx-4 pb-4 border-sky-800'>
        <div className='flex flex-col items-center '>
          <h2 className='mb-2 text-3xl bg-slate-800 p-2 text-zinc-300 flex-col border-4 border-blue-600 m-4 p-4 rounded-xl'>Kalender Tugas</h2>
          <div className='flex justify-center text-2xl'>
            <Calendar tileContent={tileContent} />
          </div>
        </div>
      </div>
      <div className='flex justify-center items-center mt-4'>
        <div className='text-center text-white text-x '>
          <input className='border-gray-500 hover:bg-gray-200 rounded-lg text-black text-4xl p-1 text-center '
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="Cari kelas disini"
          />
        </div>      
      </div>
      <br className=''/>
      <div className='space-y-3 text-2xl mx-8'>
        <div className='flex justify-center items-center border-t-4 border-sky-800'>
          <form className='my-2 flex flex-col items-center' onSubmit={handleEnroll}>
            <input className='hover:bg-gray-200 rounded-lg text-black text-3xl text-center p-1'
              type="text"
              value={enrollmentCode}
              onChange={(e) => setEnrollmentCode(e.target.value)}
              placeholder="Masukkan kode enrollment disini"
              required
            />
            <button className='mt-4 bg-blue-500 hover:bg-slate800 hover:text-sky-800 p-3 rounded-lg text-center text-white' type="submit">Enroll</button>      
          </form>
        </div>
        <ul className='mx-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5'>
          {searchResult.map((cls) => (
            <li key={cls.id} className='bg-blue-500 rounded-xl p-3 text-gray-300 hover:bg-slate-800 border-4 border-blue-600 hover:border-blue-600'>
              <div className='flex flex-col'>
                <span className='hover:text-sky-800 truncate-2-lines' style={{ cursor: 'pointer' }} onClick={() => handleClassClick(cls.id)}>{cls.name}</span>
                {/* Display enrollment code */}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default StudentDashboard;