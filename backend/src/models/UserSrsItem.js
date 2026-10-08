const mongoose = require('mongoose');

const UserSrsItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vocabId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vocabulary',
    required: true
  },
  box: {
    type: Number,
    min: 1,
    max: 5,
    default: 1
  },
  nextReviewDate: {
    type: Date,
    required: true,
    index: true
  },
  consecutiveCorrect: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound indexes for ultra-fast queue lookup & duplicate protection
UserSrsItemSchema.index({ userId: 1, nextReviewDate: 1 });
UserSrsItemSchema.index({ userId: 1, vocabId: 1 }, { unique: true });

const UserSrsItem = mongoose.model('UserSrsItem', UserSrsItemSchema);

module.exports = UserSrsItem;
