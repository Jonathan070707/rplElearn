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
  const [userRole, setUserRole] = useState('');
  const [file, setFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [editingSubmissionId, setEditingSubmissionId] = useState(null);
  const [grades, setGrades] = useState({}); // Use an object to store grades for each submission
  const [username, setUsername] = useState('');
  const [studentSubmissions, setStudentSubmissions] = useState([]); // Add state for student submissions

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

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleTextChange = (e) => {
    setTextContent(e.target.value);
  };

  const handleSubmitAssignment = async (e, assignmentId) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
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
      setFile(null);
      setTextContent('');
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

  const handleEditSubmission = async (e, submissionId) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
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
      setFile(null);
      setTextContent('');
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

  return (
    <div>
      <h1>{classDetails.name}</h1>
      <p>Welcome, {username}</p> {/* Display the username */}
      <h2>Lessons</h2>
      <ul>
        {lessons.map((lesson) => (
          <li key={lesson.id}>
            <h3>{lesson.title}</h3>
            <p>{lesson.description}</p>
            <p>{lesson.content}</p>
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
        {assignments.map((assignment) => (
          <li key={assignment.id}>
            <h3>{assignment.title}</h3>
            <p>{assignment.description}</p>
            <p>Due Date: {new Date(assignment.due_date).toLocaleDateString()}</p>
            {userRole === 'student' && (
              <>
                {studentSubmissions.filter(submission => submission.assignment_id === assignment.id).length > 0 ? (
                  studentSubmissions.filter(submission => submission.assignment_id === assignment.id).map((submission) => (
                    <div key={submission.id}>
                      <p>Submission: {submission.file_path ? submission.original_file_name : null}</p>
                      <p>{submission.text_content}</p>
                      <p>Grade: {submission.student_grade}</p>
                      <button onClick={() => setEditingSubmissionId(submission.id)}>Edit</button>
                      <button onClick={() => handleDeleteSubmission(submission.id)}>Delete</button>
                      {editingSubmissionId === submission.id && (
                        <form onSubmit={(e) => handleEditSubmission(e, submission.id)}>
                          <input type="file" onChange={handleFileChange} />
                          <textarea
                            value={textContent}
                            onChange={handleTextChange}
                            placeholder="Or enter text content"
                          />
                          <button type="submit">Save Changes</button>
                        </form>
                      )}
                    </div>
                  ))
                ) : (
                  <form onSubmit={(e) => handleSubmitAssignment(e, assignment.id)}>
                    <input type="file" onChange={handleFileChange} />
                    <textarea
                      value={textContent}
                      onChange={handleTextChange}
                      placeholder="Or enter text content"
                    />
                    <button type="submit">Submit Assignment</button>
                  </form>
                )}
              </>
            )}
            {userRole === 'teacher' && assignment.submissions.length > 0 && (
              assignment.submissions.map((submission) => (
                <div key={submission.id}>
                  <p>Submission: {submission.file_path ? submission.original_file_name : null}</p>
                  <p>{submission.text_content}</p>
                  <p>Grade 0-100: {submission.student_grade}</p>
                  <form onSubmit={(e) => handleGradeSubmission(e, submission.id)}>
                    <input
                      type="number"
                      value={grades[submission.id] || ''}
                      onChange={(e) => handleGradeChange(submission.id, e.target.value)}
                      placeholder="Enter Grade"
                      min="0"
                      max="100"
                      required
                    />
                    <button type="submit">Grade Submission</button>
                  </form>
                </div>
              ))
            )}
          </li>
        ))}
      </ul>
      {userRole === 'teacher' && (
        <form onSubmit={handleCreateAssignment}>
          <input
            type="text"
            value={newAssignment.title}
            onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
            placeholder="Assignment Title"
            required
          />
          <input
            type="text"
            value={newAssignment.description}
            onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
            placeholder="Assignment Description"
            required
          />
          <input
            type="date"
            value={newAssignment.due_date}
            onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
            placeholder="Due Date"
            required
          />
          <button type="submit">Create Assignment</button>
        </form>
      )}
    </div>
  );
}

export default ClassDetails;