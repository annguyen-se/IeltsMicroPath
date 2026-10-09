const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const env = require('../config/env');

const signToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
};

const register = async ({ email, password, targetBand, initialLevel }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email is already registered', 409, 'EMAIL_EXISTS');
  }

  const user = await User.create({
    email,
    password,
    profile: {
      targetBand: targetBand ? Number(targetBand) : undefined,
      currentLevel: initialLevel !== undefined ? Number(initialLevel) : 0
    }
  });

  const token = signToken(user._id, user.role);

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile
    }
  };
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400, 'MISSING_CREDENTIALS');
  }

  // Explicitly select password field
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Incorrect email or password', 401, 'INVALID_CREDENTIALS');
  }

  const token = signToken(user._id, user.role);

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile
    }
  };
};

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return {
    id: user._id,
    email: user.email,
    role: user.role,
    profile: user.profile,
    createdAt: user.createdAt
  };
};

const updateProfile = async (userId, updates) => {
  const allowedFields = ['targetBand', 'dailyTimeBudget', 'currentLevel'];
  const profileUpdates = {};

  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key)) {
      profileUpdates[`profile.${key}`] = updates[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: profileUpdates },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return {
    id: user._id,
    email: user.email,
    role: user.role,
    profile: user.profile
  };
};

module.exports = {
  signToken,
  register,
  login,
  getProfile,
  updateProfile
};
