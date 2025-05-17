import React from 'react';
import { Link } from 'react-router-dom';

function Teacher() {
  return (
    <div className="page-container">
      <h1>Teacher Dashboard</h1>
      <p>Manage student results and view announcements.</p>
      <Link to="/results">Go to Results Page</Link>
    </div>
  );
}

export default Teacher;