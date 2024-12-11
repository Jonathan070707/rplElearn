import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function ClassDetails() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classDetails, setClassDetails] = useState({});
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [newLesson, setNewLesson] = useState({ title: '', description: '', content: '', file: null });
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', due_date: '' });
  const [editingAssignment, setEditingAssignment] = useState({ title: '', description: '', due_date: '' }); // Separate state for editing assignment
  const [editingAssignmentId, setEditingAssignmentId] = useState(null); // Add state for editing assignment
  const [editingLesson, setEditingLesson] = useState({ title: '', description: '', content: '', file: null }); // Separate state for editing lesson
  const [editingLessonId, setEditingLessonId] = useState(null); // Add state for editing lesson
  const [userRole, setUserRole] = useState('');
  const [file, setFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [editingSubmissionId, setEditingSubmissionId] = useState(null);
  const [grades, setGrades] = useState({}); // Use an object to store grades for each submission
  const [username, setUsername] = useState('');
  const [studentSubmissions, setStudentSubmissions] = useState([]); // Add state for student submissions
  const [showSubmissions, setShowSubmissions] = useState({}); // Add state to toggle submissions visibility for each assignment
  const [submissionForms, setSubmissionForms] = useState({}); // Add state to manage submission forms for each assignment
  const [editingClassName, setEditingClassName] = useState(''); // Add state for editing class name
  const [isEditingClass, setIsEditingClass] = useState(false); // Add state to toggle class name editing
  const [showCreateLesson, setShowCreateLesson] = useState(true); // Add state to toggle create lesson form
  const [showCreateAssignment, setShowCreateAssignment] = useState(false); // Add state to toggle create assignment form
  const [showModal, setShowModal] = useState(false); // Add state for modal visibility
  const [showLessons, setShowLessons] = useState(true); // Add state to toggle lessons visibility
  const [showAssignments, setShowAssignments] = useState(false); // Add state to toggle assignments visibility
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false); // Add state for edit assignment modal
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Add state for success modal
  const [showFailureModal, setShowFailureModal] = useState(false); // Add state for failure modal
  const [showEditLessonModal, setShowEditLessonModal] = useState(false); // Add state for edit lesson modal

  const handleToggleEditAssignmentModal = () => {
    setShowEditAssignmentModal(!showEditAssignmentModal);
  };

  const handleToggleEditLessonModal = () => {
    setShowEditLessonModal(!showEditLessonModal);
  };

  useEffect(() => {
    const verifyRole = async () => {
      const token = localStorage.getItem('token');
      const userResponse = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserRole(userResponse.data.role);
      setUsername(userResponse.data.name); // Set the username
      if (userResponse.data.role !== 'teacher' && userResponse.data.role !== 'student') {
        navigate('/login');
      }
    };

    verifyRole();
    
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      try {
        const classResponse = await axios.get(`/api/classes/${classId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Class details:', classResponse.data);
        setClassDetails(classResponse.data);

        const lessonResponse = await axios.get(`/api/lessons/class/${classId}/lessons`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLessons(lessonResponse.data);

        const assignmentResponse = await axios.get(`/api/assignments/class/${classId}/assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Assignments:', assignmentResponse.data);
        const assignmentsWithSubmissions = await Promise.all(
          assignmentResponse.data.map(async (assignment) => {
            const submissionResponse = await axios.get(`/api/submissions/${assignment.id}/submissions`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            return { ...assignment, submissions: submissionResponse.data };
          })
        );
        setAssignments(assignmentsWithSubmissions);

        if (userRole === 'student') {
          const studentSubmissionResponse = await axios.get('/api/submissions/student/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setStudentSubmissions(studentSubmissionResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
        if (error.response && error.response.status === 403) {
          console.error('Access forbidden');
        } else if (error.response && error.response.status === 404) {
          console.error('Class not found');
        } else {
          console.error('Failed to fetch data', error);
        }
      }
    };

    fetchData();
  }, [classId, navigate, userRole]);

  const handleFileChange = (e, id, type) => {
    const file = e.target.files[0];
    if (type === 'lesson') {
      if (id) {
        setEditingLesson({ ...editingLesson, file });
      } else {
        setNewLesson({ ...newLesson, file });
      }
    } else if (type === 'assignment') {
      setSubmissionForms({ ...submissionForms, [id]: { ...submissionForms[id], file } });
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', newLesson.title);
      if (newLesson.description) {
        formData.append('description', newLesson.description);
      }
      if (newLesson.content) {
        formData.append('content', newLesson.content);
      }
      if (newLesson.file) {
        formData.append('file', newLesson.file);
      }
      const userResponse = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teacherId = userResponse.data.id;
      const response = await axios.post(`/api/lessons/class/${classId}/lessons`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setLessons([...lessons, response.data]);
      setNewLesson({ title: '', description: '', content: '', file: null });
      document.getElementById('lessonFileInput').value = ''; // Reset file input
      setShowSuccessModal(true); // Show success modal
      setTimeout(() => setShowSuccessModal(false), 3000); // Hide after 3 seconds
    } catch (error) {
      console.error('Failed to create lesson', error);
      setShowFailureModal(true); // Show failure modal
      setTimeout(() => setShowFailureModal(false), 3000); // Hide after 3 seconds
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const userResponse = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teacherId = userResponse.data.id;
      const response = await axios.post(`/api/assignments/class/${classId}/assignments`, { ...newAssignment, class_id: classId, teacher_id: teacherId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments([...assignments, response.data]);
      setNewAssignment({ title: '', description: '', due_date: '' });
      setShowSuccessModal(true); // Show success modal
      setTimeout(() => setShowSuccessModal(false), 3000); // Hide after 3 seconds
    } catch (error) {
      console.error('Failed to create assignment', error);
      setShowFailureModal(true); // Show failure modal
      setTimeout(() => setShowFailureModal(false), 3000); // Hide after 3 seconds
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignmentId(assignment.id);
    setEditingAssignment({
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.due_date,
    });
  };

  const handleEditAssignmentSubmit = async (e, assignmentId) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/assignments/class/${classId}/assignments/${assignmentId}`, editingAssignment, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(assignments.map(assignment =>
        assignment.id === assignmentId ? response.data : assignment
      ));
      setEditingAssignmentId(null);
      setEditingAssignment({ title: '', description: '', due_date: '' });
      setShowEditAssignmentModal(false); // Close the modal
      setShowSuccessModal(true); // Show success modal
      setTimeout(() => setShowSuccessModal(false), 3000); // Hide after 3 seconds
    } catch (error) {
      console.error('Failed to edit assignment', error);
      setShowFailureModal(true); // Show failure modal
      setTimeout(() => setShowFailureModal(false), 3000); // Hide after 3 seconds
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/assignments/class/${classId}/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(assignments.filter(assignment => assignment.id !== assignmentId));
      setShowSuccessModal(true); // Show success modal
      setTimeout(() => setShowSuccessModal(false), 3000); // Hide after 3 seconds
    } catch (error) {
      console.error('Failed to delete assignment', error);
      setShowFailureModal(true); // Show failure modal
      setTimeout(() => setShowFailureModal(false), 3000); // Hide after 3 seconds
    }
  };

  const handleEditLesson = (lesson) => {
    setEditingLessonId(lesson.id);
    setEditingLesson({
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
    });
  };

  const handleEditLessonSubmit = async (e, lessonId) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', editingLesson.title);
      if (editingLesson.description) {
        formData.append('description', editingLesson.description);
      }
      if (editingLesson.content) {
        formData.append('content', editingLesson.content);
      }
      if (editingLesson.file) {
        formData.append('file', editingLesson.file);
      }
      const response = await axios.put(`/api/lessons/class/${classId}/lessons/${lessonId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setLessons(lessons.map(lesson =>
        lesson.id === lessonId ? response.data : lesson
      ));
      setEditingLessonId(null);
      setEditingLesson({ title: '', description: '', content: '', file: null });
      setShowEditLessonModal(false); // Close the modal
      setShowSuccessModal(true); // Show success modal
      setTimeout(() => setShowSuccessModal(false), 3000); // Hide after 3 seconds
    } catch (error) {
      console.error('Failed to edit lesson', error);
      setShowFailureModal(true); // Show failure modal
      setTimeout(() => setShowFailureModal(false), 3000); // Hide after 3 seconds
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/lessons/class/${classId}/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLessons(lessons.filter(lesson => lesson.id !== lessonId));
      setShowSuccessModal(true); // Show success modal
      setTimeout(() => setShowSuccessModal(false), 3000); // Hide after 3 seconds
    } catch (error) {
      console.error('Failed to delete lesson', error);
      setShowFailureModal(true); // Show failure modal
      setTimeout(() => setShowFailureModal(false), 3000); // Hide after 3 seconds
    }
  };

  const handleTextChange = (e, assignmentId) => {
    setSubmissionForms({ ...submissionForms, [assignmentId]: { ...submissionForms[assignmentId], textContent: e.target.value } });
  };

  const handleSubmitAssignment = async (e, assignmentId) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      const { file, textContent } = submissionForms[assignmentId] || {};
      if (file) {
        const allowedFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedFileTypes.includes(file.type)) {
          alert('Unsupported file type. Please upload a PDF or DOC/DOCX file.');
          return;
        }
        formData.append('file', file);
      }
      if (textContent) {
        formData.append('text', textContent);
      }
      if (!file && !textContent) {
        alert('Please provide a file or text content');
        return;
      }
      const response = await axios.post(`/api/submissions/${assignmentId}/submit`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setSubmissionForms({ ...submissionForms, [assignmentId]: { file: null, textContent: '' } });
      setShowSuccessModal(true); // Show success modal
      setTimeout(() => setShowSuccessModal(false), 3000); // Hide after 3 seconds
      // Update the state with the new submission
      setAssignments(assignments.map(assignment => 
        assignment.id === assignmentId 
          ? { ...assignment, submissions: [...assignment.submissions, response.data] } 
          : assignment
      ));
      setStudentSubmissions([...studentSubmissions, response.data]); // Update student submissions
      window.location.reload(); // Refresh the page
    } catch (error) {
      if (error.response && error.response.data.error === 'You have already submitted this assignment') {
        alert('You have already submitted this assignment');
      } else {
        console.error('Failed to submit assignment', error);
        setShowFailureModal(true); // Show failure modal
        setTimeout(() => setShowFailureModal(false), 3000); // Hide after 3 seconds
      }
    }
  };

  const handleEditSubmission = async (e, submissionId, assignmentId) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      const { file, textContent } = submissionForms[assignmentId] || {};
      if (file) {
        const allowedFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedFileTypes.includes(file.type)) {
          alert('Unsupported file type. Please upload a PDF or DOC/DOCX file.');
          return;
        }
        formData.append('file', file);
      }
      if (textContent) {
        formData.append('text', textContent);
      }
      if (!file && !textContent) {
        alert('Please provide a file or text content');
        return;
      }
      const response = await axios.put(`/api/submissions/${submissionId}/edit`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setSubmissionForms({ ...submissionForms, [assignmentId]: { file: null, textContent: '' } });
      setEditingSubmissionId(null);
      setShowSuccessModal(true); // Show success modal
      setTimeout(() => setShowSuccessModal(false), 3000); // Hide after 3 seconds
      // Update the state with the edited submission
      setAssignments(assignments.map(assignment => 
        assignment.submissions.some(submission => submission.id === submissionId)
          ? { ...assignment, submissions: assignment.submissions.map(submission => 
              submission.id === submissionId ? response.data : submission
            ) }
          : assignment
       ));
      setStudentSubmissions(studentSubmissions.map(submission => 
        submission.id === submissionId ? response.data : submission
      )); // Update student submissions
    } catch (error) {
      console.error('Failed to edit submission', error);
      setShowFailureModal(true); // Show failure modal
      setTimeout(() => setShowFailureModal(false), 3000); // Hide after 3 seconds
    }
  };

  const handleCancelEdit = (assignmentId) => {
    setEditingSubmissionId(null);
    setSubmissionForms({ ...submissionForms, [assignmentId]: { file: null, textContent: '' } });
  };

  const handleDeleteSubmission = async (submissionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/submissions/${submissionId}/delete`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowSuccessModal(true); // Show success modal
      setTimeout(() => setShowSuccessModal(false), 3000); // Hide after 3 seconds
      // Update the state by removing the deleted submission
      setAssignments(assignments.map(assignment => 
        assignment.submissions.some(submission => submission.id === submissionId)
          ? { ...assignment, submissions: assignment.submissions.filter(submission => submission.id !== submissionId) }
          : assignment
       ));
      setStudentSubmissions(studentSubmissions.filter(submission => submission.id !== submissionId)); // Update student submissions
    } catch (error) {
      console.error('Failed to delete submission', error);
      setShowFailureModal(true); // Show failure modal
      setTimeout(() => setShowFailureModal(false), 3000); // Hide after 3 seconds
    }
  };

  const handleGradeChange = (submissionId, grade) => {
    const numericGrade = Math.max(0, Math.min(100, Number(grade))); // Ensure grade is between 0 and 100
    setGrades({ ...grades, [submissionId]: numericGrade });
  };

  const handleGradeSubmission = async (e, submissionId) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/submissions/${submissionId}/grade`, { grade : grades[submissionId] }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(assignments.map(assignment =>
        assignment.submissions.some(submission => submission.id === submissionId)
          ? { ...assignment, submissions: assignment.submissions.map(submission =>
              submission.id === submissionId ? response.data : submission
            ) }
          : assignment
      ));
    } catch (error) {
      console.error('Failed to grade submission', error);
    }
  };

  const handleShowSubmissions = (assignmentId) => {
    navigate(`/class/${classId}/assignments/${assignmentId}/submissions`);
  };

  const toggleSubmissionsVisibility = (assignmentId) => {
    setShowSubmissions({ ...showSubmissions, [assignmentId]: !showSubmissions[assignmentId] });
  };

  const handleShowGrades = () => {
    navigate(`/class/${classId}/grades`);
  };

  const handleEditClassName = () => {
    setIsEditingClass(true);
    setEditingClassName(classDetails.name);
  };

  const handleEditClassNameSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/classes/${classId}`, { name: editingClassName }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClassDetails({ ...classDetails, name: response.data.name });
      setIsEditingClass(false);
      setShowSuccessModal(true); // Show success modal
      setTimeout(() => setShowSuccessModal(false), 3000); // Hide after 3 seconds
    } catch (error) {
      console.error('Failed to edit class name', error);
      setShowFailureModal(true); // Show failure modal
      setTimeout(() => setShowFailureModal(false), 3000); // Hide after 3 seconds
    }
  };

  const handleDeleteClass = async () => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      if (window.confirm('This is your last warning. Are you absolutely sure you want to delete this class?')) {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`/api/classes/${classId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          navigate('/teacher-dashboard');
          setShowSuccessModal(true); // Show success modal
          setTimeout(() => setShowSuccessModal(false), 3000); // Hide after 3 seconds
        } catch (error) {
          console.error('Failed to delete class', error);
          setShowFailureModal(true); // Show failure modal
          setTimeout(() => setShowFailureModal(false), 3000); // Hide after 3 seconds
        }
      }
    }
  };

  const handleDownloadFile = async (id, fileName, type) => {
    try {
      const token = localStorage.getItem('token');
      const url = type === 'lesson' ? `/api/lessons/download/${id}` : `/api/submissions/download/${id}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download file', error);
      if (error.response && error.response.data) {
        alert(`Failed to download file: ${error.response.data.error}`);
      } else {
        alert('Failed to download file');
      }
    }
  };

  const hasSubmitted = (assignmentId) => {
    return studentSubmissions.some(submission => submission.assignment_id === assignmentId);
  };

  const handleToggleModal = () => {
    setShowModal(!showModal);
  };

  // halaman
  return (
    <div>
      {/* tentang kelas */}
      <div className='bg-clasname-header p-2 text-zinc-300 flex-col border-t-4 border-blue-600 p-3 text-center rounded-xl m-1'>
        <h1 className=' text-center text-3xl '>{classDetails.name}</h1>
        {userRole === 'student' && (
          <button className='hover:text-sky-800 mt-2 text-2xl' onClick={handleShowGrades}>Lihat nilai saya</button>
        )}
        <div className='text-xl'>
          {userRole === 'teacher' && (
            <>
              {isEditingClass ? (
                <form onSubmit={handleEditClassNameSubmit}>
                  <input className='text-black'
                    type="text"
                    value={editingClassName}
                    onChange={(e) => setEditingClassName(e.target.value)}
                    placeholder="Ubah nama kelas"
                    required
                  />
                  <br />
                  <button className='hover:text-sky-800 mr-7' type="submit">Simpan</button>
                  <button className='hover:text-sky-800' type="button" onClick={() => setIsEditingClass(false)}>Batal</button>
                </form>
              ) : (
                <>
                  <button className='hover:text-sky-800' onClick={handleEditClassName}>Ubah nama kelas</button>
                  <br />
                  <button className='hover:text-sky-800' onClick={handleDeleteClass}>Hapus kelas</button>
                  <br />
                  {userRole === 'teacher' && (
                    <button className='hover:text-sky-800' onClick={handleShowGrades}>Lihat nilai murid-murid</button>
                  )}
                  {userRole === 'student' && (
                    <button className='hover:text-sky-800' onClick={handleShowGrades}>Lihat nilai saya</button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>  
      <br />
      
      {/* buat materi dan tugas */}

      <div className='flex justify-center items-center text-3xl mb-4'>
        {userRole === 'teacher' && (
          <button onClick={handleToggleModal} className="bg-clasname-header text-zinc-300 p-2 rounded-xl" type="button">
            Buat materi dan tugas
          </button>
        )}
      </div>

      {showModal && (
        <div id="buat-materi-tugas-modal" tabIndex="-1" aria-hidden="true" className='fixed inset-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50'>
          <div className="relative p-4 w-full max-w-2xl max-h-full">
            <div className='relative bg-white rounded-lg shadow bg-clasname-header rounded-xl p-3'>
              {userRole === 'teacher' && (
                <>
                  <div className='text-center text-2xl relative'>
                    <button className={`mx-5 p-2 ${showCreateLesson ? 'text-sky-800' : 'text-zinc-300'} bg-slate-800 hover:text-sky-800 rounded-xl`} onClick={() => { setShowCreateLesson(true); setShowCreateAssignment(false); }}>
                      Buat materi
                    </button>
                    <button className={`mx-5 p-2 ${showCreateAssignment ? 'text-sky-800' : 'text-zinc-300'} bg-slate-800 hover:text-sky-800 rounded-xl`} onClick={() => { setShowCreateAssignment(true); setShowCreateLesson(false); }}>
                      Buat tugas
                    </button>
                  </div>
                  {showCreateLesson && (
                    <form className='text-center space-y-4 text-xl p-3' onSubmit={handleCreateLesson}>
                      <input id='buat-kelas' className='bg-gray-200 rounded-lg w-full p-2' 
                        type="text"
                        value={newLesson.title}
                        onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                        placeholder="Lesson Title"
                        required
                      /> <br />
                      <input className='bg-gray-200 rounded-lg w-full p-2'
                        type="text"
                        value={newLesson.description}
                        onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                        placeholder="Lesson Description"
                      /> <br />
                      <textarea className='bg-gray-200 rounded-lg w-full p-2'
                        value={newLesson.content}
                        onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                        placeholder="Lesson Content"
                      /> <br />
                      <input className='text-zinc-300' type="file" id="lessonFileInput" onChange={(e) => handleFileChange(e, null, 'lesson')} /> <br />
                      <button className='text-zinc-300 bg-slate-800 hover:text-sky-800 hover:bg-custom-gradient-login-bg w-full p-2 rounded-lg' type="submit">Create Lesson</button>
                    </form>
                  )}
                  {showCreateAssignment && (
                    <form className='text-center space-y-4 text-xl p-3' onSubmit={handleCreateAssignment}>
                      <input className='bg-gray-200 rounded-lg w-full p-2'
                        type="text"
                        value={newAssignment.title}
                        onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                        placeholder="New Assignment Title"
                        required
                      /> <br />
                      <input className='bg-gray-200 rounded-lg w-full p-2'
                        type="text"
                        value={newAssignment.description}
                        onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                        placeholder="New Assignment Description"
                        required
                      /> <br />
                      <input className='bg-gray-200 rounded-lg w-full p-2'
                        type="date"
                        value={newAssignment.due_date}
                        onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                        placeholder="New Due Date"
                        required
                      /> <br />
                      <button className='bg-slate-800 text-zinc-300 hover:text-sky-800 hover:bg-custom-gradient-login-bg w-full p-2 rounded-lg' type="submit">Create Assignment</button>
                    </form>
                  )}
                  <button onClick={handleToggleModal} className='mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full'>
                    Cancel
                  </button>
                </>
              )}
  
          </div>
          </div>
        </div>
      )}

      {/* Add buttons to toggle lessons and assignments */}
      <div className='flex justify-center items-center border-t-4 mx-5 p-4 text-3xl'>
        <button 
          onClick={() => { setShowLessons(true); setShowAssignments(false); }} 
          className={`bg-clasname-header p-2 rounded-xl ${showLessons ? 'text-sky-800' : 'text-zinc-300'}`} 
          type="button"
        >
          Lihat materi
        </button>
        <button 
          onClick={() => { setShowLessons(false); setShowAssignments(true); }} 
          className={`bg-clasname-header p-2 rounded-xl ml-4 ${showAssignments ? 'text-sky-800' : 'text-zinc-300'}`} 
          type="button"
        >
          Lihat tugas
        </button>
      </div>

      {/* list materi dan tugas */}
      {showLessons && (
        <ul className='mx-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5'>
          {lessons.map((lesson) => (
            <li key={lesson.id} className='border shadow border-gray-500 rounded-xl m-4 max-h-64 overflow-y-auto'>
              <div className='p-2'>
                <h3 className='m-2 break-words text-2xl border-b-2 p-1 border-sky-800'>{lesson.title}</h3>
                <p className='m-2 break-words text-xl'>{lesson.description}</p>
                <p className='m-2 break-words'>{lesson.content}</p>
                {lesson.file_path && (
                  <p className='text-sky-800 m-2 break-words'>
                    <a href="#" onClick={() => handleDownloadFile(lesson.id, lesson.original_file_name, 'lesson')}>
                      {lesson.original_file_name}
                    </a>
                  </p>
                )}
                {userRole === 'teacher' && (
                  <>
                    <button className='m-2 bg-gray-300 p-2 rounded-xl hover:text-sky-800' onClick={() => { handleEditLesson(lesson); handleToggleEditLessonModal(); }}>Edit</button>
                    <button className='m-2 bg-gray-300 p-2 rounded-xl hover:text-sky-800' onClick={() => handleDeleteLesson(lesson.id)}>Delete</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className='text-center mx-4 text-2xl '>
      {showAssignments && (
        <ul className='mx-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5'>
          {assignments.map((assignment) => {
            const isPastDue = new Date(assignment.due_date) < new Date();
            return (
              <li key={assignment.id} className='border border-gray-500 shadow rounded-xl m-4 max-h-64 overflow-y-auto p-2 space-y-2'>
                <h3 className='border-b-4  p-2 rounded-xl' >{assignment.title}</h3>
                <p>{assignment.description}</p>
                <p >Due Date: {new Date(assignment.due_date).toLocaleDateString()}</p>
                {isPastDue && <p style={{ color: 'red' }}>Telah lewat batas waktu.</p>
                }
                <div className='border-sky-900 border-y-4 rounded-xl'>
                {userRole === 'student' && (
                  <>                
                    <button className='m-2 bg-gray-300 p-2 rounded-xl hover:text-sky-800' onClick={() => toggleSubmissionsVisibility(assignment.id)}>
                      {showSubmissions[assignment.id] ? 'Hide Submissions' : hasSubmitted(assignment.id) ? 'Show Submissions' : 'Make a Submission'}
                    </button>
                    {showSubmissions[assignment.id] && (
                      <>
                        {studentSubmissions.filter(submission => submission.assignment_id === assignment.id).length > 0 ? (
                          studentSubmissions.filter(submission => submission.assignment_id === assignment.id).map((submission) => (
                            <div key={submission.id}>
                              <p className='m-2'>Submission file (pdf, docs, docx): {submission.file_path ? (
                                <a className='text-sky-800' href="#" onClick={() => handleDownloadFile(submission.id, submission.original_file_name, 'submission')}>
                                  {submission.original_file_name}
                                </a>
                              ) : null}</p>
                              <p>{submission.text_content}</p>
                              <p className='m-2' >Grade: {submission.student_grade}</p>
                              <button className='m-2 bg-gray-300 p-2 rounded-xl hover:text-sky-800' onClick={() => {
                                setEditingSubmissionId(submission.id);
                                setSubmissionForms({ ...submissionForms, [assignment.id]: { file: null, textContent: submission.text_content } });
                              }}>Edit</button>
                              <button className='m-2 bg-gray-300 p-2 rounded-xl hover:text-sky-800' onClick={() => handleDeleteSubmission(submission.id)}>
                                Delete
                              </button>
                              {editingSubmissionId === submission.id && (
                                <form onSubmit={(e) => handleEditSubmission(e, submission.id, assignment.id)}>
                                  <input type="file" onChange={(e) => handleFileChange(e, assignment.id, 'assignment')} />
                                  <textarea className='m-2 bg-gray-300 p-2 rounded-xl hover:text-sky-800'
                                    value={submissionForms[assignment.id]?.textContent || ''}
                                    onChange={(e) => handleTextChange(e, assignment.id)}
                                    placeholder="Text"
                                  />
                                  <button className='m-2 bg-gray-300 p-2 rounded-xl hover:text-sky-800' type="submit">Save Changes</button>
                                  <button className='m-2 bg-gray-300 p-2 rounded-xl hover:text-sky-800' type="button" onClick={() => handleCancelEdit(assignment.id)}>Cancel Edit</button> {/* Add Cancel Edit button */}
                                </form>
                              )}
                            </div>
                          ))
                        ) : (
                          <form onSubmit={(e) => handleSubmitAssignment(e, assignment.id)}>
                            <input type="file" onChange={(e) => handleFileChange(e, assignment.id, 'assignment')} />
                            <textarea className='text-center border-2 border-gray rounded-xl'
                              value={submissionForms[assignment.id]?.textContent || ''}
                              onChange={(e) => handleTextChange(e, assignment.id)}
                              placeholder="Text"
                            />
                            <button className='m-2 bg-gray-300 p-2 rounded-xl hover:text-sky-800' type="submit">Submit Assignment</button>
                          </form>
                        )}
                      </>
                    )}
                  </>
                )}
                {userRole === 'teacher' && (
                  <>
                    <button className='m-1 bg-stone-200 p-2 rounded-xl hover:text-sky-800' onClick={() => handleShowSubmissions(assignment.id)}>
                      Show Submissions
                    </button>
                    <button className='m-1 bg-stone-200 p-2 rounded-xl hover:text-sky-800' onClick={() => { handleEditAssignment(assignment); handleToggleEditAssignmentModal(); }}>
                      Edit Assignment
                    </button>
                    <button className='m-1 bg-stone-200 p-2 rounded-xl hover:text-sky-800' onClick={() => handleDeleteAssignment(assignment.id)}>
                      Delete Assignment
                    </button>
                    {showEditAssignmentModal && (
                      <div id="edit-assignment-modal" tabIndex="-1" aria-hidden="true" className='fixed inset-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50'>
                        <div className="relative p-4 w-full max-w-2xl max-h-full">
                          <div className='relative bg-white rounded-lg shadow bg-clasname-header rounded-xl p-3'>
                            <form className='text-center space-y-4 text-xl p-3' onSubmit={(e) => handleEditAssignmentSubmit(e, editingAssignmentId)}>
                              <input
                                type="text"
                                value={editingAssignment.title}
                                onChange={(e) => setEditingAssignment({ ...editingAssignment, title: e.target.value })}
                                placeholder="Edit Assignment Title"
                                required
                              />
                              <input
                                type="text"
                                value={editingAssignment.description}
                                onChange={(e) => setEditingAssignment({ ...editingAssignment, description: e.target.value })}
                                placeholder="Edit Assignment Description"
                                required
                              />
                              <input
                                type="date"
                                value={editingAssignment.due_date}
                                onChange={(e) => setEditingAssignment({ ...editingAssignment, due_date: e.target.value })}
                                placeholder="Edit Due Date"
                                required
                              />
                              <button className='bg-slate-800 text-zinc-300 hover:text-sky-800 hover:bg-custom-gradient-login-bg w-full p-2 rounded-lg' type="submit">Save Changes</button>
                              <button className='mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full' type="button" onClick={handleToggleEditAssignmentModal}>Cancel</button>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}
                    {showSubmissions[assignment.id] && (
                      <ul>
                        {assignment.submissions.map((submission) => (
                          <li key={submission.id}>
                            <p>Student: {submission.Student.name}</p>
                            <p>Submission file (pdf, docs, docx): {submission.file_path ? (
                              <a href="#" onClick={() => handleDownloadFile(submission.id, submission.original_file_name, 'submission')}>
                                {submission.original_file_name}
                              </a>
                            ) : 'No file'}</p>
                            <p>{submission.text_content}</p>
                            <p>Grade: {submission.student_grade}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )} </div>
              </li>
            );
          })}
        </ul>
      )}
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
      {showEditLessonModal && (
        <div id="edit-lesson-modal" tabIndex="-1" aria-hidden="true" className='fixed inset-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50'>
          <div className="relative p-4 w-full max-w-2xl max-h-full">
            <div className='relative bg-white rounded-lg shadow bg-clasname-header rounded-xl p-3'>
              <form className='text-center space-y-4 text-xl p-3' onSubmit={(e) => handleEditLessonSubmit(e, editingLessonId)}>
                <input
                  type="text"
                  value={editingLesson.title}
                  onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                  placeholder="Edit Lesson Title"
                  required
                />
                <input
                  type="text"
                  value={editingLesson.description}
                  onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                  placeholder="Edit Lesson Description"
                />
                <textarea
                  value={editingLesson.content}
                  onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
                  placeholder="Edit Lesson Content"
                />
                <input type="file" onChange={(e) => handleFileChange(e, editingLessonId, 'lesson')} />
                <button className='bg-slate-800 text-zinc-300 hover:text-sky-800 hover:bg-custom-gradient-login-bg w-full p-2 rounded-lg' type="submit">Save Changes</button>
                <button className='mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full' type="button" onClick={handleToggleEditLessonModal}>Cancel</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassDetails;