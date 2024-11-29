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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{userRole === 'teacher' ? 'Student Grades' : 'My Grades'}</h1>
      <ul className="space-y-4">
        {grades.length > 0 ? (
          grades.map((grade) => (
            <li key={grade.studentId} className="border space-y-2 p-4 rounded-lg shadow text-xl">
              <p className="font-bold">Student: {grade.studentName}</p>
              <ul className="list-disc list-inside ml-4">
                {grade.assignments.map((assignment) => (
                  <li key={assignment.assignmentId}>
                    {assignment.assignmentName}: {assignment.grade}
                  </li>
                ))}
              </ul>
              <p className="font-bold mt-2">Total Grade: {grade.totalGrade}</p>
            </li>
          ))
        ) : (
          <p>No grades available.</p>
        )}
      </ul>
      <button onClick={() => navigate(-1)} className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700">
        Back
      </button>
    </div>
  );
}

export default Grades;