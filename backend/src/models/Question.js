const mongoose = require('mongoose');
const MediaSchema = require('./Media');

const QuestionSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: [true, 'Lesson reference is required'],
    index: true
  },
  vocabId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vocabulary',
    default: null
  },
  type: {
    type: String,
    enum: ['cloze', 'choice', 'dictation', 'reorder'],
    required: [true, 'Question type is required']
  },
  prompt: {
    type: String,
    required: [true, 'Question prompt is required'],
    trim: true
  },
  options: [{
    type: String,
    trim: true
  }],
  correctAnswer: {
    type: String,
    required: [true, 'Correct answer is required'],
    trim: true
  },
  explanation: {
    type: String,
    required: [true, 'Pedagogical explanation is required'],
    trim: true
  },
  errorTaxonomy: {
    type: String,
    enum: ['ERR_LEX', 'ERR_PHO', 'ERR_SYN', 'ERR_DIS', 'ERR_LOG'],
    default: 'ERR_LEX'
  },
  media: {
    type: MediaSchema,
    default: null
  }
}, {
  timestamps: true
});

const Question = mongoose.model('Question', QuestionSchema);

module.exports = Question;
