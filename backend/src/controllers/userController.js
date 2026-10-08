const authService = require('../services/authService');
const { sendSuccess } = require('../utils/apiResponse');

const getProfile = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user._id);
    return sendSuccess(res, 200, { profile }, 'User profile retrieved');
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const updated = await authService.updateProfile(req.user._id, req.body);
    return sendSuccess(res, 200, { user: updated }, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile
};
