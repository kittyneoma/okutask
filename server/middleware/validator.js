const { body, validationResult } = require('express-validator');

/* middleware to validate results */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

/* validations 4 user registration */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('The name is required')
    .isLength({ min: 2, max: 50 }).withMessage('The name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('The email is required')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('The password is required')
    .isLength({ min: 8 }).withMessage('The password must be at least 8 characters long')
    .matches(/\d/).withMessage('The password must contain at least one number'),
  
  validate
];

/* validations 4 login */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('The email is required')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('The password is required'),
  
  validate
];

/* validations 4 project */
const projectValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('The project name is required')
    .isLength({ min: 3, max: 100 }).withMessage('The name must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('The description must not exceed 500 characters'),
  
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Color must be a valid hexadecimal code'),
  
  body('status')
    .optional()
    .isIn(['active', 'completed', 'archived', 'on-hold']).withMessage('Invalid status'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  validate
];

/* validations 4 task */
const taskValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('The task title is required')
    .isLength({ min: 3, max: 200 }).withMessage('The title must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('The description must not exceed 1000 characters'),
  
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'completed', 'blocked']).withMessage('Invalid status'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 }).withMessage('The estimated hours must be a positive number'),
  
  validate
];

/* validation 4 comment */
const commentValidation = [
  body('text')
    .trim()
    .notEmpty().withMessage('The comment cannot be empty')
    .isLength({ max: 500 }).withMessage('The comment must not exceed 500 characters'),
  
  validate
];

/* validations 2 update project */
const updateProjectValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('The project name cannot be empty')
    .isLength({ min: 3, max: 100 }).withMessage('The name must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('The description must not exceed 500 characters'),
  
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Color must be a valid hexadecimal code'),
  
  body('status')
    .optional()
    .isIn(['active', 'completed', 'archived', 'on-hold']).withMessage('Invalid status'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  validate
];

/* validations 2 update tasks */
const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('The task title cannot be empty')
    .isLength({ min: 3, max: 200 }).withMessage('The title must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('The description must not exceed 1000 characters'),
  
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'completed', 'blocked']).withMessage('Invalid status'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 }).withMessage('The estimated hours must be a positive number'),
  
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  projectValidation,
  taskValidation,
  commentValidation,
  updateProjectValidation,
  updateTaskValidation
};