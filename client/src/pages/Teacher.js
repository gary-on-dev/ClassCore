import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/Auth';
import axios from 'axios';

function Teacher() {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    student: '',
    subject: '',
    score: '',
    attendance: 'present',
    comment: '',
  });
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const school = user?.school || '6826c6741e8bb0ac59a1bea9';
        console.log('Fetching results for school:', school);
        const response = await axios.get('http://localhost:5000/api/results', {
          params: { school },
        });
        console.log('Results received:', response.data);
        setResults(aggregateResults(response.data));
      } catch (error) {
        console.error('Fetch results error:', error);
        setError(error.response?.data?.error || 'Failed to load results');
      }
    };
    fetchResults();
  }, [user]);

  // Aggregate results by student
  const aggregateResults = (rawResults) => {
    const studentMap = {};
    rawResults.forEach((result) => {
      const studentId = result.student._id;
      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          studentId,
          student: result.student.email,
          subjects: {},
          attendance: '',
          comment: '',
        };
      }
      if (result.type === 'exam' || result.type === 'cat') {
        studentMap[studentId].subjects[result.subject] = { score: result.score, id: result._id };
      } else if (result.type === 'attendance') {
        studentMap[studentId].attendance = result.attendance;
        studentMap[studentId].attendanceId = result._id;
      } else if (result.type === 'comment') {
        studentMap[studentId].comment = result.comment;
        studentMap[studentId].commentId = result._id;
      }
    });
    return Object.values(studentMap);
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setError('');
      // Submit subject score (if provided)
      if (form.subject && form.score) {
        const scorePayload = {
          student: form.student,
          type: 'exam',
          subject: form.subject,
          score: parseFloat(form.score),
          school: user?.school || '6826c6741e8bb0ac59a1bea9',
        };
        console.log('Submitting score:', scorePayload);
        await axios.post('http://localhost:5000/api/results', scorePayload);
      }
      // Submit attendance (if not empty)
      if (form.attendance) {
        const attendancePayload = {
          student: form.student,
          type: 'attendance',
          attendance: form.attendance,
          school: user?.school || '6826c6741e8bb0ac59a1bea9',
        };
        console.log('Submitting attendance:', attendancePayload);
        await axios.post('http://localhost:5000/api/results', attendancePayload);
      }
      // Submit comment (if not empty)
      if (form.comment) {
        const commentPayload = {
          student: form.student,
          type: 'comment',
          comment: form.comment,
          school: user?.school || '6826c6741e8bb0ac59a1bea9',
        };
        console.log('Submitting comment:', commentPayload);
        await axios.post('http://localhost:5000/api/results', commentPayload);
      }
      console.log('Result(s) added');
      alert('Result(s) added successfully');
      setForm({ student: '', subject: '', score: '', attendance: 'present', comment: '' });
      const resultsResponse = await axios.get('http://localhost:5000/api/results', {
        params: { school: user?.school || '6826c6741e8bb0ac59a1bea9' },
      });
      setResults(aggregateResults(resultsResponse.data));
    } catch (error) {
      console.error('Add result error:', error);
      setError(error.response?.data?.error || 'Failed to add result');
    }
  };

  const handleDelete = async (id) => {
    try {
      setError('');
      console.log('Deleting result:', id);
      const response = await axios.delete(`http://localhost:5000/api/results/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Result deleted:', response.data);
      alert('Result deleted successfully');
      const resultsResponse = await axios.get('http://localhost:5000/api/results', {
        params: { school: user?.school || '6826c6741e8bb0ac59a1bea9' },
      });
      setResults(aggregateResults(resultsResponse.data));
    } catch (error) {
      console.error('Delete result error:', error);
      setError(error.response?.data?.error || 'Failed to delete result');
    }
  };

  return (
    <div className="page-container">
      <h1>Teacher Dashboard</h1>
      {error && <p className="error">{error}</p>}
      <div className="form-container">
        <h3>Add Student Results</h3>
        <input
          type="text"
          name="student"
          value={form.student}
          onChange={handleInputChange}
          placeholder="Student ID"
        />
        <input
          type="text"
          name="subject"
          value={form.subject}
          onChange={handleInputChange}
          placeholder="Subject (e.g., Math)"
        />
        <input
          type="number"
          name="score"
          value={form.score}
          onChange={handleInputChange}
          placeholder="Score (0-100)"
        />
        <select name="attendance" value={form.attendance} onChange={handleInputChange}>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="excused">Excused</option>
        </select>
        <textarea
          name="comment"
          value={form.comment}
          onChange={handleInputChange}
          placeholder="Comment (e.g., Great effort, Caught cheating)"
        />
        <button onClick={handleSubmit}>Add Result</button>
      </div>
      {results.length > 0 && (
        <div className="form-container">
          <h3>Manage Students</h3>
          <table className="results-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Subjects</th>
                <th>Attendance</th>
                <th>Comment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.studentId}>
                  <td>{result.student}</td>
                  <td>
                    {Object.entries(result.subjects).map(([subject, data]) => (
                      <div key={subject}>
                        {subject}: {data.score}
                        <button
                          className="delete-button"
                          onClick={() => handleDelete(data.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </td>
                  <td>
                    {result.attendance || '-'}
                    {result.attendanceId && (
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(result.attendanceId)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                  <td>
                    {result.comment || '-'}
                    {result.commentId && (
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(result.commentId)}
                      >
                        Delete
                    </button>
                    )}
                  </td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Teacher;