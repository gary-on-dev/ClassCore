const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const cors = require('cors');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Models
const User = mongoose.model('User', new mongoose.Schema({
  email: String,
  password: String,
  role: String,
  school: mongoose.Schema.Types.ObjectId,
}));

const School = mongoose.model('School', new mongoose.Schema({
  name: String,
  settings: String,
}));

const Student = mongoose.model('Student', new mongoose.Schema({
  name: String,
  school: mongoose.Schema.Types.ObjectId,
  parent: mongoose.Schema.Types.ObjectId,
}));

const Report = mongoose.model('Report', new mongoose.Schema({
  student: mongoose.Schema.Types.ObjectId,
  teacher: mongoose.Schema.Types.ObjectId,
  grade: String,
  attendance: Boolean,
  comments: String,
  createdAt: { type: Date, default: Date.now },
}));

const Announcement = mongoose.model('Announcement', new mongoose.Schema({
  title: String,
  content: String,
  school: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
}));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.get('/api/auth/check', (req, res) => {
  console.log('Checking auth status');
  // For now, return null (no session management yet)
  res.status(200).json(null);
});

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', { email });
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    console.log('Login successful:', { email, role: user.role, school: user.school });
    res.status(200).json({
      userId: user._id.toString(),
      role: user.role,
      school: user.school.toString(),
    });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
// Get Students
app.get('/api/students', async (req, res) => {
  try {
    const { school } = req.query;
    const students = await Student.find({ school }).select('name _id');
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Reports
app.get('/api/reports', async (req, res) => {
  try {
    const { userId, role } = req.query;
    console.log('Fetching reports for:', { userId, role });
    if (!userId || !role) {
      return res.status(400).json({ error: 'User ID and role are required' });
    }
    if (role !== 'parent' && role !== 'student') {
      return res.status(400).json({ error: 'Invalid role' });
    }
    let student;
    if (role === 'parent') {
      student = await Student.findOne({ parent: userId });
    } else if (role === 'student') {
      student = await Student.findOne({ _id: userId });
    }
    if (!student) {
      console.log('No student found for:', { userId, role });
      return res.json([]);
    }
    const reports = await Report.find({ student: student._id });
    console.log('Reports found:', reports);
    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
// Add Report
app.post('/api/reports', async (req, res) => {
  try {
    const { student, teacher, grade, attendance, comments } = req.body;
    console.log('Report data received:', { student, teacher, grade, attendance, comments });
    if (!student || !teacher || !grade) {
      return res.status(400).json({ error: 'Student, teacher, and grade are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(student) || !mongoose.Types.ObjectId.isValid(teacher)) {
      return res.status(400).json({ error: 'Invalid student or teacher ID' });
    }
    const studentExists = await Student.findById(student);
    const teacherExists = await User.findById(teacher);
    if (!studentExists) {
      return res.status(400).json({ error: 'Student not found' });
    }
    if (!teacherExists) {
      return res.status(400).json({ error: 'Teacher not found' });
    }
    const report = new Report({
      student,
      teacher,
      grade,
      attendance: attendance ?? false,
      comments: comments || '',
    });
    const savedReport = await report.save();
    console.log('Report saved:', savedReport);
    res.json({ message: 'Report added', report: savedReport });
  } catch (error) {
    console.error('Add report error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Add User
app.post('/api/users', async (req, res) => {
  try {
    const { email, password, role, school } = req.body;
    console.log('Adding user - Received payload:', { email, password, role, school });
    if (!email || !password || !role || !school) {
      console.log('Validation failed: Missing required fields', { email, password, role, school });
      return res.status(400).json({ error: 'Email, password, role, and school are required' });
    }
    if (!['teacher', 'parent', 'student', 'admin'].includes(role)) {
      console.log('Validation failed: Invalid role', { role });
      return res.status(400).json({ error: 'Invalid role' });
    }
    if (!mongoose.Types.ObjectId.isValid(school)) {
      console.log('Validation failed: Invalid school ID', { school });
      return res.status(400).json({ error: 'Invalid school ID' });
    }
    const schoolExists = await School.findById(school);
    if (!schoolExists) {
      console.log('School not found:', { school });
      return res.status(400).json({ error: 'School not found' });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('User already exists:', { email });
      return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, role, school });
    const savedUser = await user.save();
    console.log('User saved successfully:', savedUser);
    console.log('Sending response: { message: "User added", user }');
    return res.status(200).json({ message: 'User added', user: savedUser });
  } catch (error) {
    console.error('Add user error:', error.message, error.stack);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Add Announcement
app.post('/api/announcements', async (req, res) => {
  try {
    const { title, content, school } = req.body;
    console.log('Adding announcement - Received payload:', { title, content, school });
    if (!title || !content || !school) {
      console.log('Validation failed: Missing required fields', { title, content, school });
      return res.status(400).json({ error: 'Title, content, and school are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(school)) {
      console.log('Validation failed: Invalid school ID', { school });
      return res.status(400).json({ error: 'Invalid school ID' });
    }
    const schoolExists = await School.findById(school);
    if (!schoolExists) {
      console.log('School not found:', { school });
      return res.status(400).json({ error: 'School not found' });
    }
    const announcement = new Announcement({ title, content, school });
    const savedAnnouncement = await announcement.save();
    console.log('Announcement saved successfully:', savedAnnouncement);
    console.log('Sending response: { message: "Announcement added", announcement }');
    return res.status(200).json({ message: 'Announcement added', announcement: savedAnnouncement });
  } catch (error) {
    console.error('Add announcement error:', error.message, error.stack);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get Announcements
app.get('/api/announcements', async (req, res) => {
  try {
    const school = req.query.school || '6826c6741e8bb0ac59a1bea9'; // Default school if not provided
    console.log('Fetching announcements for school:', school);
    if (!mongoose.Types.ObjectId.isValid(school)) {
      console.log('Invalid school ID:', school);
      return res.status(400).json({ error: 'Invalid school ID' });
    }
    const announcements = await Announcement.find({ school }).sort({ createdAt: -1 });
    console.log('Announcements fetched:', announcements.length);
    return res.status(200).json(announcements);
  } catch (error) {
    console.error('Fetch announcements error:', error.message, error.stack);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));