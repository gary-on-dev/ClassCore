import React, { createContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const login = async (email, password) => {
    const response = await axios.post('http://localhost:5000/api/login', { email, password });
    if (!response.data || !response.data.userId) {
      throw new Error('Invalid response from server');
    }
    setUser(response.data);
    navigate(`/${response.data.role}`);
  };

  const logout = () => {
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}