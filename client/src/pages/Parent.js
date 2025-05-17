import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/Auth';
import axios from 'axios';

function Parent() {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        console.log('Fetching reports for parent:', user.userId);
        const response = await axios.get('http://localhost:5000/api/reports', {
          params: { userId: user.userId, role: user.role },
        });
        console.log('Reports received:', response.data);
        setReports(response.data);
      } catch (error) {
        console.error('Fetch reports error:', error);
        setError('Failed to load reports');
      }
    };
    if (user) fetchReports();
  }, [user]);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Parent Dashboard</h1>
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

export default Parent;