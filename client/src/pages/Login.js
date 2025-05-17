import React, { useState, useContext } from 'react';
import { AuthContext } from '../components/Auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    try {
      setError(''); // Clear previous errors
      await login(email, password);
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>ClassCore Login</h1>
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