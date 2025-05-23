import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './components/Auth';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Teacher from './pages/Teacher';
import Announcements from './pages/Announcements';
import Login from './pages/Login';
import Results from './pages/Results';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Notification />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/teacher" element={<Teacher />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/login" element={<Login />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;