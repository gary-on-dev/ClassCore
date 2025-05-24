import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/Auth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Admin.css';

function Admin() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    role: 'teacher',
    class: '',
    stream: '',
  });
  const [classForm, setClassForm] = useState({ name: '' });
  const [streamForm, setStreamForm] = useState({ name: '', class: '' });
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    image: '',
    category: 'announcement',
  });
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [counts, setCounts] = useState({
    totalStudents: 0,
    studentClassCounts: [],
    studentStreamCounts: [],
    totalTeachers: 0,
    teacherClassCounts: [],
    teacherStreamCounts: [],
  });
  const [editingId, setEditingId] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null);
  const [editingStreamId, setEditingStreamId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [openCard, setOpenCard] = useState(null); // Track which card is open

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
        const [announcementsRes, classesRes, streamsRes, usersRes, countsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/announcements', {
            params: { school },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/classes', {
            params: { school },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/streams', {
            params: { school },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/users', {
            params: { school },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/users/count', {
            params: { school },
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setAnnouncements(announcementsRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setClasses(classesRes.data);
        setStreams(streamsRes.data);
        setUsers(usersRes.data);
        setCounts(countsRes.data);
      } catch (error) {
        console.error('Fetch error:', error);
        if (error.response?.status === 401) {
          setError('Session expired. Redirecting to login...');
          localStorage.removeItem('token');
          setTimeout(() => {
            logout();
            navigate('/login');
          }, 2000);
        } else {
          setError(error.response?.data?.error || 'Failed to load data');
        }
      } finally {
        setLoading(false);
      }
    };
    if (user && user.role === 'admin') {
      fetchData();
    } else {
      setError('Access denied: Admins only');
      setLoading(false);
    }
  }, [user, navigate, logout]);

  const toggleCard = (card) => {
    setOpenCard(openCard === card ? null : card);
  };

  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => {
      const newForm = { ...prev, [name]: value };
      if (name === 'class') {
        newForm.stream = '';
      }
      return newForm;
    });
  };

  const handleClassInputChange = (e) => {
    setClassForm({ name: e.target.value });
  };

  const handleStreamInputChange = (e) => {
    const { name, value } = e.target;
    setStreamForm({ ...streamForm, [name]: value });
  };

  const handleAnnouncementInputChange = (e) => {
    const { name, value } = e.target;
    setAnnouncementForm({ ...announcementForm, [name]: value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setError('No file selected');
      return;
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPEG or PNG images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
      return;
    }
    try {
      setError('');
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', file);
      const response = await axios.post('http://localhost:5000/api/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setAnnouncementForm({ ...announcementForm, image: response.data.url });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload image');
    }
  };

  const handleAddUser = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      if (userForm.role === 'student' && (!userForm.class || !userForm.stream)) {
        setError('Class and stream are required for students');
        return;
      }
      const payload = {
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        class: userForm.class || undefined,
        stream: userForm.stream || undefined,
        school: user?.school || '6826c6741e8bb0ac59a1bea9',
      };
      let response;
      if (editingUserId) {
        response = await axios.put(`http://localhost:5000/api/users/${editingUserId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(users.map((u) => (u._id === editingUserId ? response.data : u)));
        setEditingUserId(null);
      } else {
        response = await axios.post('http://localhost:5000/api/users', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers([...users, response.data]);
      }
      alert(editingUserId ? 'User updated' : 'User added');
      setUserForm({ email: '', password: '', role: 'teacher', class: '', stream: '' });
      const countsRes = await axios.get('http://localhost:5000/api/users/count', {
        params: { school: user?.school || '6826c6741e8bb0ac59a1bea9' },
        headers: { Authorization: `Bearer ${token}` },
      });
      setCounts(countsRes.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save user');
    }
  };

  const handleEditUser = (u) => {
    setUserForm({
      email: u.email,
      password: '',
      role: u.role,
      class: u.class?._id || '',
      stream: u.stream?._id || '',
    });
    setEditingUserId(u._id);
    setOpenCard('addUser');
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      setError('');
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((u) => u._id !== id));
      alert('User deleted');
      const countsRes = await axios.get('http://localhost:5000/api/users/count', {
        params: { school: user?.school || '6826c6741e8bb0ac59a1bea9' },
        headers: { Authorization: `Bearer ${token}` },
      });
      setCounts(countsRes.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleAddClass = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const payload = { name: classForm.name, school: user?.school || '6826c6741e8bb0ac59a1bea9' };
      let response;
      if (editingClassId) {
        response = await axios.put(`http://localhost:5000/api/classes/${editingClassId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClasses(classes.map((cls) => (cls._id === editingClassId ? response.data : cls)));
        setEditingClassId(null);
      } else {
        response = await axios.post('http://localhost:5000/api/classes', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClasses([...classes, response.data]);
      }
      alert(editingClassId ? 'Class updated' : 'Class added');
      setClassForm({ name: '' });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save class');
    }
  };

  const handleAddStream = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const payload = {
        name: streamForm.name,
        class: streamForm.class,
        school: user?.school || '6826c6741e8bb0ac59a1bea9',
      };
      let response;
      if (editingStreamId) {
        response = await axios.put(`http://localhost:5000/api/streams/${editingStreamId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStreams(streams.map((str) => (str._id === editingStreamId ? response.data : str)));
        setEditingStreamId(null);
      } else {
        response = await axios.post('http://localhost:5000/api/streams', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStreams([...streams, response.data]);
      }
      alert(editingStreamId ? 'Stream updated' : 'Stream added');
      setStreamForm({ name: '', class: '' });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save stream');
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const token = localStorage.getItem('token');
      const payload = { ...announcementForm, school: user?.school || '6826c6741e8bb0ac59a1bea9' };
      let response;
      if (editingId) {
        response = await axios.put(`http://localhost:5000/api/announcements/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAnnouncements(announcements.map((ann) => (ann._id === editingId ? response.data : ann)).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        ));
        setEditingId(null);
      } else {
        response = await axios.post('http://localhost:5000/api/announcements', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAnnouncements([response.data, ...announcements].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        ));
      }
      alert(editingId ? 'Announcement updated' : 'Announcement added');
      setAnnouncementForm({ title: '', content: '', image: '', category: 'announcement' });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save announcement');
    }
  };

  const handleEditClass = (cls) => {
    setClassForm({ name: cls.name });
    setEditingClassId(cls._id);
    setOpenCard('addClass');
  };

  const handleEditStream = (stream) => {
    setStreamForm({ name: stream.name, class: stream.class });
    setEditingStreamId(stream._id);
    setOpenCard('addStream');
  };

  const handleEditAnnouncement = (announcement) => {
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      image: announcement.image || '',
      category: announcement.category || 'announcement',
    });
    setEditingId(announcement._id);
    setOpenCard('addAnnouncement');
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Delete this class?')) return;
    try {
      setError('');
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/classes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(classes.filter((cls) => cls._id !== id));
      alert('Class deleted');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete class');
    }
  };

  const handleDeleteStream = async (id) => {
    if (!window.confirm('Delete this stream?')) return;
    try {
      setError('');
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/streams/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStreams(streams.filter((str) => str._id !== id));
      alert('Stream deleted');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete stream');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      setError('');
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnnouncements(announcements.filter((ann) => ann._id !== id));
      alert('Announcement deleted');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete announcement');
    }
  };

  if (!user || user.role !== 'admin') {
    return <p className="error">Access denied: Admins only</p>;
  }

  return (
    <div className="page-container">
      <h1>Admin Dashboard</h1>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <div className="card-grid">
          {/* Add User Card */}
          <div className="card">
            <div className="card-header" onClick={() => toggleCard('addUser')}>
              <h3>{editingUserId ? 'Edit User' : 'Add User'}</h3>
              <span>{openCard === 'addUser' ? '−' : '+'}</span>
            </div>
            {openCard === 'addUser' && (
              <div className="card-content">
                <form className="admin-form">
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={userForm.email}
                      onChange={handleUserInputChange}
                      placeholder="User Email"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">Password {editingUserId ? '(Leave blank to keep unchanged)' : ''}</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={userForm.password}
                      onChange={handleUserInputChange}
                      placeholder="User Password"
                      required={!editingUserId}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="role">Role</label>
                    <select id="role" name="role" value={userForm.role} onChange={handleUserInputChange}>
                      <option value="teacher">Teacher</option>
                      <option value="parent">Parent</option>
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="class">Class {userForm.role === 'student' && '(Required)'}</label>
                    <select
                      id="class"
                      name="class"
                      value={userForm.class}
                      onChange={handleUserInputChange}
                      required={userForm.role === 'student'}
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="stream">Stream {userForm.role === 'student' && '(Required)'}</label>
                    <select
                      id="stream"
                      name="stream"
                      value={userForm.stream}
                      onChange={handleUserInputChange}
                      required={userForm.role === 'student'}
                      disabled={!userForm.class}
                    >
                      <option value="">Select Stream</option>
                      {streams
                        .filter((s) => !userForm.class || s.class === userForm.class)
                        .map((stream) => (
                          <option key={stream._id} value={stream._id}>
                            {stream.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <button type="button" onClick={handleAddUser}>
                    {editingUserId ? 'Update User' : 'Add User'}
                  </button>
                  {editingUserId && (
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => {
                        setUserForm({ email: '', password: '', role: 'teacher', class: '', stream: '' });
                        setEditingUserId(null);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>

          {/* Student Statistics Card */}
          <div className="card">
            <div className="card-header" onClick={() => toggleCard('studentStats')}>
              <h3>Student Statistics</h3>
              <span>{openCard === 'studentStats' ? '−' : '+'}</span>
            </div>
            {openCard === 'studentStats' && (
              <div className="card-content">
                <div className="stats-container">
                  <div className="stat-box">
                    <h4>Total Students</h4>
                    <p>{counts.totalStudents}</p>
                  </div>
                  <div className="stat-box">
                    <h4>Students per Class</h4>
                    {counts.studentClassCounts.length === 0 ? (
                      <p>No students assigned</p>
                    ) : (
                      <ul>
                        {counts.studentClassCounts.map((count) => (
                          <li key={count.classId}>
                            {count.className}: {count.count}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="stat-box">
                    <h4>Students per Stream</h4>
                    {counts.studentStreamCounts.length === 0 ? (
                      <p>No students assigned</p>
                    ) : (
                      <ul>
                        {counts.studentStreamCounts.map((count) => (
                          <li key={count.streamId}>
                            {count.streamName} ({count.className}): {count.count}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Teacher Statistics Card */}
          <div className="card">
            <div className="card-header" onClick={() => toggleCard('teacherStats')}>
              <h3>Teacher Statistics</h3>
              <span>{openCard === 'teacherStats' ? '−' : '+'}</span>
            </div>
            {openCard === 'teacherStats' && (
              <div className="card-content">
                <div className="stats-container">
                  <div className="stat-box">
                    <h4>Total Teachers</h4>
                    <p>{counts.totalTeachers}</p>
                  </div>
                  <div className="stat-box">
                    <h4>Teachers per Class</h4>
                    {counts.teacherClassCounts.length === 0 ? (
                      <p>No teachers assigned</p>
                    ) : (
                      <ul>
                        {counts.teacherClassCounts.map((count) => (
                          <li key={count.classId}>
                            {count.className}: {count.count}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="stat-box">
                    <h4>Teachers per Stream</h4>
                    {counts.teacherStreamCounts.length === 0 ? (
                      <p>No teachers assigned</p>
                    ) : (
                      <ul>
                        {counts.teacherStreamCounts.map((count) => (
                          <li key={count.streamId}>
                            {count.streamName} ({count.className}): {count.count}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manage Users Card */}
          <div className="card">
            <div className="card-header" onClick={() => toggleCard('manageUsers')}>
              <h3>Manage Users</h3>
              <span>{openCard === 'manageUsers' ? '−' : '+'}</span>
            </div>
            {openCard === 'manageUsers' && (
              <div className="card-content">
                {users.length === 0 ? (
                  <p>No users available</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Class</th>
                        <th>Stream</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id}>
                          <td>{u.email}</td>
                          <td>{u.role}</td>
                          <td>{u.class?.name || '-'}</td>
                          <td>{u.stream?.name || '-'}</td>
                          <td>
                            <button onClick={() => handleEditUser(u)}>Edit</button>
                            <button className="delete-button" onClick={() => handleDeleteUser(u._id)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          {/* Add Class Card */}
          <div className="card">
            <div className="card-header" onClick={() => toggleCard('addClass')}>
              <h3>{editingClassId ? 'Edit Class' : 'Add Class'}</h3>
              <span>{openCard === 'addClass' ? '−' : '+'}</span>
            </div>
            {openCard === 'addClass' && (
              <div className="card-content">
                <form className="admin-form">
                  <div className="form-group">
                    <label htmlFor="className">Class Name</label>
                    <input
                      type="text"
                      id="className"
                      value={classForm.name}
                      onChange={handleClassInputChange}
                      placeholder="e.g., Grade 1"
                      required
                    />
                  </div>
                  <button type="button" onClick={handleAddClass}>
                    {editingClassId ? 'Update Class' : 'Add Class'}
                  </button>
                  {editingClassId && (
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => {
                        setClassForm({ name: '' });
                        setEditingClassId(null);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>

          {/* Add Stream Card */}
          <div className="card">
            <div className="card-header" onClick={() => toggleCard('addStream')}>
              <h3>{editingStreamId ? 'Edit Stream' : 'Add Stream'}</h3>
              <span>{openCard === 'addStream' ? '−' : '+'}</span>
            </div>
            {openCard === 'addStream' && (
              <div className="card-content">
                <form className="admin-form">
                  <div className="form-group">
                    <label htmlFor="streamName">Stream Name</label>
                    <input
                      type="text"
                      id="streamName"
                      name="name"
                      value={streamForm.name}
                      onChange={handleStreamInputChange}
                      placeholder="e.g., Grade 1A"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="streamClass">Class</label>
                    <select
                      id="streamClass"
                      name="class"
                      value={streamForm.class}
                      onChange={handleStreamInputChange}
                      required
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={handleAddStream}>
                    {editingStreamId ? 'Update Stream' : 'Add Stream'}
                  </button>
                  {editingStreamId && (
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => {
                        setStreamForm({ name: '', class: '' });
                        setEditingStreamId(null);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>

          {/* Manage Classes Card */}
          <div className="card">
            <div className="card-header" onClick={() => toggleCard('manageClasses')}>
              <h3>Manage Classes</h3>
              <span>{openCard === 'manageClasses' ? '−' : '+'}</span>
            </div>
            {openCard === 'manageClasses' && (
              <div className="card-content">
                {classes.length === 0 ? (
                  <p>No classes available</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Class Name</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map((cls) => (
                        <tr key={cls._id}>
                          <td>{cls.name}</td>
                          <td>
                            <button onClick={() => handleEditClass(cls)}>Edit</button>
                            <button className="delete-button" onClick={() => handleDeleteClass(cls._id)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          {/* Manage Streams Card */}
          <div className="card">
            <div className="card-header" onClick={() => toggleCard('manageStreams')}>
              <h3>Manage Streams</h3>
              <span>{openCard === 'manageStreams' ? '−' : '+'}</span>
            </div>
            {openCard === 'manageStreams' && (
              <div className="card-content">
                {streams.length === 0 ? (
                  <p>No streams available</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Stream Name</th>
                        <th>Class</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {streams.map((stream) => (
                        <tr key={stream._id}>
                          <td>{stream.name}</td>
                          <td>{classes.find((cls) => cls._id === stream.class)?.name || '-'}</td>
                          <td>
                            <button onClick={() => handleEditStream(stream)}>Edit</button>
                            <button className="delete-button" onClick={() => handleDeleteStream(stream._id)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          {/* Add Announcement Card */}
          <div className="card">
            <div className="card-header" onClick={() => toggleCard('addAnnouncement')}>
              <h3>{editingId ? 'Edit Announcement' : 'Add Announcement'}</h3>
              <span>{openCard === 'addAnnouncement' ? '−' : '+'}</span>
            </div>
            {openCard === 'addAnnouncement' && (
              <div className="card-content">
                <form className="admin-form" onSubmit={handleAnnouncementSubmit}>
                  <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={announcementForm.title}
                      onChange={handleAnnouncementInputChange}
                      placeholder="Announcement Title"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="content">Content</label>
                    <textarea
                      id="content"
                      name="content"
                      value={announcementForm.content}
                      onChange={handleAnnouncementInputChange}
                      placeholder="Announcement Content"
                      rows="5"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="image">Image (Optional)</label>
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/jpeg,image/png"
                      onChange={handleImageUpload}
                    />
                    {announcementForm.image && (
                      <div className="image-preview">
                        <img src={announcementForm.image} alt="Preview" />
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select
                      id="category"
                      name="category"
                      value={announcementForm.category}
                      onChange={handleAnnouncementInputChange}
                    >
                      <option value="announcement">Announcement</option>
                      <option value="news">News</option>
                      <option value="article">Article</option>
                      <option value="activity">Activity</option>
                    </select>
                  </div>
                  <button type="submit">{editingId ? 'Update' : 'Add'} Announcement</button>
                  {editingId && (
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => {
                        setAnnouncementForm({ title: '', content: '', image: '', category: 'announcement' });
                        setEditingId(null);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>

          {/* Existing Announcements Card */}
          <div className="card">
            <div className="card-header" onClick={() => toggleCard('existingAnnouncements')}>
              <h3>Existing Announcements</h3>
              <span>{openCard === 'existingAnnouncements' ? '−' : '+'}</span>
            </div>
            {openCard === 'existingAnnouncements' && (
              <div className="card-content">
                {announcements.length === 0 ? (
                  <p className="no-content">No announcements available</p>
                ) : (
                  <div className="admin-announcement-grid">
                    {announcements.map((announcement) => (
                      <div key={announcement._id} className="admin-announcement-card">
                        {announcement.image && (
                          <img src={announcement.image} alt={announcement.title} className="admin-card-image" />
                        )}
                        <div className="admin-card-content">
                          <h4>{announcement.title}</h4>
                          <p className="admin-card-summary">{announcement.content}</p>
                          <span className={`category-tag ${announcement.category}`}>
                            {announcement.category || 'Announcement'}
                          </span>
                          <p className="admin-post-date">
                            Posted: {new Date(announcement.createdAt).toLocaleDateString()}
                          </p>
                          <div className="admin-card-actions">
                            <button onClick={() => handleEditAnnouncement(announcement)}>Edit</button>
                            <button
                              className="delete-button"
                              onClick={() => handleDeleteAnnouncement(announcement._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;