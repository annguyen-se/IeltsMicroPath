const sendSuccess = (res, statusCode = 200, data = {}, message = 'Operation successful') => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

const sendError = (res, statusCode = 500, code = 'ERROR', message = 'An error occurred', details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  });
};

module.exports = {
  sendSuccess,
  sendError
};
