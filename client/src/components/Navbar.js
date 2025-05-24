import React, { useContext } from 'react';
import { AuthContext } from './Auth';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log('Logging out user:', user?.email);
    logout();
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return null;
    switch (user.role) {
      case 'admin': return '/admin';
      case 'teacher': return '/teacher';
      case 'parent': return '/results';
      case 'student': return '/results';
      default: return '/';
    }
  };

  const getDashboardLabel = () => {
    if (!user) return null;
    switch (user.role) {
      case 'admin': return 'Admin Dashboard';
      case 'teacher': return 'Teacher Dashboard';
      case 'parent': return 'Results';
      case 'student': return 'Results';
      default: return 'Dashboard';
    }
  };

  console.log('Navbar rendering for user:', user?.role, 'Dashboard path:', getDashboardPath());

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Home</Link>
      </div>
      <ul className="navbar-links">
        <li>
          <Link to="/announcements">Announcements</Link>
        </li>
        {user && (
          <>
            <li>
              <Link to={getDashboardPath()}>{getDashboardLabel()}</Link>
            </li>
            {user.role === 'admin' && (
              <li>
                <Link to="/results">Results</Link>
              </li>
            )}
          </>
        )}
        <li>
          {user ? (
            <button onClick={handleLogout}>Logout</button>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;