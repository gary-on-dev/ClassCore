import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/announcements')
      .then(response => setAnnouncements(response.data))
      .catch(error => console.error('Error fetching announcements:', error));
  }, []);

  return (
    <div style={{ padding: '50px' }}>
      <h1>Announcements</h1>
      {announcements.map(ann => (
        <div key={ann._id} style={{ border: '1px solid gray', padding: '10px', margin: '10px 0' }}>
          <h3>{ann.title}</h3>
          <p>{ann.content}</p>
          <p>Posted on: {new Date(ann.createdAt).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}

export default Announcements;