const AppError = require('../utils/appError');
const { sendError } = require('../utils/apiResponse');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.code = err.code || 'SERVER_ERROR';

  // Log server errors
  if (error.statusCode === 500) {
    console.error('[Error 500]', err);
  }

  // Mongoose CastError (Bad ObjectId)
  if (err.name === 'CastError') {
    error = new AppError(`Resource not found with id ${err.value}`, 404, 'RESOURCE_NOT_FOUND');
  }

  // Mongoose Duplicate Key (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new AppError(`Duplicate value entered for ${field}`, 409, 'DUPLICATE_ENTRY');
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(val => val.message);
    error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token signature', 401, 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Session token expired', 401, 'TOKEN_EXPIRED');
  }

  return sendError(
    res,
    error.statusCode || 500,
    error.code || 'SERVER_ERROR',
    error.message || 'Internal Server Error',
    env.nodeEnv === 'development' ? (error.details || err.stack) : error.details
  );
};

module.exports = errorHandler;
