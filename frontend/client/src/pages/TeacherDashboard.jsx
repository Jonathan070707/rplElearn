import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns-tz';

function TeacherDashboard() {
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [newClassName, setNewClassName] = useState('');
  const [username, setUsername] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Add state for search term
  const [searchResult, setSearchResult] = useState([]); // Add state for search result
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Add state for success modal
  const [showFailureModal, setShowFailureModal] = useState(false); // Add state for failure modal
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
      setSearchResult(classResponse.data); // Show all classes initially

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
    if (newClassName.length > 21) {
      setShowFailureModal(true); // Show failure modal
      setTimeout(() => setShowFailureModal(false), 3000); // Hide after 3 seconds
      return;
    }
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
      setShowSuccessModal(true); // Show success modal
      setTimeout(() => setShowSuccessModal(false), 3000); // Hide after 3 seconds
    } catch (error) {
      console.error('Failed to create class', error);
      setShowFailureModal(true); // Show failure modal
      setTimeout(() => setShowFailureModal(false), 3000); // Hide after 3 seconds
    }
  };

  const handleClassClick = (classId) => {
    navigate(`/class/${classId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSearch = (searchTerm) => {
    const filteredClasses = classes.filter(cls => 
      new RegExp(searchTerm, 'i').test(cls.name) // Filter classes by search term using regex
    );
    setSearchResult(filteredClasses);
  };

  const handleCopyEnrollmentCode = (enrollmentCode) => {
    navigator.clipboard.writeText(enrollmentCode).then(() => {
    }).catch(err => {
      console.error('Failed to copy enrollment code', err);
    });
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
      <div className='flex justify-center items-center mt-4'>
          <div className='text-center text-white text-x '>
              <input className='border-gray-500 hover:bg-gray-200 rounded-lg text-black text-4xl p-1 text-center '
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
      <br className=''/>
        <div className='space-y-3 text-2xl mx-8'>
          <div className='flex justify-center items-center border-t-4 border-sky-800'>
            <form className='my-2 flex flex-col items-center' onSubmit={handleCreateClass}>
              <input className='hover:bg-gray-200 rounded-lg text-black text-3xl text-center p-1'
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder=" Buat kelas baru disini"
                required
              />
              <button className='mt-4 bg-blue-500 hover:bg-slate800 hover:text-sky-800 p-3 rounded-lg text-center text-white' type="submit">Buat kelas</button>      
              </form>
          </div>
        <ul className='mx-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5'>
          {searchResult.map((cls) => (
            <li key={cls.id} className='bg-blue-500 rounded-xl p-3 text-gray-300 hover:bg-slate-800 border-4 border-blue-600 hover:border-blue-600'>
              <div className='flex flex-col'>
                <span className='hover:text-sky-800 truncate-2-lines' style={{ cursor: 'pointer' }} onClick={() => handleClassClick(cls.id)}>{cls.name}</span>
                <span className='hover:text-sky-800' style={{ cursor: 'pointer' }} onClick={() => handleCopyEnrollmentCode(cls.enrollment_code)}>
                  Click untuk copy kode enrollment
                </span>
                {/* Display enrollment code */}
              </div>
            </li>
          ))}
        </ul>
        <ul className='mx-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5'>
          {lessons.map((lesson) => (
            <li key={lesson.id} className='bg-green-500 rounded-xl p-3 text-gray-300 hover:bg-slate-800 border-4 border-green-600 hover:border-green-600'>
              <div className='flex flex-col'>
                <span className='hover:text-sky-800 truncate-2-lines' style={{ cursor: 'pointer' }}>{lesson.title}</span>
                <span className='hover:text-sky-800' style={{ cursor: 'pointer' }}>{lesson.description}</span>
              </div>
            </li>
          ))}
        </ul>
        <ul className='mx-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5'>
          {assignments.map((assignment) => (
            <li key={assignment.id} className='bg-red-500 rounded-xl p-3 text-gray-300 hover:bg-slate-800 border-4 border-red-600 hover:border-red-600'>
              <div className='flex flex-col'>
                <span className='hover:text-sky-800 truncate-2-lines' style={{ cursor: 'pointer' }}>{assignment.title}</span>
                <span className='hover:text-sky-800' style={{ cursor: 'pointer' }}>{assignment.description}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {showSuccessModal && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center mb-4">
          <div className="bg-green-500 text-white p-4 rounded animate-slide-up rounded-xl text-2xl">
            Sukses
          </div>
        </div>
      )}
      {showFailureModal && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center mb-4">
          <div className="bg-red-500 text-white p-4 rounded animate-slide-up rounded-xl text-2xl">
            Gagal
          </div>
        </div>
      )}
      <style>
        {`
          @keyframes slide-up {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
          .animate-slide-up {
            animation: slide-up 0.5s ease-out;
          }
        `}
      </style>
    </div>
  );
}

export default TeacherDashboard;