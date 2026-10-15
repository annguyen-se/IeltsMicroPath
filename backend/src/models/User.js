const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserProfileSchema = new mongoose.Schema({
  targetBand: {
    type: Number,
    min: [4.0, 'Target band must be at least 4.0'],
    max: [9.0, 'Target band cannot exceed 9.0']
  },
  currentLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 4
  },
  dailyTimeBudget: {
    type: Number,
    default: 30,
    min: [10, 'Daily budget must be at least 10 minutes'],
    max: [120, 'Daily budget cannot exceed 120 minutes']
  },
  streak: {
    type: Number,
    default: 0,
    min: 0
  },
  lastActiveDate: {
    type: Date,
    default: Date.now
  },
  masteredNodeIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }]
}, { _id: false });

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Do not return password by default in queries
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'admin' // Personal pet project: default admin access
  },
  profile: {
    type: UserProfileSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

// Pre-save hook: Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: Verify password match
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
