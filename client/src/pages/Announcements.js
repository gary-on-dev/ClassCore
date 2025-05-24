import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Announcement.css';

function Announcements() {
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
        const schoolId = '6826c6741e8bb0ac59a1bea9';
        console.log('Fetching announcements for school:', schoolId);
        const response = await axios.get('http://localhost:5000/api/announcements', {
          params: { school: schoolId },
        });
        console.log('Announcements received:', response.data);
        setAnnouncements(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setFilteredAnnouncements(response.data);
      } catch (error) {
        console.error('Fetch announcements error:', error);
        setError(error.response?.data?.error || error.message || 'Failed to load announcements');
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

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
        <h1>Welcome to Our School</h1>
        <p>Discover the latest news, events, and updates from our vibrant community</p>
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
                  className="featured-image"
                />
              )}
              <div className="featured-content">
                <span className={`category-tag ${filteredAnnouncements[0].category}`}>
                  {filteredAnnouncements[0].category || 'Announcement'}
                </span>
                <h2>{filteredAnnouncements[0].title}</h2>
                <p className="featured-summary">{filteredAnnouncements[0].content}</p>
                <p className="post-date">
                  Posted: {new Date(filteredAnnouncements[0].createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          <div className="announcement-grid">
            {filteredAnnouncements.slice(1).map((announcement) => (
              <div key={announcement._id} className="announcement-card">
                {announcement.image && (
                  <img
                    src={announcement.image}
                    alt={announcement.title}
                    className="card-image"
                  />
                )}
                <div className="card-content">
                  <span className={`category-tag ${announcement.category}`}>
                    {announcement.category || 'Announcement'}
                  </span>
                  <h3>{announcement.title}</h3>
                  <p className="card-summary">{announcement.content}</p>
                  <p className="post-date">
                    Posted: {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Announcements;