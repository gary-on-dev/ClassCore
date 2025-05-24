const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Announcement = require('./models/Announcement');
const Result = require('./models/Result');
const Class = require('./models/Class');
const Stream = require('./models/Stream');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG or PNG images are allowed'));
    }
  },
});

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

// Middleware to verify JWT
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

// Class routes
app.post('/api/classes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, school } = req.body;
    console.log('Creating class:', { name, school });
    if (!name || !school) {
      return res.status(400).json({ error: 'Name and school are required' });
    }
    const classDoc = new Class({ name, school });
    await classDoc.save();
    console.log('Class created:', classDoc);
    res.status(201).json(classDoc);
  } catch (error) {
    console.error('Create class error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/classes', authMiddleware, async (req, res) => {
  try {
    const { school } = req.query;
    console.log('Fetching classes:', { school });
    if (!school) {
      return res.status(400).json({ error: 'School ID required' });
    }
    const classes = await Class.find({ school });
    console.log('Classes fetched:', classes.length);
    res.status(200).json(classes);
  } catch (error) {
    console.error('Fetch classes error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Stream routes
app.post('/api/streams', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, class: classId, school } = req.body;
    console.log('Creating stream:', { name, classId, school });
    if (!name || !classId || !school) {
      return res.status(400).json({ error: 'Name, class, and school are required' });
    }
    const stream = new Stream({ name, class: classId, school });
    await stream.save();
    console.log('Stream created:', stream);
    res.status(201).json(stream);
  } catch (error) {
    console.error('Create stream error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/streams', authMiddleware, async (req, res) => {
  try {
    const { school, class: classId } = req.query;
    console.log('Fetching streams:', { school, classId });
    if (!school) {
      return res.status(400).json({ error: 'School ID required' });
    }
    const query = { school };
    if (classId) query.class = classId;
    const streams = await Stream.find(query);
    console.log('Streams fetched:', streams.length);
    res.status(200).json(streams);
  } catch (error) {
    console.error('Fetch streams error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// User routes
app.post('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { email, password, role, school, class: classId, stream } = req.body;
    console.log('Adding user:', { email, role, school, classId, stream });
    if (!email || !password || !role || !school) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, role, school, class: classId, stream });
    await user.save();
    console.log('User created:', user);
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get student and teacher counts (overall, per class, per stream)
app.get('/api/users/count', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { school } = req.query;
    console.log('Fetching counts:', { school });
    if (!school) {
      return res.status(400).json({ error: 'School ID required' });
    }
    // Student counts
    const totalStudents = await User.countDocuments({ school, role: 'student' });
    const studentClassCounts = await User.aggregate([
      { $match: { school: new mongoose.Types.ObjectId(school), role: 'student' } },
      { $group: { _id: '$class', count: { $sum: 1 } } },
      { $lookup: { from: 'classes', localField: '_id', foreignField: '_id', as: 'class' } },
      { $unwind: '$class' },
      { $project: { classId: '$_id', className: '$class.name', count: 1 } },
    ]);
    const studentStreamCounts = await User.aggregate([
      { $match: { school: new mongoose.Types.ObjectId(school), role: 'student' } },
      { $group: { _id: '$stream', count: { $sum: 1 } } },
      { $lookup: { from: 'streams', localField: '_id', foreignField: '_id', as: 'stream' } },
      { $unwind: '$stream' },
      { $lookup: { from: 'classes', localField: 'stream.class', foreignField: '_id', as: 'class' } },
      { $unwind: '$class' },
      { $project: { streamId: '$_id', streamName: '$stream.name', className: '$class.name', count: 1 } },
    ]);
    // Teacher counts
    const totalTeachers = await User.countDocuments({ school, role: 'teacher' });
    const teacherClassCounts = await User.aggregate([
      { $match: { school: new mongoose.Types.ObjectId(school), role: 'teacher' } },
      { $group: { _id: '$class', count: { $sum: 1 } } },
      { $lookup: { from: 'classes', localField: '_id', foreignField: '_id', as: 'class' } },
      { $unwind: '$class' },
      { $project: { classId: '$_id', className: '$class.name', count: 1 } },
    ]);
    const teacherStreamCounts = await User.aggregate([
      { $match: { school: new mongoose.Types.ObjectId(school), role: 'teacher' } },
      { $group: { _id: '$stream', count: { $sum: 1 } } },
      { $lookup: { from: 'streams', localField: '_id', foreignField: '_id', as: 'stream' } },
      { $unwind: '$stream' },
      { $lookup: { from: 'classes', localField: 'stream.class', foreignField: '_id', as: 'class' } },
      { $unwind: '$class' },
      { $project: { streamId: '$_id', streamName: '$stream.name', className: '$class.name', count: 1 } },
    ]);
    console.log('Counts fetched:', { totalStudents, totalTeachers });
    res.status(200).json({
      totalStudents,
      studentClassCounts,
      studentStreamCounts,
      totalTeachers,
      teacherClassCounts,
      teacherStreamCounts,
    });
  } catch (error) {
    console.error('Counts error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get all users for a school
app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { school } = req.query;
    console.log('Fetching users for school:', school);
    if (!school) {
      return res.status(400).json({ error: 'School ID required' });
    }
    const users = await User.find({ school })
      .populate('class', 'name')
      .populate('stream', 'name');
    console.log('Users fetched:', users.length);
    res.status(200).json(users);
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update user
app.put('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, role, class: classId, stream, school } = req.body;
    console.log('Updating user:', { id, email, role, classId, stream });
    const updateData = { email, role };
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (classId) updateData.class = classId;
    else updateData.class = null;
    if (stream) updateData.stream = stream;
    else updateData.stream = null;
    if (school) updateData.school = school;
    const user = await User.findByIdAndUpdate(id, updateData, { new: true })
      .populate('class', 'name')
      .populate('stream', 'name');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('User updated:', user.email);
    res.status(200).json(user);
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Delete user
app.delete('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting user:', id);
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('User deleted:', user.email);
    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error.message);
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
      { userId: user._id, email: user.email, role: user.role, school: user.school, class: user.class, stream: user.stream },
      'secret',
      { expiresIn: '24h' }
    );
    console.log('Login successful:', { email, role: user.role, token: token.slice(0, 10) + '...' });
    res.json({
      token,
      user: { userId: user._id, email: user.email, role: user.role, school: user.school, class: user.class, stream: user.stream },
    });
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
    if (!title || !content || !school) {
      return res.status(400).json({ error: 'Missing required fields: title, content, school' });
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

app.get('/api/announcements', async (req, res) => {
  try {
    const { school } = req.query;
    console.log('Fetching announcements:', { school });
    if (!school) {
      return res.status(400).json({ error: 'School ID required' });
    }
    const announcements = await Announcement.find({ school });
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
    if (!title || !content || !school) {
      return res.status(400).json({ error: 'Missing required fields: title, content, school' });
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
    console.error('Delete announcement error:', error.message, error.stack);
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
    res.status(400).json({ error: 'Failed to upload image', details: error.message });
  }
});

// Result routes
app.post('/api/results', authMiddleware, async (req, res) => {
  try {
    const { student, type, subject, score, examType, attendance, comment, school, class: classId, stream } = req.body;
    console.log('Creating result:', { student, type, subject, score, examType, classId, stream });
    if (!mongoose.Types.ObjectId.isValid(student) || !mongoose.Types.ObjectId.isValid(school) || !mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(stream)) {
      return res.status(400).json({ error: 'Invalid student, school, class, or stream ID' });
    }
    if (type === 'exam' && (!subject || !score || !examType)) {
      return res.status(400).json({ error: 'Subject, score, and examType are required for exam results' });
    }
    if (type === 'attendance' && !attendance) {
      return res.status(400).json({ error: 'Attendance is required for attendance results' });
    }
    if (type === 'comment' && !comment) {
      return res.status(400).json({ error: 'Comment is required for comment results' });
    }
    const result = new Result({
      student,
      type,
      subject,
      score,
      examType,
      attendance,
      comment,
      class: classId,
      stream,
      school,
      teacher: req.user.email,
    });
    await result.save();
    console.log('Result created:', result);
    res.status(201).json(result);
  } catch (error) {
    console.error('Create result error:', error.message, error.stack);
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: 'Validation failed', details: error.message });
    } else if (error.code === 11000) {
      res.status(400).json({ error: 'Subject already exists for this student' });
    } else {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
});

app.get('/api/results', authMiddleware, async (req, res) => {
  try {
    const { student, school, class: classId, stream } = req.query;
    console.log('Fetching results:', { student, school, classId, stream });
    if (!mongoose.Types.ObjectId.isValid(school)) {
      return res.status(400).json({ error: 'Invalid school ID' });
    }
    const query = { school };
    if (student && mongoose.Types.ObjectId.isValid(student)) {
      query.student = student;
    }
    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      query.class = classId;
    }
    if (stream && mongoose.Types.ObjectId.isValid(stream)) {
      query.stream = stream;
    }
    const results = await Result.find(query).populate('student', 'email').populate('class', 'name').populate('stream', 'name');
    console.log('Results fetched:', results.length);
    res.status(200).json(results);
  } catch (error) {
    console.error('Fetch results error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.put('/api/results/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { student, type, subject, score, examType, attendance, comment, school, class: classId, stream } = req.body;
    console.log('Updating result:', { id, student, type, subject, score, examType });
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid result ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(student) || !mongoose.Types.ObjectId.isValid(school) || !mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(stream)) {
      return res.status(400).json({ error: 'Invalid student, school, class, or stream ID' });
    }
    if (type === 'exam' && (!subject || !score || !examType)) {
      return res.status(400).json({ error: 'Subject, score, and examType are required for exam results' });
    }
    if (type === 'attendance' && !attendance) {
      return res.status(400).json({ error: 'Attendance is required for attendance results' });
    }
    if (type === 'comment' && !comment) {
      return res.status(400).json({ error: 'Comment is required for comment results' });
    }
    const result = await Result.findByIdAndUpdate(
      id,
      { student, type, subject, score, examType, attendance, comment, class: classId, stream, school, teacher: req.user.email, updatedAt: new Date() },
      { new: true }
    );
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }
    console.log('Result updated:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Update result error:', error.message, error.stack);
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: 'Validation failed', details: error.message });
    } else {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
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