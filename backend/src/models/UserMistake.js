const mongoose = require('mongoose');

const UserMistakeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  errorCode: {
    type: String,
    enum: ['ERR_LEX', 'ERR_PHO', 'ERR_SYN', 'ERR_DIS', 'ERR_LOG'],
    required: true
  },
  userWrongAnswer: {
    type: String,
    required: true,
    trim: true
  },
  isResolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for querying active unresolved mistakes
UserMistakeSchema.index({ userId: 1, isResolved: 1 });

const UserMistake = mongoose.model('UserMistake', UserMistakeSchema);

module.exports = UserMistake;
