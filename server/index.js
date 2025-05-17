const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Announcement = require('./models/Announcement');
const Result = require('./models/Result');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const connectToMongoDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://classcoreadmin:admin123@classcore.7i15uak.mongodb.net/?retryWrites=true&w=majority&appName=ClassCore', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if connection fails
  }
};
connectToMongoDB();

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// User routes
app.post('/api/users', async (req, res) => {
  try {
    const { email, password, role, school } = req.body;
    console.log('Adding user:', { email, role, school });
    if (!mongoose.Types.ObjectId.isValid(school)) {
      return res.status(400).json({ error: 'Invalid school ID' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, role, school });
    await user.save();
    console.log('User created:', user);
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.log('Login failed: Invalid credentials');
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role, school: user.school }, 'secret', { expiresIn: '1h' });
    console.log('Login successful:', { email, role: user.role });
    res.json({ token, user: { userId: user._id, email: user.email, role: user.role, school: user.school } });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Announcement routes
app.post('/api/announcements', authMiddleware, async (req, res) => {
  try {
    const { title, content, school } = req.body;
    console.log('Creating announcement:', { title, school });
    if (!mongoose.Types.ObjectId.isValid(school)) {
      return res.status(400).json({ error: 'Invalid school ID' });
    }
    const announcement = new Announcement({ title, content, school });
    await announcement.save();
    console.log('Announcement created:', announcement);
    res.status(201).json(announcement);
  } catch (error) {
    console.error('Create announcement error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/announcements', async (req, res) => {
  try {
    const { school } = req.query;
    console.log('Fetching announcements:', { school });
    if (!mongoose.Types.ObjectId.isValid(school)) {
      return res.status(400).json({ error: 'Invalid school ID' });
    }
    const announcements = await Announcement.find({ school });
    console.log('Announcements fetched:', announcements.length);
    res.status(200).json(announcements);
  } catch (error) {
    console.error('Fetch announcements error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Result routes
app.post('/api/results', authMiddleware, async (req, res) => {
  try {
    const { student, type, subject, score, attendance, comment, school } = req.body;
    console.log('Creating result:', { student, type, subject, score, school });
    if (!mongoose.Types.ObjectId.isValid(student) || !mongoose.Types.ObjectId.isValid(school)) {
      return res.status(400).json({ error: 'Invalid student or school ID' });
    }
    const result = new Result({ student, type, subject, score, attendance, comment, school });
    await result.save();
    console.log('Result created:', result);
    res.status(201).json(result);
  } catch (error) {
    console.error('Create result error:', error.message, error.stack);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Subject already exists for this student' });
    } else {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
});

app.get('/api/results', async (req, res) => {
  try {
    const { student, school } = req.query;
    console.log('Fetching results:', { student, school });
    if (!mongoose.Types.ObjectId.isValid(school)) {
      return res.status(400).json({ error: 'Invalid school ID' });
    }
    const query = { school };
    if (student && mongoose.Types.ObjectId.isValid(student)) {
      query.student = student;
    }
    const results = await Result.find(query).populate('student', 'email');
    console.log('Results fetched:', results.length);
    res.status(200).json(results);
  } catch (error) {
    console.error('Fetch results error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.delete('/api/results/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting result:', id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid result ID' });
    }
    const result = await Result.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }
    console.log('Result deleted:', result);
    res.status(200).json({ message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Delete result error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));