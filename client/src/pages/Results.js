import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/Auth';
import axios from 'axios';

function Results() {
  const { user } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');

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
        const aggregatedResults = aggregateResults(response.data);
        setResults(aggregatedResults.results);
        setSubjects(aggregatedResults.subjects);
      } catch (error) {
        console.error('Fetch results error:', error);
        setError(error.response?.data?.error || 'Failed to load results');
      }
    };
    fetchResults();
  }, [user]);

  // Calculate grade based on score
  const getGrade = (average, missed, cheated) => {
    if (missed) return 'Z';
    if (cheated) return 'Y';
    if (average >= 80) return 'A';
    if (average >= 70) return 'B';
    if (average >= 60) return 'C';
    if (average >= 50) return 'D';
    return 'E';
  };

  // Aggregate results for display
  const aggregateResults = (rawResults) => {
    const studentMap = {};
    const subjectSet = new Set();

    rawResults.forEach((result) => {
      const studentId = result.student._id;
      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          student: result.student.email,
          subjects: {},
          totalScore: 0,
          count: 0,
          attendance: '',
          comment: '',
          missed: false,
          cheated: false,
        };
      }
      if (result.type === 'exam' || result.type === 'cat') {
        studentMap[studentId].subjects[result.subject] = result.score;
        studentMap[studentId].totalScore += result.score || 0;
        studentMap[studentId].count += 1;
        subjectSet.add(result.subject);
      } else if (result.type === 'attendance') {
        studentMap[studentId].attendance = result.attendance;
        if (result.attendance === 'absent') {
          studentMap[studentId].missed = true;
        }
      } else if (result.type === 'comment') {
        studentMap[studentId].comment = result.comment;
        if (result.comment.toLowerCase().includes('cheat')) {
          studentMap[studentId].cheated = true;
        }
      }
    });

    const aggregated = Object.values(studentMap).map((student) => ({
      ...student,
      total: student.totalScore,
      average: student.count > 0 ? student.totalScore / student.count : 0,
      grade: getGrade(
        student.count > 0 ? student.totalScore / student.count : 0,
        student.missed,
        student.cheated
      ),
    }));

    // Sort by grade and average
    aggregated.sort((a, b) => {
      const gradeOrder = { A: 5, B: 4, C: 3, D: 2, E: 1, Z: 0, Y: -1 };
      return gradeOrder[b.grade] - gradeOrder[a.grade] || b.average - a.average;
    });

    return {
      results: aggregated.map((student, index) => ({
        ...student,
        rank: index + 1,
      })),
      subjects: Array.from(subjectSet).sort(),
    };
  };

  if (!user) {
    return <div className="page-container"><p>Please log in to view results.</p></div>;
  }

  return (
    <div className="page-container">
      <h1>Results</h1>
      {error && <p className="error">{error}</p>}
      {results.length === 0 ? (
        <p>No results available</p>
      ) : (
        <table className="results-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student</th>
              {subjects.map((subject) => (
                <th key={subject}>{subject}</th>
              ))}
              <th>Total</th>
              <th>Grade</th>
              <th>Attendance</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.student}>
                <td>{result.rank}</td>
                <td>{result.student}</td>
                {subjects.map((subject) => (
                  <td key={subject}>{result.subjects[subject] || '-'}</td>
                ))}
                <td>{result.total}</td>
                <td>{result.grade}</td>
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