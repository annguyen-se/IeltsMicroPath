const mongoose = require('mongoose');
const MediaSchema = require('./Media');

const LessonSchema = new mongoose.Schema({
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true
  },
  skill: {
    type: String,
    enum: ['phonetics', 'grammar', 'reading', 'listening', 'speaking', 'writing'],
    required: [true, 'Skill category is required']
  },
  contentType: {
    type: String,
    enum: ['theory', 'practice'],
    default: 'theory',
    index: true
  },
  level: {
    type: Number,
    required: [true, 'Level (0-4) is required'],
    min: 0,
    max: 4,
    index: true
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true
  },
  contentMarkdown: {
    type: String,
    default: ''
  },
  passage: {
    paragraphs: [{
      label: { type: String, trim: true },
      text: { type: String, trim: true }
    }]
  },
  vocabIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vocabulary',
    index: true
  }],
  vocabAnchors: [{
    vocabId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary', required: true },
    text: { type: String, trim: true, required: true },
    paragraphLabel: { type: String, trim: true, required: true }
  }],
  paraphrasePairs: [{
    vocabId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary', required: false },
    questionText: { type: String, trim: true, required: true },
    passageText: { type: String, trim: true, required: true },
    paragraphLabel: { type: String, trim: true, required: true }
  }],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  orderIndex: {
    type: Number,
    default: 0
  },
  media: {
    type: MediaSchema,
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
    index: true
  }
}, {
  timestamps: true
});

// Compound index for level queries
LessonSchema.index({ level: 1, status: 1 });

const Lesson = mongoose.model('Lesson', LessonSchema);

module.exports = Lesson;
