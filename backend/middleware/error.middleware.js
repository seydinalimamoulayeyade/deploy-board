const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err.name === 'CastError')
    error = new ApiError(400, 'Resource not found');

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new ApiError(400, `Duplicate value for field: ${field}`);
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new ApiError(400, messages.join('. '));
  }

  // Erreur Jenkins API (axios)
  if (err.response) {
    const status = err.response.status;
    const message = status === 401
      ? 'Jenkins authentication failed — check JENKINS_USER and JENKINS_TOKEN'
      : `Jenkins API error: ${status}`;
    error = new ApiError(status, message);
  }

  const statusCode = error.statusCode || 500;
  const message    = error.isOperational ? error.message : 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${statusCode}] ${message}`);
  }

  res.status(statusCode).json({ status: error.status || 'error', message });
};

module.exports = errorHandler;