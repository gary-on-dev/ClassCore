const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Announcement = require('./models/Announcement');
const Result = require('./models/Result');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dtyykcmcb',
  api_key: '333817796769685',
  api_secret: 'E3kY565lKcgHtJT0i4bUz8k1x-Y',
});

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
    process.exit(1);
  }
};
connectToMongoDB();

// Middleware to verify JWT and role
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('authMiddleware: Received token:', token ? token.slice(0, 10) + '...' : 'None');
  if (!token) {
    console.log('authMiddleware: No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, 'secret');
    console.log('authMiddleware: Decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('authMiddleware: Token verification error:', error.message, error.stack);
    res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};

// Middleware to restrict to admins
const adminMiddleware = (req, res, next) => {
  console.log('adminMiddleware: User role:', req.user.role);
  if (req.user.role !== 'admin') {
    console.log('adminMiddleware: Access denied, role:', req.user.role);
    return res.status(403).json({ error: 'Access denied: Admins only' });
  }
  next();
};

// User routes
app.post('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
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
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, school: user.school },
      'secret',
      { expiresIn: '24h' } // Extended to 24 hours
    );
    console.log('Login successful:', { email, role: user.role, token: token.slice(0, 10) + '...' });
    res.json({ token, user: { userId: user._id, email: user.email, role: user.role, school: user.school } });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Announcement routes
app.post('/api/announcements', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, content, school, image, category } = req.body;
    console.log('Creating announcement:', { title, school, category });
    if (!mongoose.Types.ObjectId.isValid(school)) {
      return res.status(400).json({ error: 'Invalid school ID' });
    }
    const announcement = new Announcement({
      title,
      content,
      school,
      image: image || '',
      category: category || 'announcement',
      createdAt: new Date(),
    });
    await announcement.save();
    console.log('Announcement created:', announcement);
    res.status(201).json(announcement);
  } catch (error) {
    console.error('Create announcement error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/announcements', authMiddleware, async (req, res) => {
  try {
    const { school } = req.query;
    console.log('Fetching announcements:', { school });
    const announcements = await Announcement.find();
    console.log('Announcements fetched:', announcements.length, announcements);
    res.status(200).json(announcements);
  } catch (error) {
    console.error('Fetch announcements error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.put('/api/announcements/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, image, category, school } = req.body;
    console.log('Updating announcement:', { id, title, category });
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid announcement ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(school)) {
      return res.status(400).json({ error: 'Invalid school ID' });
    }
    const announcement = await Announcement.findByIdAndUpdate(
      id,
      { title, content, image: image || '', category: category || 'announcement', school, updatedAt: new Date() },
      { new: true }
    );
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    console.log('Announcement updated:', announcement);
    res.status(200).json(announcement);
  } catch (error) {
    console.error('Update announcement error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.delete('/api/announcements/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting announcement:', id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid announcement ID' });
    }
    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    console.log('Announcement deleted:', announcement);
    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Create announcement error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Image Upload Route
app.post('/api/upload-image', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    console.log('Uploading image:', req.file ? req.file.originalname : 'No file');
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { upload_preset: 'announcement_uploads', folder: 'announcements' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      ).end(req.file.buffer);
    });
    console.log('Image uploaded to Cloudinary:', result.secure_url);
    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error('Image upload error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to upload image', details: error.message });
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

app.get('/api/results', authMiddleware, async (req, res) => {
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