import React, { useState, useContext } from 'react';
import { AuthContext } from '../components/Auth';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      setError('');
      const user = await login(email, password);
      console.log('Login successful:', user);
      // Redirect based on role
      switch (user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'teacher':
          navigate('/teacher');
          break;
        case 'parent':
          navigate('/parent');
          break;
        case 'student':
          navigate('/student');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error || 'Invalid email or password');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Login</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        style={{ display: 'block', margin: '10px auto', padding: '10px', width: '300px' }}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        style={{ display: 'block', margin: '10px auto', padding: '10px', width: '300px' }}
      />
      <button
        onClick={handleLogin}
        style={{ padding: '10px 20px', background: 'blue', color: 'white', border: 'none' }}
      >
        Login
      </button>
    </div>
  );
}

export default Login;