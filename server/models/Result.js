const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: ['exam', 'attendance', 'comment'] },
  subject: { 
    type: String, 
    required: function() { return this.type === 'exam'; }
  },
  score: { 
    type: Number, 
    required: function() { return this.type === 'exam'; }
  },
  examType: { 
    type: String, 
    enum: ['opening-term', 'mid-term', 'end-term'], 
    required: function() { return this.type === 'exam'; }
  },
  attendance: { 
    type: String, 
    required: function() { return this.type === 'attendance'; }
  },
  comment: { 
    type: String, 
    required: function() { return this.type === 'comment'; }
  },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  stream: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream', required: true },
  school: { type: mongoose.Schema.Types.ObjectId, required: true },
  teacher: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);