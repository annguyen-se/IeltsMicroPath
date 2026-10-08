const mongoose = require('mongoose');
const MediaSchema = require('./Media');

const VocabularySchema = new mongoose.Schema({
  word: {
    type: String,
    required: [true, 'Word is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  ipa: {
    type: String,
    required: [true, 'IPA pronunciation is required'],
    trim: true
  },
  pos: {
    type: String,
    enum: ['noun', 'verb', 'adj', 'adv', 'phrase', 'prep', 'conj'],
    required: [true, 'Part of speech is required']
  },
  meaningVi: {
    type: String,
    required: [true, 'Vietnamese meaning is required'],
    trim: true
  },
  definitionEn: {
    type: String,
    trim: true
  },
  exampleSentence: {
    type: String,
    required: [true, 'Example sentence is required']
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    index: true
  },
  tier: {
    type: Number,
    enum: [1, 2, 3, 4],
    required: [true, 'Vocabulary tier is required'],
    index: true // 1: Oxford 500, 2: Oxford 3000, 3: AWL, 4: Advanced
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

// Compound index for querying active vocab by tier
VocabularySchema.index({ tier: 1, status: 1 });

const Vocabulary = mongoose.model('Vocabulary', VocabularySchema);

module.exports = Vocabulary;
