const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['audio', 'video', 'image'],
    required: true
  },
  provider: {
    type: String,
    enum: ['youtube', 'vimeo', 'cloudinary', 'external', 'self-hosted'],
    default: 'external'
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  embedUrl: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    default: 0 // Duration in seconds for audio/video
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  credit: {
    type: String,
    trim: true
  },
  sourceUrl: {
    type: String,
    trim: true
  },
  lastCheckedAt: {
    type: Date,
    default: null
  }
}, { _id: false }); // Disable _id to save 12 bytes per subdocument

module.exports = MediaSchema;
