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

  return (
    <nav>
      <div>
        <Link to="/">Home</Link>
        <Link to="/announcements">Announcements</Link>
        {user && (
          <Link to={getDashboardPath()}>
            {getDashboardLabel()}
          </Link>
        )}
      </div>
      <div>
        {user ? (
          <button onClick={handleLogout}>Logout</button>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;