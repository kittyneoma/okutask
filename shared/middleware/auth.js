const jwt = require('jsonwebtoken');
const User = require('../models/User');

/* middleware to protect routes that require auth */
const protect = async (req, res, next) => {
  try {
    let token;

    // verifies if token comes in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // verifies if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Token not provided.'
      });
    }

    //verifies n decodes token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // searches user by token id
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Deactivated user account'
      });
    }

    // adds user to req 4 controllers 
    req.user = user;
    next();
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Authentication middleware error', error);
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error in authentication middleware'
    });
  }
};

/* middleware to verify specific roles */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' not authorized to access this resource`
      });
    }

    next();
  };
};

/* optional auth middleware - continues if no token */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  protect,
  authorize,
  optionalAuth
};