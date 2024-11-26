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
  const [searchTerm, setSearchTerm] = useState(''); // Add state for search term
  const [searchResult, setSearchResult] = useState([]); // Add state for search result
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
      alert('Class name cannot exceed 21 characters');
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
      {/* main */}
      <div className='space-y-3 text-2xl mx-8'>
        <div className='flex justify-center items-center'>
          <h1>Buat kelas disini: </h1>
          <form className='my-2 ' onSubmit={handleCreateClass}>
            <input className='hover:bg-gray-200 rounded-lg text-black'
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder=" Kelas - Mata Pelajaran"
              required
            />
            <button className='bg-blue-500 hover:bg-slate-800 hover:text-sky-800 p-2 rounded-lg ' type="submit">Buat kelas</button>      
            </form>
        </div>
        <h2 className='flex justify-center items-center bg-slate-800 rounded-xl p-2 text-zinc-300'>Daftar Kelas - Mata Pelajaran:</h2>
        <ul className='mx-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5'>
          {searchResult.map((cls) => (
            <li key={cls.id} className='bg-blue-500 rounded-lg p-3 text-gray-300 hover:bg-slate-800'>
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
      </div>
    </div>
  );
}

export default TeacherDashboard;