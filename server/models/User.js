const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'teacher', 'parent', 'student'] },
  school: { type: mongoose.Schema.Types.ObjectId, required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }, // Optional for teachers/students
  stream: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream' }, // Optional for teachers/students
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);