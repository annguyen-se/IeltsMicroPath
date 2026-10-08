const authService = require('../services/authService');
const { sendSuccess } = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const { email, password, targetBand, initialLevel } = req.body;
    const result = await authService.register({ email, password, targetBand, initialLevel });
    return sendSuccess(res, 201, result, 'User registered successfully');
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return sendSuccess(res, 200, result, 'Logged in successfully');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user._id);
    return sendSuccess(res, 200, { user: profile }, 'Current session profile');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe
};
