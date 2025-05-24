import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/Auth';
import axios from 'axios';
import '../styles/Teacher.css';

function Teacher() {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    student: '',
    subject: '',
    score: '',
    examType: 'opening-term',
    attendance: 'present',
    comment: '',
    class: '',
    stream: '',
  });
  const [results, setResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [error, setError] = useState('');
  const [editingRow, setEditingRow] = useState(null); // Track row being edited

  useEffect(() => {
    const fetchData = async () => {
      try {
        const school = user?.school || '6826c6741e8bb0ac59a1bea9';
        console.log('Fetching classes and streams for school:', school);
        const [classesResponse, streamsResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/classes', {
            params: { school },
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get('http://localhost:5000/api/streams', {
            params: { school },
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);
        setClasses(classesResponse.data);
        setStreams(streamsResponse.data);
        fetchResults(school, form.class, form.stream);
      } catch (error) {
        console.error('Fetch data error:', error);
        setError(error.response?.data?.error || 'Failed to load data');
      }
    };
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchResults = async (school, classId, streamId) => {
    try {
      const params = { school };
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
          teacher: result.teacher || user.email,
        };
      }
      if (result.type === 'exam') {
        if (!studentMap[studentId].subjects[result.subject]) {
          studentMap[studentId].subjects[result.subject] = {
            openingTerm: null,
            midTerm: null,
            endTerm: null,
            ids: {},
          };
        }
        studentMap[studentId].subjects[result.subject][result.examType] = result.score;
        studentMap[studentId].subjects[result.subject].ids[result.examType] = result._id;
      } else if (result.type === 'attendance') {
        studentMap[studentId].attendance = result.attendance;
        studentMap[studentId].attendanceId = result._id;
      } else if (result.type === 'comment') {
        studentMap[studentId].comment = result.comment;
        studentMap[studentId].commentId = result._id;
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

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFilterChange = async (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    await fetchResults(user?.school || '6826c6741e8bb0ac59a1bea9', name === 'class' ? value : form.class, name === 'stream' ? value : form.stream);
  };

  const handleSubmit = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please log in again.');
        return;
      }
      if (!form.student || !form.class || !form.stream) {
        setError('Student ID, class, and stream are required.');
        return;
      }
      if (form.subject && form.score && form.examType) {
        const scorePayload = {
          student: form.student,
          type: 'exam',
          subject: form.subject,
          score: parseFloat(form.score),
          examType: form.examType,
          class: form.class,
          stream: form.stream,
          school: user?.school || '6826c6741e8bb0ac59a1bea9',
        };
        console.log('Submitting score:', scorePayload);
        await axios.post('http://localhost:5000/api/results', scorePayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (form.attendance && !form.subject && !form.comment) {
        const attendancePayload = {
          student: form.student,
          type: 'attendance',
          attendance: form.attendance,
          class: form.class,
          stream: form.stream,
          school: user?.school || '6826c6741e8bb0ac59a1bea9',
        };
        console.log('Submitting attendance:', attendancePayload);
        await axios.post('http://localhost:5000/api/results', attendancePayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (form.comment && !form.subject && !form.attendance) {
        const commentPayload = {
          student: form.student,
          type: 'comment',
          comment: form.comment,
          class: form.class,
          stream: form.stream,
          school: user?.school || '6826c6741e8bb0ac59a1bea9',
        };
        console.log('Submitting comment:', commentPayload);
        await axios.post('http://localhost:5000/api/results', commentPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      console.log('Result(s) added');
      alert('Result(s) added successfully');
      setForm({ student: '', subject: '', score: '', examType: 'opening-term', attendance: 'present', comment: '', class: form.class, stream: form.stream });
      fetchResults(user?.school || '6826c6741e8bb0ac59a1bea9', form.class, form.stream);
    } catch (error) {
      console.error('Add result error:', error);
      setError(error.response?.data?.error || error.response?.data?.details || 'Failed to add result');
    }
  };

  const handleToggleEdit = (result, subject, field, id) => {
    if (editingRow && editingRow.studentId === result.studentId && editingRow.subject === subject && editingRow.field === field) {
      setEditingRow(null);
    } else {
      setEditingRow({
        studentId: result.studentId,
        subject,
        field,
        id,
        value: field === 'attendance' ? result.attendance : field === 'comment' ? result.comment : result.subjects[subject][field],
        examType: field.includes('term') ? field : null,
      });
    }
  };

  const handleEditChange = (e) => {
    setEditingRow({ ...editingRow, value: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please log in again.');
        return;
      }
      const payload = {
        student: editingRow.studentId,
        type: editingRow.field === 'attendance' ? 'attendance' : editingRow.field === 'comment' ? 'comment' : 'exam',
        class: form.class,
        stream: form.stream,
        school: user?.school || '6826c6741e8bb0ac59a1bea9',
      };
      if (editingRow.field === 'attendance') {
        payload.attendance = editingRow.value;
      } else if (editingRow.field === 'comment') {
        payload.comment = editingRow.value;
      } else {
        payload.subject = editingRow.subject;
        payload.score = parseFloat(editingRow.value);
        payload.examType = editingRow.examType;
      }
      console.log('Updating result:', payload);
      await axios.put(`http://localhost:5000/api/results/${editingRow.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Result updated');
      alert('Result updated successfully');
      setEditingRow(null);
      fetchResults(user?.school || '6826c6741e8bb0ac59a1bea9', form.class, form.stream);
    } catch (error) {
      console.error('Update result error:', error);
      setError(error.response?.data?.error || error.response?.data?.details || 'Failed to update result');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this result?')) return;
    try {
      setError('');
      const token = localStorage.getItem('token');
      console.log('Deleting result:', id);
      await axios.delete(`http://localhost:5000/api/results/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Result deleted');
      alert('Result deleted successfully');
      setEditingRow(null);
      fetchResults(user?.school || '6826c6741e8bb0ac59a1bea9', form.class, form.stream);
    } catch (error) {
      console.error('Delete result error:', error);
      setError(error.response?.data?.error || error.response?.data?.details || 'Failed to delete result');
    }
  };

  return (
    <div className="page-container">
      <h1>Teacher Dashboard</h1>
      {error && <p className="error">{error}</p>}
      <div className="form-container">
        <h3>Filter Results</h3>
        <div className="form-group">
          <label htmlFor="class">Class</label>
          <select name="class" value={form.class} onChange={handleFilterChange}>
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>{cls.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="stream">Stream</label>
          <select name="stream" value={form.stream} onChange={handleFilterChange}>
            <option value="">Select Stream</option>
            {streams.filter((s) => !form.class || s.class === form.class).map((stream) => (
              <option key={stream._id} value={stream._id}>{stream.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-container">
        <h3>Add Student Results</h3>
        <div className="form-group">
          <label htmlFor="student">Student ID</label>
          <input
            type="text"
            name="student"
            value={form.student}
            onChange={handleInputChange}
            placeholder="Student ID"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="class">Class</label>
          <select name="class" value={form.class} onChange={handleInputChange}>
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>{cls.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="stream">Stream</label>
          <select name="stream" value={form.stream} onChange={handleInputChange}>
            <option value="">Select Stream</option>
            {streams.filter((s) => !form.class || s.class === form.class).map((stream) => (
              <option key={stream._id} value={stream._id}>{stream.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="subject">Subject</label>
          <input
            type="text"
            name="subject"
            value={form.subject}
            onChange={handleInputChange}
            placeholder="Subject (e.g., Math)"
          />
        </div>
        <div className="form-group">
          <label htmlFor="score">Score (0-100)</label>
          <input
            type="number"
            name="score"
            value={form.score}
            onChange={handleInputChange}
            placeholder="Score (0-100)"
            min="0"
            max="100"
          />
        </div>
        <div className="form-group">
          <label htmlFor="examType">Exam Type</label>
          <select name="examType" value={form.examType} onChange={handleInputChange}>
            <option value="opening-term">Opening-Term Exam</option>
            <option value="mid-term">Mid-Term Exam</option>
            <option value="end-term">End-Term Exam</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="attendance">Attendance</label>
          <select name="attendance" value={form.attendance} onChange={handleInputChange}>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="excused">Excused</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="comment">Comment</label>
          <textarea
            name="comment"
            value={form.comment}
            onChange={handleInputChange}
            placeholder="Comment (e.g., Great effort)"
            rows="4"
          />
        </div>
        <button onClick={handleSubmit}>Add Result</button>
      </div>
      {results.length > 0 && (
        <div className="form-container">
          <h3>Manage Students</h3>
          <table className="results-table">
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
                    <td>
                      {editingRow?.studentId === result.studentId && editingRow?.subject === subject && editingRow?.field === 'opening-term' ? (
                        <input
                          type="number"
                          value={editingRow.value}
                          onChange={handleEditChange}
                          min="0"
                          max="100"
                          className="inline-input"
                        />
                      ) : (
                        data.openingTerm || '-'
                      )}
                      {data.ids['opening-term'] && (
                        <>
                          <button
                            className="edit-button"
                            onClick={() => handleToggleEdit(result, subject, 'opening-term', data.ids['opening-term'])}
                          >
                            {editingRow?.studentId === result.studentId && editingRow?.subject === subject && editingRow?.field === 'opening-term' ? 'Cancel' : 'Edit'}
                          </button>
                          {editingRow?.studentId === result.studentId && editingRow?.subject === subject && editingRow?.field === 'opening-term' && (
                            <button className="update-button" onClick={handleUpdate}>Update</button>
                          )}
                          <button
                            className="delete-button"
                            onClick={() => handleDelete(data.ids['opening-term'])}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                    <td>
                      {editingRow?.studentId === result.studentId && editingRow?.subject === subject && editingRow?.field === 'mid-term' ? (
                        <input
                          type="number"
                          value={editingRow.value}
                          onChange={handleEditChange}
                          min="0"
                          max="100"
                          className="inline-input"
                        />
                      ) : (
                        data.midTerm || '-'
                      )}
                      {data.ids['mid-term'] && (
                        <>
                          <button
                            className="edit-button"
                            onClick={() => handleToggleEdit(result, subject, 'mid-term', data.ids['mid-term'])}
                          >
                            {editingRow?.studentId === result.studentId && editingRow?.subject === subject && editingRow?.field === 'mid-term' ? 'Cancel' : 'Edit'}
                          </button>
                          {editingRow?.studentId === result.studentId && editingRow?.subject === subject && editingRow?.field === 'mid-term' && (
                            <button className="update-button" onClick={handleUpdate}>Update</button>
                          )}
                          <button
                            className="delete-button"
                            onClick={() => handleDelete(data.ids['mid-term'])}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                    <td>
                      {editingRow?.studentId === result.studentId && editingRow?.subject === subject && editingRow?.field === 'end-term' ? (
                        <input
                          type="number"
                          value={editingRow.value}
                          onChange={handleEditChange}
                          min="0"
                          max="100"
                          className="inline-input"
                        />
                      ) : (
                        data.endTerm || '-'
                      )}
                      {data.ids['end-term'] && (
                        <>
                          <button
                            className="edit-button"
                            onClick={() => handleToggleEdit(result, subject, 'end-term', data.ids['end-term'])}
                          >
                            {editingRow?.studentId === result.studentId && editingRow?.subject === subject && editingRow?.field === 'end-term' ? 'Cancel' : 'Edit'}
                          </button>
                          {editingRow?.studentId === result.studentId && editingRow?.subject === subject && editingRow?.field === 'end-term' && (
                            <button className="update-button" onClick={handleUpdate}>Update</button>
                          )}
                          <button
                            className="delete-button"
                            onClick={() => handleDelete(data.ids['end-term'])}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                    <td>{data.grade}</td>
                    <td>{result.rank}</td>
                    <td>
                      {editingRow?.studentId === result.studentId && editingRow?.field === 'comment' ? (
                        <textarea
                          value={editingRow.value}
                          onChange={handleEditChange}
                          rows="2"
                          className="inline-input"
                        />
                      ) : (
                        result.comment || '-'
                      )}
                      {result.commentId && (
                        <>
                          <button
                            className="edit-button"
                            onClick={() => handleToggleEdit(result, null, 'comment', result.commentId)}
                          >
                            {editingRow?.studentId === result.studentId && editingRow?.field === 'comment' ? 'Cancel' : 'Edit'}
                          </button>
                          {editingRow?.studentId === result.studentId && editingRow?.field === 'comment' && (
                            <button className="update-button" onClick={handleUpdate}>Update</button>
                          )}
                          <button
                            className="delete-button"
                            onClick={() => handleDelete(result.commentId)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                    <td>{result.teacher}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Teacher;