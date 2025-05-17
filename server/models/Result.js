const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  school: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ['exam', 'cat', 'attendance', 'comment'], required: true },
  subject: { type: String }, // For exam/cat (e.g., "Math")
  score: { type: Number }, // For exam/cat (0-100)
  attendance: { type: String, enum: ['present', 'absent', 'excused'] }, // For attendance
  comment: { type: String }, // For comment
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Result', resultSchema);