const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb+srv://classcoreadmin:admin123@classcore.7i15uak.mongodb.net/?retryWrites=true&w=majority&appName=ClassCore', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = mongoose.model('User', new mongoose.Schema({
  email: String,
  password: String,
  role: String,
  school: String, // Changed to String
}));

const School = mongoose.model('School', new mongoose.Schema({
  name: String,
  settings: String,
}));

const Student = mongoose.model('Student', new mongoose.Schema({
  name: String,
  school: String, // Changed to String
  parent: mongoose.Schema.Types.ObjectId,
}));

const Announcement = mongoose.model('Announcement', new mongoose.Schema({
  title: String,
  content: String,
  school: String, // Changed to String
  image: String,
  category: String,
  createdAt: Date,
  updatedAt: Date,
}));

async function seed() {
  try {
    await User.deleteMany({});
    await School.deleteMany({});
    await Student.deleteMany({});
    await Announcement.deleteMany({});

    const schoolId = '6826c6741e8bb0ac59a1bea9';
    await new School({ name: 'Test School', settings: 'default' }).save();
    const hashedPassword = await bcrypt.hash('test123', 10);
    const users = await User.insertMany([
      { email: 'teacher@test.com', password: hashedPassword, role: 'teacher', school: schoolId },
      { email: 'parent@test.com', password: hashedPassword, role: 'parent', school: schoolId },
      { email: 'student@test.com', password: hashedPassword, role: 'student', school: schoolId },
      { email: 'admin@test.com', password: hashedPassword, role: 'admin', school: schoolId },
    ]);
    const parent = users.find(u => u.email === 'parent@test.com');
    const studentUser = users.find(u => u.email === 'student@test.com');
    await new Student({ _id: studentUser._id, name: 'John Doe', school: schoolId, parent: parent._id }).save();
    await Announcement.insertMany([
      {
        title: 'Welcome Back',
        content: 'School starts next week!',
        school: schoolId,
        category: 'announcement',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Science Fair',
        content: 'Join us for the annual science fair.',
        school: schoolId,
        category: 'activity',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log('Sample data added');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    mongoose.connection.close();
  }
}
seed();