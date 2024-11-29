import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function ViewSubmissions() {
  const { assignmentId, classId } = useParams(); // Combine useParams calls
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState({}); // Use an object to store grades for each submission
  const [assignmentTitle, setAssignmentTitle] = useState(''); // Add state for assignment title
  const [userRole, setUserRole] = useState(''); // Add state for user role

  useEffect(() => {
    console.log('classId:', classId); // Add logging
    console.log('assignmentId:', assignmentId); // Add logging

    const fetchSubmissions = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`/api/submissions/${assignmentId}/submissions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmissions(response.data);
      } catch (error) {
        console.error('Failed to fetch submissions', error);
      }
    };

    const fetchAssignmentTitle = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`/api/assignments/class/${classId}/assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data && Array.isArray(response.data)) {
          const assignment = response.data.find(a => a.id === parseInt(assignmentId, 10));
          if (assignment) {
            setAssignmentTitle(assignment.title);
          } else {
            console.error('Assignment not found');
          }
        } else {
          console.error('Invalid response data');
        }
      } catch (error) {
        console.error('Failed to fetch assignment title', error);
      }
    };

    const fetchUserRole = async () => {
      const token = localStorage.getItem('token');
      try {
        const userResponse = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserRole(userResponse.data.role);
      } catch (error) {
        console.error('Failed to fetch user role', error);
      }
    };

    fetchSubmissions();
    fetchAssignmentTitle();
    fetchUserRole();
  }, [assignmentId, classId]);

  const handleGradeChange = (submissionId, grade) => {
    const numericGrade = Math.max(0, Math.min(100, Number(grade))); // Ensure grade is between 0 and 100
    setGrades({ ...grades, [submissionId]: numericGrade });
  };

  const handleGradeSubmission = async (e, submissionId) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/submissions/${submissionId}/grade`, { grade: grades[submissionId] }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmissions(submissions.map(submission =>
        submission.id === submissionId ? { ...submission, student_grade: grades[submissionId] } : submission
      ));
    } catch (error) {
      console.error('Failed to grade submission', error);
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
    <div className="p-4 text-xl">
      <h1 className="text-3xl font-bold mb-4 text-center">Submissions for {assignmentTitle}</h1>
      <ul className="space-y-4 mx-4 ">
        {submissions.map((submission) => (
          <li key={submission.id} className="border p-4 rounded-lg shadow">
            <p className="text-2xl">Student: {submission.Student.name}</p>
            <p>
              Submission: {submission.file_path ? (
                <a href="#" onClick={() => handleDownloadFile(submission.id, submission.original_file_name)} className="text-blue-500 hover:underline">
                  {submission.original_file_name}
                </a>
              ) : 'No file'}
            </p>
            <p>{submission.text_content}</p>
            <p>Grade 0-100: {submission.student_grade}</p>
            {userRole === 'teacher' && (
              <form onSubmit={(e) => handleGradeSubmission(e, submission.id)} className="mt-2">
                <input
                  type="number"
                  value={grades[submission.id] || ''}
                  onChange={(e) => handleGradeChange(submission.id, e.target.value)}
                  placeholder="Enter Grade"
                  min="0"
                  max="100"
                  required
                  className="border p-2 rounded mr-2"
                />
                <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700">
                  Grade Submission
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
      <button onClick={() => navigate(-1)} className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700">
        Back
      </button>
    </div>
  );
}

export default ViewSubmissions;
