const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  lookupByEmail
} = require('../controllers/authController');
const { protect } = require('../../../../shared/middleware/auth');
const {
  registerValidation,
  loginValidation
} = require('../../../../shared/middleware/validator');

// public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// protected routes
router.get('/me', protect, getMe);
router.get('/users/lookup', protect, lookupByEmail);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.post('/logout', protect, logout);

module.exports = router;