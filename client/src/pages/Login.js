import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../components/Auth';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user && user.role) {
      console.log('User already logged in:', user, 'Role:', user.role);
      switch (user.role.toLowerCase()) {
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'teacher':
          navigate('/teacher', { replace: true });
          break;
        case 'parent':
          navigate('/results', { replace: true });
          break;
        case 'student':
          navigate('/results', { replace: true });
          break;
        default:
          console.error('Unknown role on load:', user.role);
          navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const user = await login(email, password);
      console.log('Login successful:', user, 'Role:', user?.role);
      if (!user || !user.role) {
        console.error('User or role is undefined:', user);
        setError('Login failed: No user role assigned');
        return;
      }
      const role = user.role.toLowerCase();
      console.log('Navigating with role:', role);
      switch (role) {
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'teacher':
          navigate('/teacher', { replace: true });
          break;
        case 'parent':
          navigate('/results', { replace: true });
          break;
        case 'student':
          navigate('/results', { replace: true });
          break;
        default:
          console.error('Unknown role:', user.role);
          setError('Login failed: Invalid user role');
          navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error.message || error);
      setError(error.message || 'Invalid email or password');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="logo-container">
            <img src="/logo.png" alt="School Logo" className="logo" />
          </div>
          <h1>School Management</h1>
          <p className="subtitle">Sign in to access your account</p>
          {error && <p className="error">{error}</p>}
          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit">Sign In</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;