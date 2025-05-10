import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Announcements from './pages/Announcements';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/announcements" element={<Announcements />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;