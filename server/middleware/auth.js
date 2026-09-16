const jwt = require('jsonwebtoken');
const User = require('../models/User');

/* middleware to protect routes requiring authentication */
const protect = async (req, res, next) => {
  try {
    let token;

    // checks if the token is present in the headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // checks if the token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Token not provided.'
      });
    }

    // verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // find the user by the token id
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

    // adds the user to req for use in controllers
    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication middleware error:', error);
    
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

/* optional authentication middleware - continues without error if there is no token */
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
    // in case of error, simply continue without authenticating the user
    next();
  }
};

module.exports = {
  protect,
  authorize,
  optionalAuth
};