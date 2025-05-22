const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  subject: { type: String, required: true },
  score: { type: Number, required: true },
  attendance: { type: String },
  comment: { type: String },
  school: { type: String, required: true },
}, { unique: ['student', 'subject'] });

module.exports = mongoose.model('Result', resultSchema);