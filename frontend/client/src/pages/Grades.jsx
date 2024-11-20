import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function Grades() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [grades, setGrades] = useState([]);
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const fetchGrades = async () => {
      const token = localStorage.getItem('token');
      const userResponse = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserRole(userResponse.data.role);
      setUsername(userResponse.data.name);

      try {
        const response = await axios.get(`/api/classes/${classId}/grades`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGrades(response.data);
      } catch (error) {
        console.error('Failed to fetch grades', error);
      }
    };

    fetchGrades();
  }, [classId]);

  return (
    <div>
      <h1>{userRole === 'teacher' ? 'Student Grades' : 'My Grades'}</h1>
      <ul>
        {grades.length > 0 ? (
          grades.map((grade) => (
            <li key={grade.studentId}>
              <p>Student: {grade.studentName}</p>
              <ul>
                {grade.assignments.map((assignment) => (
                  <li key={assignment.assignmentId}>
                    {assignment.assignmentName}: {assignment.grade}
                  </li>
                ))}
              </ul>
              <p>Total Grade: {grade.totalGrade}</p>
            </li>
          ))
        ) : (
          <p>No grades available.</p>
        )}
      </ul>
      <button onClick={() => navigate(-1)}>Back</button>
    </div>
  );
}

export default Grades;