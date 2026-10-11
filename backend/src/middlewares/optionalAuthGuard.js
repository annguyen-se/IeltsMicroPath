const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

const optionalAuthGuard = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, env.jwtSecret);
        const currentUser = await User.findById(decoded.userId);
        if (currentUser) {
          req.user = currentUser;
        }
      } catch (_) {
        // Ignore invalid token in optional auth
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = optionalAuthGuard;
