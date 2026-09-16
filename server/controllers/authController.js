const User = require('../models/User');
const jwt = require('jsonwebtoken');

/* generates JWT token */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

/**
 * @desc    registers new users
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // verifies if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered'
      });
    }

    // creates user
    const user = await User.create({
      name,
      email,
      password
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.getAvatarUrl(),
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    user login
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // searches user w password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // verifies password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // verifies if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Deactivated account'
      });
    }

    // updates last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Successful login',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.getAvatarUrl(),
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    gets current user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('projectCount');

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.getAvatarUrl(),
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    updates user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, avatar } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // updates fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.getAvatarUrl(),
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    changes password
 * @route   PUT /api/auth/password
 * @access  Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // verifies current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // updates password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    logout - invalidates token on the client side
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};