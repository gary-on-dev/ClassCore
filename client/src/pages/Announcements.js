import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../components/Auth';
import { useNavigate } from 'react-router-dom';
import '../styles.css';

function Announcements() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Announcements received:', response.data);
        setAnnouncements(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setFilteredAnnouncements(response.data);
      } catch (error) {
        console.error('Fetch announcements error:', error);
        setError(error.response?.data?.error || error.message || 'Failed to load announcements');
        if (error.response?.status === 401) {
          setError('Session expired. Redirecting to login...');
          localStorage.removeItem('token');
          setTimeout(() => {
            logout();
            navigate('/login');
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, [logout, navigate]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredAnnouncements(announcements);
    } else {
      setFilteredAnnouncements(
        announcements.filter((ann) => ann.category === selectedCategory)
      );
    }
  }, [selectedCategory, announcements]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const categories = ['all', 'announcement', 'news', 'article', 'activity'];

  return (
    <div className="blog-page">
      <div className="hero-section">
        <h1>School News & Updates</h1>
        <p>Stay informed with the latest announcements and events</p>
      </div>
      <div className="filter-container">
        {categories.map((category) => (
          <button
            key={category}
            className={`filter-button ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => handleCategoryChange(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="loading">Loading announcements...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : filteredAnnouncements.length === 0 ? (
        <p className="no-content">No announcements available</p>
      ) : (
        <div className="blog-container">
          {filteredAnnouncements[0] && (
            <div className="featured-post">
              {filteredAnnouncements[0].image && (
                <img
                  src={filteredAnnouncements[0].image}
                  alt={filteredAnnouncements[0].title}
                  className="post-image"
                />
              )}
              <div className="post-content">
                <span className="post-category">
                  {filteredAnnouncements[0].category || 'Announcement'}
                </span>
                <h3>{filteredAnnouncements[0].title}</h3>
                <p className="post-summary">{filteredAnnouncements[0].content}</p>
                <p className="post-date">
                  Posted: {new Date(filteredAnnouncements[0].createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          {filteredAnnouncements.slice(1).map((announcement) => (
            <div key={announcement._id} className="blog-card">
              {announcement.image && (
                <img
                  src={announcement.image}
                  alt={announcement.title}
                  className="post-image"
                />
              )}
              <div className="post-content">
                <span className="post-category">{announcement.category || 'Announcement'}</span>
                <h3>{announcement.title}</h3>
                <p className="post-summary">{announcement.content}</p>
                <p className="post-date">
                  Posted: {new Date(announcement.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Announcements;