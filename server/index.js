const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();
const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['teacher', 'parent', 'student', 'admin'], required: true },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
});

// School Schema
const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  settings: { type: String },
});

// Student Schema
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

// Report Schema
const reportSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  grade: { type: String },
  attendance: { type: Boolean },
  comments: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Announcement Schema
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const School = mongoose.model('School', schoolSchema);
const Student = mongoose.model('Student', studentSchema);
const Report = mongoose.model('Report', reportSchema);
const Announcement = mongoose.model('Announcement', announcementSchema);

// Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json({ userId: user._id, role: user.role, school: user.school });
});

// Get Announcements (Public)
app.get('/api/announcements', async (req, res) => {
  const announcements = await Announcement.find().populate('school');
  res.json(announcements);
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));