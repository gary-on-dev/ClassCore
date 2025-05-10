import React, { useState } from 'react';
import axios from 'axios';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        email,
        password,
      });
      console.log('Logged in:', response.data);
      // TODO: Redirect based on role
    } catch (error) {
      alert('Login failed: ' + error.response.data.error);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>ClassCore Login</h1>
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