import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/Auth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Admin.css';

function Admin() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState('teacher');
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    image: '',
    category: 'announcement',
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setError('');
        setLoading(true);
        const token = localStorage.getItem('token');
        console.log('Fetching announcements with token:', token ? token.slice(0, 10) + '...' : 'Missing');
        if (!token) {
          setError('No token found. Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        const response = await axios.get('http://localhost:5000/api/announcements', {
          params: { school: user?.school || '6826c6741e8bb0ac59a1bea9' },
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Admin announcements received:', response.data);
        setAnnouncements(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (error) {
        console.error('Fetch announcements error:', error);
        if (error.response?.status === 401) {
          setError('Session expired. Redirecting to login...');
          localStorage.removeItem('token');
          setTimeout(() => {
            logout();
            navigate('/login');
          }, 2000);
        } else {
          setError(error.response?.data?.error || error.message || 'Failed to load announcements');
        }
      } finally {
        setLoading(false);
      }
    };
    if (user && user.role === 'admin') {
      fetchAnnouncements();
    } else {
      setError('Access denied: Admins only');
      setLoading(false);
    }
  }, [user, navigate, logout]);

  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') setUserEmail(value);
    if (name === 'password') setUserPassword(value);
    if (name === 'role') setUserRole(value);
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
      console.log('Uploading image with token:', token ? token.slice(0, 10) + '...' : 'Missing');
      if (!token) {
        setError('No token found. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      const formData = new FormData();
      formData.append('image', file);

      // Log FormData for debugging
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }

      const response = await axios.post(
        'http://localhost:5000/api/upload-image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Image uploaded:', response.data.url);
      setAnnouncementForm({ ...announcementForm, image: response.data.url });
    } catch (error) {
      console.error('Image upload error:', error);
      setError(
        error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to upload image'
      );
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
      const payload = {
        email: userEmail,
        password: userPassword,
        role: userRole,
        school: user?.school || '6826c6741e8bb0ac59a1bea9',
      };
      console.log('Adding user - Sending payload:', payload);
      const response = await axios.post('http://localhost:5000/api/users', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('User add response:', response.data);
      alert('User added successfully');
      setUserEmail('');
      setUserPassword('');
      setUserRole('teacher');
    } catch (error) {
      console.error('Add user error:', error.response?.data, error);
      if (error.response?.status === 401) {
        setError('Session expired. Redirecting to login...');
        localStorage.removeItem('token');
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
      } else {
        setError(error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to add user');
      }
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const token = localStorage.getItem('token');
      console.log('Submitting announcement with token:', token ? token.slice(0, 10) + '...' : 'Missing');
      if (!token) {
        setError('No token found. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      const payload = {
        ...announcementForm,
        school: user?.school || '6826c6741e8bb0ac59a1bea9',
      };
      console.log('Announcement payload:', payload);
      let response;
      if (editingId) {
        response = await axios.put(
          `http://localhost:5000/api/announcements/${editingId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Announcement updated:', response.data);
        setAnnouncements(
          announcements.map((ann) =>
            ann._id === editingId ? response.data : ann
          ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        );
        setEditingId(null);
      } else {
        response = await axios.post(
          'http://localhost:5000/api/announcements',
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Announcement created:', response.data);
        setAnnouncements([response.data, ...announcements].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        );
      }
      alert(editingId ? 'Announcement updated successfully' : 'Announcement added successfully');
      setAnnouncementForm({ title: '', content: '', image: '', category: 'announcement' });
    } catch (error) {
      console.error('Announcement error:', error.response?.data, error);
      if (error.response?.status === 401) {
        setError('Session expired. Redirecting to login...');
        localStorage.removeItem('token');
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
      } else {
        setError(error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to save announcement');
      }
    }
  };

  const handleEdit = (announcement) => {
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      image: announcement.image || '',
      category: announcement.category || 'announcement',
    });
    setEditingId(announcement._id);
  };

  const handleDelete = async (id) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      await axios.delete(`http://localhost:5000/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Announcement deleted:', id);
      setAnnouncements(announcements.filter((ann) => ann._id !== id));
      alert('Announcement deleted successfully');
    } catch (error) {
      console.error('Delete announcement error:', error.response?.data, error);
      if (error.response?.status === 401) {
        setError('Session expired. Redirecting to login...');
        localStorage.removeItem('token');
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
      } else {
        setError(error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to delete announcement');
      }
    }
  };

  if (!user || user.role !== 'admin') {
    return <p className="error">Access denied: Admins only</p>;
  }

  return (
    <div className="page-container">
      <h1>Admin Dashboard</h1>
      {error && <p className="error">{error}</p>}
      <div className="form-container">
        <h3>Add User</h3>
        <form className="admin-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={userEmail}
              onChange={handleUserInputChange}
              placeholder="User Email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={userPassword}
              onChange={handleUserInputChange}
              placeholder="User Password"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={userRole}
              onChange={handleUserInputChange}
            >
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="button" onClick={handleAddUser}>Add User</button>
        </form>
      </div>
      <div className="form-container">
        <h3>{editingId ? 'Edit Announcement' : 'Add Announcement'}</h3>
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
      {loading ? (
        <p className="loading">Loading announcements...</p>
      ) : announcements.length === 0 ? (
        <p className="no-content">No announcements available</p>
      ) : (
        <div className="admin-announcements">
          <h3>Existing Announcements</h3>
          <div className="admin-announcement-grid">
            {announcements.map((announcement) => (
              <div key={announcement._id} className="admin-announcement-card">
                {announcement.image && (
                  <img
                    src={announcement.image}
                    alt={announcement.title}
                    className="admin-card-image"
                  />
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
                    <button onClick={() => handleEdit(announcement)}>Edit</button>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(announcement._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;