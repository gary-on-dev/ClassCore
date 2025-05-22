import React, { useContext } from 'react';
import { AuthContext } from './Auth';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useContext(AuthContext);

  // If allowedRoles is empty (for /login), redirect logged-in users
  if (allowedRoles.length === 0 && user) {
    const role = user.role ? user.role.toLowerCase() : '';
    console.log('Redirecting logged-in user from /login:', role);
    switch (role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'teacher':
        return <Navigate to="/teacher" replace />;
      case 'parent':
      case 'student':
        return <Navigate to="/results" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // If not logged in, redirect to /login for protected routes
  if (!user && allowedRoles.length > 0) {
    console.log('User not logged in, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // If logged in but role not allowed, redirect to /
  if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role.toLowerCase())) {
    console.log('Role not allowed:', user.role, 'Allowed:', allowedRoles);
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;