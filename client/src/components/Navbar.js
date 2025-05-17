import React, { useContext } from 'react';
import { AuthContext } from './Auth';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ background: '#333', color: 'white', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <Link to="/" style={{ color: 'white', marginRight: '20px', textDecoration: 'none' }}>Home</Link>
        <Link to="/announcements" style={{ color: 'white', textDecoration: 'none' }}>Announcements</Link>
      </div>
      <div>
        {user ? (
          <>
            <span style={{ marginRight: '20px' }}>Welcome, {user.email}</span>
            <button
              onClick={handleLogout}
              style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;