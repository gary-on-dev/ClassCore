const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., Grade 1A
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  school: { type: mongoose.Schema.Types.ObjectId, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Stream', streamSchema);