import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/Auth';
import Login from './pages/Login';
import Teacher from './pages/Teacher';
import Parent from './pages/Parent';
import Student from './pages/Student';
import Admin from './pages/Admin';
import Announcements from './pages/Announcements';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/teacher" element={<Teacher />} />
          <Route path="/parent" element={<Parent />} />
          <Route path="/student" element={<Student />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/announcements" element={<Announcements />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;