const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['exam', 'cat', 'attendance', 'comment'], required: true },
  subject: { type: String },
  score: { type: Number },
  attendance: { type: String, enum: ['present', 'absent', 'excused'] },
  comment: { type: String },
  school: { type: mongoose.Schema.Types.ObjectId, required: true },
}, { timestamps: true });

// Ensure unique subject per student for exam/cat
resultSchema.index({ student: 1, subject: 1, type: 1 }, { unique: true, partialFilterExpression: { type: { $in: ['exam', 'cat'] } } });

module.exports = mongoose.model('Result', resultSchema);