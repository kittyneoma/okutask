/* centralized error-handling middleware */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // error log 4 debugging
  console.error('Error:', err);

  // validation error 4 mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    error = {
      statusCode: 400,
      message: message
    };
  }

  // invalid id mongoose error
  if (err.name === 'CastError') {
    error = {
      statusCode: 400,
      message: 'Resource not found - Invalid ID'
    };
  }

  // duplicate error - code 11000
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = {
      statusCode: 400,
      message: `The ${field} already exists`
    };
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: 'Invalid token'
    };
  }

  // expired token error
  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: 'Token expired'
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/* middleware for routes not found */
const notFound = (req, res, next) => {
  const error = new Error(`Rute not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/* custom error class */
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = {
  errorHandler,
  notFound,
  ErrorResponse
};