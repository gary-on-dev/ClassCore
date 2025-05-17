import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/Auth';
import axios from 'axios';

function Teacher() {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [grade, setGrade] = useState('');
  const [attendance, setAttendance] = useState(false);
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        console.log('Fetching students for school:', user.school);
        const response = await axios.get('http://localhost:5000/api/students', {
          params: { school: user.school },
        });
        console.log('Students received:', response.data);
        setStudents(response.data);
      } catch (error) {
        console.error('Fetch students error:', error);
        setError('Failed to load students');
      }
    };
    if (user) fetchStudents();
  }, [user]);

  const handleSubmit = async () => {
    try {
      setError('');
      console.log('Submitting report:', { studentId, teacher: user.userId, grade, attendance, comments });
      const response = await axios.post('http://localhost:5000/api/reports', {
        student: studentId,
        teacher: user.userId,
        grade,
        attendance,
        comments,
      });
      console.log('Report submission response:', response.data);
      alert('Report submitted successfully');
      setStudentId('');
      setGrade('');
      setAttendance(false);
      setComments('');
    } catch (error) {
      console.error('Submit report error:', error);
      setError(error.response?.data?.error || 'Failed to submit report');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Teacher Dashboard</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h3>Submit Report</h3>
      <select
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        style={{ display: 'block', margin: '10px auto', padding: '10px' }}
      >
        <option value="">Select Student</option>
        {students.map((student) => (
          <option key={student._id} value={student._id}>
            {student.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
        placeholder="Grade (e.g., A)"
        style={{ display: 'block', margin: '10px auto', padding: '10px', width: '300px' }}
      />
      <label>
        <input
          type="checkbox"
          checked={attendance}
          onChange={(e) => setAttendance(e.target.checked)}
        />
        Attended
      </label>
      <textarea
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        placeholder="Comments"
        style={{ display: 'block', margin: '10px auto', padding: '10px', width: '300px' }}
      />
      <button
        onClick={handleSubmit}
        style={{ padding: '10px 20px', background: 'blue', color: 'white', border: 'none' }}
      >
        Submit Report
      </button>
    </div>
  );
}

export default Teacher;