import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/Auth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Admin.css'; // Use Admin.css for consistent styling

function Results() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [filters, setFilters] = useState({ class: '', stream: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No token found. Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        const school = user?.school || '6826c6741e8bb0ac59a1bea9';
        console.log('Fetching classes and streams for school:', school);
        const [classesResponse, streamsResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/classes', {
            params: { school },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/streams', {
            params: { school },
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setClasses(classesResponse.data);
        setStreams(streamsResponse.data);
        await fetchResults(school, filters.class, filters.stream);
      } catch (error) {
        console.error('Fetch data error:', error);
        if (error.response?.status === 401) {
          setError('Session expired. Redirecting to login...');
          localStorage.removeItem('token');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError(error.response?.data?.error || 'Failed to load data');
        }
      } finally {
        setLoading(false);
      }
    };
    if (user && ['admin', 'student', 'parent', 'teacher'].includes(user.role)) {
      fetchData();
    } else {
      setError('Access denied');
      setLoading(false);
    }
  }, [user, navigate]);

  const fetchResults = async (school, classId, streamId) => {
    try {
      const params = { school };
      if (user?.role === 'student') {
        params.student = user.userId || user._id; // Fallback to _id if userId is missing
      }
      if (classId) params.class = classId;
      if (streamId) params.stream = streamId;
      console.log('Fetching results:', params);
      const response = await axios.get('http://localhost:5000/api/results', {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Results received:', response.data);
      setResults(aggregateResults(response.data));
    } catch (error) {
      console.error('Fetch results error:', error);
      setError(error.response?.data?.error || 'Failed to load results');
    }
  };

  const aggregateResults = (rawResults) => {
    const studentMap = {};
    rawResults.forEach((result) => {
      const studentId = result.student._id;
      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          studentId,
          student: result.student.email,
          class: result.class?.name || '-',
          stream: result.stream?.name || '-',
          subjects: {},
          attendance: '',
          comment: '',
          teacher: result.teacher?.email || '-',
        };
      }
      if (result.type === 'exam') {
        if (!studentMap[studentId].subjects[result.subject]) {
          studentMap[studentId].subjects[result.subject] = {
            openingTerm: null,
            midTerm: null,
            endTerm: null,
          };
        }
        studentMap[studentId].subjects[result.subject][result.examType] = result.score;
      } else if (result.type === 'attendance') {
        studentMap[studentId].attendance = result.attendance;
      } else if (result.type === 'comment') {
        studentMap[studentId].comment = result.comment;
      }
    });

    const students = Object.values(studentMap);
    students.forEach((student) => {
      Object.values(student.subjects).forEach((subject) => {
        const scores = [
          subject.openingTerm,
          subject.midTerm,
          subject.endTerm,
        ].filter((score) => score !== null);
        const average = scores.length
          ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)
          : null;
        subject.average = average;
        subject.grade = average ? calculateGrade(average, student.attendance, student.comment) : '-';
      });
      const totalAverage = Object.values(student.subjects)
        .map((s) => s.average)
        .filter((a) => a !== null)
        .reduce((sum, avg) => sum + parseFloat(avg), 0) /
        Object.values(student.subjects).length || null;
      student.totalAverage = totalAverage ? totalAverage.toFixed(1) : null;
    });

    students.sort((a, b) => (b.totalAverage || 0) - (a.totalAverage || 0));
    students.forEach((student, index) => {
      student.rank = student.totalAverage ? index + 1 : '-';
    });

    return students;
  };

  const calculateGrade = (score, attendance, comment) => {
    if (attendance === 'absent') return 'Z';
    if (comment && comment.toLowerCase().includes('cheat')) return 'Y';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'E';
  };

  const handleFilterChange = async (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    await fetchResults(
      user?.school || '6826c6741e8bb0ac59a1bea9',
      name === 'class' ? value : filters.class,
      name === 'stream' ? value : filters.stream
    );
  };

  if (!user) {
    return <div className="page-container"><p>Please log in to view results.</p></div>;
  }

  if (!['admin', 'student', 'parent', 'teacher'].includes(user.role)) {
    return <div className="page-container"><p className="error">Access denied</p></div>;
  }

  return (
    <div className="page-container">
      <h1>Results</h1>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <>
          {['admin', 'teacher'].includes(user.role) && (
            <div className="form-container">
              <h3>Filter Results</h3>
              <div className="form-group">
                <label htmlFor="class">Class</label>
                <select name="class" value={filters.class} onChange={handleFilterChange}>
                  <option value="">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="stream">Stream</label>
                <select
                  name="stream"
                  value={filters.stream}
                  onChange={handleFilterChange}
                  disabled={!filters.class}
                >
                  <option value="">All Streams</option>
                  {streams
                    .filter((s) => !filters.class || s.class === filters.class)
                    .map((stream) => (
                      <option key={stream._id} value={stream._id}>{stream.name}</option>
                    ))}
                </select>
              </div>
            </div>
          )}
          {results.length === 0 ? (
            <p>No results available</p>
          ) : (
            <div className="form-container">
              <h3>Student Results</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Stream</th>
                    <th>Subject</th>
                    <th>Opening-Term Exam</th>
                    <th>Mid-Term Exam</th>
                    <th>End Term Marks</th>
                    <th>Grade</th>
                    <th>Rank</th>
                    <th>Attendance</th>
                    <th>Comment</th>
                    <th>Teacher</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) =>
                    Object.entries(result.subjects).map(([subject, data]) => (
                      <tr key={`${result.studentId}-${subject}`}>
                        <td>{result.student}</td>
                        <td>{result.class}</td>
                        <td>{result.stream}</td>
                        <td>{subject}</td>
                        <td>{data.openingTerm || '-'}</td>
                        <td>{data.midTerm || '-'}</td>
                        <td>{data.endTerm || '-'}</td>
                        <td>{data.grade}</td>
                        <td>{result.rank}</td>
                        <td>{result.attendance || '-'}</td>
                        <td>{result.comment || '-'}</td>
                        <td>{result.teacher}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Results;