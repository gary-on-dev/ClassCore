import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './components/Auth';
import ProtectedRoute from './components/ProtectedRoute';
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
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <Teacher />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute allowedRoles={['parent', 'student', 'admin']}>
                <Results />
              </ProtectedRoute>
            }
          />
          <Route path="/announcements" element={<Announcements />} />
          <Route
            path="/login"
            element={
              <ProtectedRoute allowedRoles={[]}>
                <Login />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;