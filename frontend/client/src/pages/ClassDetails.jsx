import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function ClassDetails() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classDetails, setClassDetails] = useState({});
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [newLesson, setNewLesson] = useState({ title: '', description: '', content: '' });
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', due_date: '' });
  const [editingAssignment, setEditingAssignment] = useState({ title: '', description: '', due_date: '' }); // Separate state for editing assignment
  const [editingAssignmentId, setEditingAssignmentId] = useState(null); // Add state for editing assignment
  const [editingLesson, setEditingLesson] = useState({ title: '', description: '', content: '' }); // Separate state for editing lesson
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

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const userResponse = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teacherId = userResponse.data.id;
      const response = await axios.post(`/api/lessons/class/${classId}/lessons`, { ...newLesson, class_id: classId, teacher_id: teacherId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLessons([...lessons, response.data]);
      setNewLesson({ title: '', description: '', content: '' });
    } catch (error) {
      console.error('Failed to create lesson', error);
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
    } catch (error) {
      console.error('Failed to create assignment', error);
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
    } catch (error) {
      console.error('Failed to edit assignment', error);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/assignments/class/${classId}/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(assignments.filter(assignment => assignment.id !== assignmentId));
      alert('Assignment deleted successfully');
    } catch (error) {
      console.error('Failed to delete assignment', error);
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
      const response = await axios.put(`/api/lessons/class/${classId}/lessons/${lessonId}`, editingLesson, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLessons(lessons.map(lesson =>
        lesson.id === lessonId ? response.data : lesson
      ));
      setEditingLessonId(null);
      setEditingLesson({ title: '', description: '', content: '' });
    } catch (error) {
      console.error('Failed to edit lesson', error);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/lessons/class/${classId}/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLessons(lessons.filter(lesson => lesson.id !== lessonId));
      alert('Lesson deleted successfully');
    } catch (error) {
      console.error('Failed to delete lesson', error);
    }
  };

  const handleFileChange = (e, assignmentId) => {
    setSubmissionForms({ ...submissionForms, [assignmentId]: { ...submissionForms[assignmentId], file: e.target.files[0] } });
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
      alert('Assignment submitted successfully');
      // Update the state with the new submission
      setAssignments(assignments.map(assignment => 
        assignment.id === assignmentId 
          ? { ...assignment, submissions: [...assignment.submissions, response.data] } 
          : assignment
      ));
      setStudentSubmissions([...studentSubmissions, response.data]); // Update student submissions
    } catch (error) {
      if (error.response && error.response.data.error === 'You have already submitted this assignment') {
        alert('You have already submitted this assignment');
      } else {
        console.error('Failed to submit assignment', error);
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
      alert('Submission edited successfully');
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
      alert('Submission deleted successfully');
      // Update the state by removing the deleted submission
      setAssignments(assignments.map(assignment => 
        assignment.submissions.some(submission => submission.id === submissionId)
          ? { ...assignment, submissions: assignment.submissions.filter(submission => submission.id !== submissionId) }
          : assignment
       ));
      setStudentSubmissions(studentSubmissions.filter(submission => submission.id !== submissionId)); // Update student submissions
    } catch (error) {
      console.error('Failed to delete submission', error);
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
    } catch (error) {
      console.error('Failed to edit class name', error);
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
          alert('Class deleted successfully');
          navigate('/teacher-dashboard');
        } catch (error) {
          console.error('Failed to delete class', error);
        }
      }
    }
  };

  const handleDownloadFile = async (submissionId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/submissions/download/${submissionId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download file', error);
    }
  };

  return (
    <div>
      <h1>{classDetails.name}</h1>
      {userRole === 'teacher' && (
        <>
          {isEditingClass ? (
            <form onSubmit={handleEditClassNameSubmit}>
              <input
                type="text"
                value={editingClassName}
                onChange={(e) => setEditingClassName(e.target.value)}
                placeholder="Edit Class Name"
                required
              />
              <button type="submit">Save Changes</button>
              <button type="button" onClick={() => setIsEditingClass(false)}>Cancel Edit</button>
            </form>
          ) : (
            <>
              <button onClick={handleEditClassName}>Edit Class Name</button>
              <button onClick={handleDeleteClass}>Delete Class</button>
            </>
          )}
        </>
      )}
      <p>Welcome, {username}</p> {/* Display the username */}
      <h2>Lessons</h2>
      <ul>
        {lessons.map((lesson) => (
          <li key={lesson.id}>
            <h3>{lesson.title}</h3>
            <p>{lesson.description}</p>
            <p>{lesson.content}</p>
            {userRole === 'teacher' && (
              <>
                <button onClick={() => handleEditLesson(lesson)}>Edit Lesson</button>
                <button onClick={() => handleDeleteLesson(lesson.id)}>Delete Lesson</button>
                {editingLessonId === lesson.id && (
                  <form onSubmit={(e) => handleEditLessonSubmit(e, lesson.id)}>
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
                      required
                    />
                    <textarea
                      value={editingLesson.content}
                      onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
                      placeholder="Edit Lesson Content"
                      required
                    />
                    <button type="submit">Save Changes</button>
                    <button type="button" onClick={() => setEditingLessonId(null)}>Cancel Edit</button>
                  </form>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      {userRole === 'teacher' && (
        <form onSubmit={handleCreateLesson}>
          <input
            type="text"
            value={newLesson.title}
            onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
            placeholder="Lesson Title"
            required
          />
          <input
            type="text"
            value={newLesson.description}
            onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
            placeholder="Lesson Description"
            required
          />
          <textarea
            value={newLesson.content}
            onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
            placeholder="Lesson Content"
            required
          />
          <button type="submit">Create Lesson</button>
        </form>
      )}
      <h2>Assignments</h2>
      <ul>
        {assignments.map((assignment) => {
          const isPastDue = new Date(assignment.due_date) < new Date();
          return (
            <li key={assignment.id}>
              <h3>{assignment.title}</h3>
              <p>{assignment.description}</p>
              <p>Due Date: {new Date(assignment.due_date).toLocaleDateString()}</p>
              {isPastDue && <p style={{ color: 'red' }}>This assignment is past its due date.</p>}
              {userRole === 'student' && (
                <>
                  <button onClick={() => toggleSubmissionsVisibility(assignment.id)}>
                    {showSubmissions[assignment.id] ? 'Hide Submissions' : 'Show Submissions'}
                  </button>
                  {showSubmissions[assignment.id] && (
                    <>
                      {studentSubmissions.filter(submission => submission.assignment_id === assignment.id).length > 0 ? (
                        studentSubmissions.filter(submission => submission.assignment_id === assignment.id).map((submission) => (
                          <div key={submission.id}>
                            <p>Submission file: {submission.file_path ? (
                              <a href="#" onClick={() => handleDownloadFile(submission.id, submission.original_file_name)}>
                                {submission.original_file_name}
                              </a>
                            ) : null}</p>
                            <p>{submission.text_content}</p>
                            <p>Grade: {submission.student_grade}</p>
                            <button onClick={() => {
                              setEditingSubmissionId(submission.id);
                              setSubmissionForms({ ...submissionForms, [assignment.id]: { file: null, textContent: submission.text_content } });
                            }}>Edit</button>
                            <button onClick={() => handleDeleteSubmission(submission.id)}>Delete</button>
                            {editingSubmissionId === submission.id && (
                              <form onSubmit={(e) => handleEditSubmission(e, submission.id, assignment.id)}>
                                <input type="file" onChange={(e) => handleFileChange(e, assignment.id)} />
                                <textarea
                                  value={submissionForms[assignment.id]?.textContent || ''}
                                  onChange={(e) => handleTextChange(e, assignment.id)}
                                  placeholder="Or enter text content"
                                />
                                <button type="submit">Save Changes</button>
                                <button type="button" onClick={() => handleCancelEdit(assignment.id)}>Cancel Edit</button> {/* Add Cancel Edit button */}
                              </form>
                            )}
                          </div>
                        ))
                      ) : (
                        <form onSubmit={(e) => handleSubmitAssignment(e, assignment.id)}>
                          <input type="file" onChange={(e) => handleFileChange(e, assignment.id)} />
                          <textarea
                            value={submissionForms[assignment.id]?.textContent || ''}
                            onChange={(e) => handleTextChange(e, assignment.id)}
                            placeholder="Or enter text content"
                          />
                          <button type="submit">Submit Assignment</button>
                        </form>
                      )}
                    </>
                  )}
                </>
              )}
              {userRole === 'teacher' && (
                <>
                  <button onClick={() => handleShowSubmissions(assignment.id)}>
                    Show Submissions
                  </button>
                  <button onClick={() => handleEditAssignment(assignment)}>
                    Edit Assignment
                  </button>
                  <button onClick={() => handleDeleteAssignment(assignment.id)}>
                    Delete Assignment
                  </button>
                  {editingAssignmentId === assignment.id && (
                    <form onSubmit={(e) => handleEditAssignmentSubmit(e, assignment.id)}>
                      <input
                        type="text"
                        value={editingAssignment.title}
                        onChange={(e) => setEditingAssignment({ ...editingAssignment, title: e.target.value })}
                        placeholder="Edit Assignment Title" // Updated placeholder text
                      />
                      <input
                        type="text"
                        value={editingAssignment.description}
                        onChange={(e) => setEditingAssignment({ ...editingAssignment, description: e.target.value })}
                        placeholder="Edit Assignment Description" // Updated placeholder text
                      />
                      <input
                        type="date"
                        value={editingAssignment.due_date}
                        onChange={(e) => setEditingAssignment({ ...editingAssignment, due_date: e.target.value })}
                        placeholder="Edit Due Date" // Updated placeholder text
                      />
                      <button type="submit">Save Changes</button>
                      <button type="button" onClick={() => setEditingAssignmentId(null)}>Cancel Edit</button>
                    </form>
                  )}
                  {showSubmissions[assignment.id] && (
                    <ul>
                      {assignment.submissions.map((submission) => (
                        <li key={submission.id}>
                          <p>Student: {submission.Student.name}</p>
                          <p>Submission file: {submission.file_path ? (
                            <a href="#" onClick={() => handleDownloadFile(submission.id, submission.original_file_name)}>
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
              )}
            </li>
          );
        })}
      </ul>
      {userRole === 'teacher' && (
        <form onSubmit={handleCreateAssignment}>
          <input
            type="text"
            value={newAssignment.title}
            onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
            placeholder="New Assignment Title" // Updated placeholder text
            required
          />
          <input
            type="text"
            value={newAssignment.description}
            onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
            placeholder="New Assignment Description" // Updated placeholder text
            required
          />
          <input
            type="date"
            value={newAssignment.due_date}
            onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
            placeholder="New Due Date" // Updated placeholder text
            required
          />
          <button type="submit">Create Assignment</button>
        </form>
      )}
      {userRole === 'teacher' && (
        <button onClick={handleShowGrades}>Show Student Grades</button>
      )}
      {userRole === 'student' && (
        <button onClick={handleShowGrades}>View My Grades</button>
      )}
    </div>
  );
}

export default ClassDetails;