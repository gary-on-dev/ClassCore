const mongoose = require('mongoose');
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  school: { type: String, required: true },
  image: { type: String, default: '' },
  category: { type: String, default: 'announcement' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});
module.exports = mongoose.model('Announcement', announcementSchema);