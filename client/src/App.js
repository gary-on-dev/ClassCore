import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './components/Auth'; // Use AuthProvider
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Teacher from './pages/Teacher';
import Parent from './pages/Parent';
import Student from './pages/Student';
import Announcements from './pages/Announcements';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/teacher" element={<Teacher />} />
          <Route path="/parent" element={<Parent />} />
          <Route path="/student" element={<Student />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;