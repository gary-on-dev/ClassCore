import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/Auth';
import axios from 'axios';

function Student() {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        console.log('Fetching reports for student:', user.userId);
        const response = await axios.get('http://localhost:5000/api/reports', {
          params: { userId: user.userId, role: 'student' }, // Ensure 'student'
        });
        console.log('Reports received:', response.data);
        setReports(response.data);
      } catch (error) {
        console.error('Fetch reports error:', error);
        setError(error.response?.data?.error || 'Failed to load reports');
      }
    };
    if (user) fetchReports();
  }, [user]);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Student Dashboard</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {reports.length === 0 ? (
        <p>No reports available</p>
      ) : (
        <ul>
          {reports.map((report) => (
            <li key={report._id}>
              Grade: {report.grade}, Attendance: {report.attendance ? 'Yes' : 'No'}, 
              Comments: {report.comments}, Created: {new Date(report.createdAt).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Student;