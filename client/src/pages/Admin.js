import React, { useState, useContext } from 'react';
import { AuthContext } from '../components/Auth';
import axios from 'axios';

function Admin() {
  const { user } = useContext(AuthContext);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState('teacher');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [error, setError] = useState('');

  console.log('Admin user context:', user); // Log user object to verify

  const handleAddUser = async () => {
    try {
      setError('');
      const payload = {
        email: userEmail,
        password: userPassword,
        role: userRole,
        school: '6826c6741e8bb0ac59a1bea9', // Hardcode correct school ID
      };
      console.log('Adding user - Sending payload:', payload);
      const response = await axios.post('http://localhost:5000/api/users', payload);
      console.log('User add response:', response.data);
      alert('User added successfully');
      setUserEmail('');
      setUserPassword('');
      setUserRole('teacher');
    } catch (error) {
      console.error('Add user error:', error.response?.data, error);
      setError(error.response?.data?.error || error.response?.data?.details || 'Failed to add user');
    }
  };

  const handleAddAnnouncement = async () => {
    try {
      setError('');
      const payload = {
        title: announcementTitle,
        content: announcementContent,
        school: '6826c6741e8bb0ac59a1bea9', // Hardcode correct school ID
      };
      console.log('Adding announcement - Sending payload:', payload);
      const response = await axios.post('http://localhost:5000/api/announcements', payload);
      console.log('Announcement add response:', response.data);
      alert('Announcement added successfully');
      setAnnouncementTitle('');
      setAnnouncementContent('');
    } catch (error) {
      console.error('Add announcement error:', error.response?.data, error);
      setError(error.response?.data?.error || error.response?.data?.details || 'Failed to add announcement');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Admin Dashboard</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h3>Add User</h3>
      <input
        type="email"
        value={userEmail}
        onChange={(e) => setUserEmail(e.target.value)}
        placeholder="User Email"
        style={{ display: 'block', margin: '10px auto', padding: '10px', width: '300px' }}
      />
      <input
        type="password"
        value={userPassword}
        onChange={(e) => setUserPassword(e.target.value)}
        placeholder="User Password"
        style={{ display: 'block', margin: '10px auto', padding: '10px', width: '300px' }}
      />
      <select
        value={userRole}
        onChange={(e) => setUserRole(e.target.value)}
        style={{ display: 'block', margin: '10px auto', padding: '10px' }}
      >
        <option value="teacher">Teacher</option>
        <option value="parent">Parent</option>
        <option value="student">Student</option>
        <option value="admin">Admin</option>
      </select>
      <button
        onClick={handleAddUser}
        style={{ padding: '10px 20px', background: 'blue', color: 'white', border: 'none' }}
      >
        Add User
      </button>
      <h3>Add Announcement</h3>
      <input
        type="text"
        value={announcementTitle}
        onChange={(e) => setAnnouncementTitle(e.target.value)}
        placeholder="Announcement Title"
        style={{ display: 'block', margin: '10px auto', padding: '10px', width: '300px' }}
      />
      <textarea
        value={announcementContent}
        onChange={(e) => setAnnouncementContent(e.target.value)}
        placeholder="Announcement Content"
        style={{ display: 'block', margin: '10px auto', padding: '10px', width: '300px' }}
      />
      <button
        onClick={handleAddAnnouncement}
        style={{ padding: '10px 20px', background: 'blue', color: 'white', border: 'none' }}
      >
        Add Announcement
      </button>
    </div>
  );
}

export default Admin;