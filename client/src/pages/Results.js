import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/Auth';
import axios from 'axios';

function Results() {
  const { user } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    student: '',
    type: 'exam',
    subject: '',
    score: '',
    attendance: 'present',
    comment: '',
  });

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const school = user?.school || '6826c6741e8bb0ac59a1bea9';
        const params = { school };
        if (user?.role === 'student') {
          params.student = user.userId;
        }
        console.log('Fetching results:', params);
        const response = await axios.get('http://localhost:5000/api/results', { params });
        console.log('Results received:', response.data);

        // Calculate rankings and aggregates
        const aggregatedResults = aggregateResults(response.data);
        setResults(aggregatedResults);
      } catch (error) {
        console.error('Fetch results error:', error);
        setError(error.response?.data?.error || 'Failed to load results');
      }
    };
    fetchResults();
  }, [user]);

  // Aggregate results for display
  const aggregateResults = (rawResults) => {
    // Group by student
    const studentMap = {};
    rawResults.forEach((result) => {
      const studentId = result.student._id;
      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          student: result.student.email,
          subjects: {},
          totalScore: 0,
          count: 0,
        };
      }
      if (result.type === 'exam' || result.type === 'cat') {
        studentMap[studentId].subjects[result.subject] = result.score;
        studentMap[studentId].totalScore += result.score || 0;
        studentMap[studentId].count += 1;
      } else if (result.type === 'attendance') {
        studentMap[studentId].attendance = result.attendance;
      } else if (result.type === 'comment') {
        studentMap[studentId].comment = result.comment;
      }
    });

    // Convert to array and calculate averages
    const aggregated = Object.values(studentMap).map((student) => ({
      ...student,
      average: student.count > 0 ? (student.totalScore / student.count).toFixed(2) : 0,
    }));

    // Sort by average for ranking
    aggregated.sort((a, b) => b.average - a.average);

    // Add rank
    return aggregated.map((student, index) => ({
      ...student,
      rank: index + 1,
    }));
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setError('');
      const payload = {
        student: form.student,
        type: form.type,
        subject: form.type === 'exam' || form.type === 'cat' ? form.subject : undefined,
        score: form.type === 'exam' || form.type === 'cat' ? parseFloat(form.score) : undefined,
        attendance: form.type === 'attendance' ? form.attendance : undefined,
        comment: form.type === 'comment' ? form.comment : undefined,
        school: user?.school || '6826c6741e8bb0ac59a1bea9',
      };
      console.log('Submitting result:', payload);
      const response = await axios.post('http://localhost:5000/api/results', payload);
      console.log('Result added:', response.data);
      alert('Result added successfully');
      setForm({ student: '', type: 'exam', subject: '', score: '', attendance: 'present', comment: '' });
      // Refresh results
      const resultsResponse = await axios.get('http://localhost:5000/api/results', {
        params: { school: user?.school || '6826c6741e8bb0ac59a1bea9' },
      });
      setResults(aggregateResults(resultsResponse.data));
    } catch (error) {
      console.error('Add result error:', error);
      setError(error.response?.data?.error || 'Failed to add result');
    }
  };

  if (!user) {
    return <div className="page-container"><p>Please log in to view results.</p></div>;
  }

  return (
    <div className="page-container">
      <h1>Results</h1>
      {error && <p className="error">{error}</p>}
      {user.role === 'teacher' && (
        <div className="form-container">
          <h3>Add Result</h3>
          <input
            type="text"
            name="student"
            value={form.student}
            onChange={handleInputChange}
            placeholder="Student ID"
          />
          <select name="type" value={form.type} onChange={handleInputChange}>
            <option value="exam">Exam</option>
            <option value="cat">CAT</option>
            <option value="attendance">Attendance</option>
            <option value="comment">Comment</option>
          </select>
          {(form.type === 'exam' || form.type === 'cat') && (
            <>
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
            </>
          )}
          {form.type === 'attendance' && (
            <select name="attendance" value={form.attendance} onChange={handleInputChange}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="excused">Excused</option>
            </select>
          )}
          {form.type === 'comment' && (
            <textarea
              name="comment"
              value={form.comment}
              onChange={handleInputChange}
              placeholder="Comment"
            />
          )}
          <button onClick={handleSubmit}>Add Result</button>
        </div>
      )}
      {results.length === 0 ? (
        <p>No results available</p>
      ) : (
        <table className="results-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student</th>
              <th>Subjects</th>
              <th>Average</th>
              <th>Attendance</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.student}>
                <td>{result.rank}</td>
                <td>{result.student}</td>
                <td>
                  {Object.entries(result.subjects).map(([subject, score]) => (
                    <div key={subject}>{`${subject}: ${score}`}</div>
                  ))}
                </td>
                <td>{result.average}</td>
                <td>{result.attendance || '-'}</td>
                <td>{result.comment || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Results;