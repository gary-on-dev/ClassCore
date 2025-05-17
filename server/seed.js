const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

async function seed() {
  try {
    await User.deleteMany({});
    await School.deleteMany({});
    await Student.deleteMany({});

    const school = await new School({ name: 'Test School', settings: 'default' }).save();
    const hashedPassword = await bcrypt.hash('test123', 10);
    const users = await User.insertMany([
      { email: 'teacher@test.com', password: hashedPassword, role: 'teacher', school: school._id },
      { email: 'parent@test.com', password: hashedPassword, role: 'parent', school: school._id },
      { email: 'student@test.com', password: hashedPassword, role: 'student', school: school._id },
      { email: 'admin@test.com', password: hashedPassword, role: 'admin', school: school._id },
    ]);
    const parent = users.find(u => u.email === 'parent@test.com');
    const studentUser = users.find(u => u.email === 'student@test.com');
    await new Student({ _id: studentUser._id, name: 'John Doe', school: school._id, parent: parent._id }).save();
    console.log('Sample data added');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    mongoose.connection.close();
  }
}
seed();