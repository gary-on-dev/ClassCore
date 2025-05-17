import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/Auth';
import axios from 'axios';

function Announcements() {
  const { user } = useContext(AuthContext);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const school = user?.school || '6826c6741e8bb0ac59a1bea9'; // Default school if not logged in
        console.log('Fetching announcements for school:', school);
        const response = await axios.get('http://localhost:5000/api/announcements', {
          params: { school },
        });
        console.log('Announcements received:', response.data);
        setAnnouncements(response.data);
      } catch (error) {
        console.error('Fetch announcements error:', error);
        setError(error.response?.data?.error || 'Failed to load announcements');
      }
    };
    fetchAnnouncements();
  }, [user]);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Announcements</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {announcements.length === 0 ? (
        <p>No announcements available</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {announcements.map((announcement) => (
            <li key={announcement._id} style={{ margin: '20px 0', border: '1px solid #ccc', padding: '10px' }}>
              <h3>{announcement.title}</h3>
              <p>{announcement.content}</p>
              <p>Posted: {new Date(announcement.createdAt).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Announcements;