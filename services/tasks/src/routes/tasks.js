const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  updatePosition,
  getMyTasks
} = require('../controllers/taskController');
const { protect } = require('../../../../shared/middleware/auth');
const { taskValidation, commentValidation, updateTaskValidation } = require('../../../../shared/middleware/validator');

// all routes require authentication
router.use(protect);

// user task routes
router.get('/my-tasks', getMyTasks);

// individual task routes
router.route('/:id')
  .get(getTask)
  .put(updateTaskValidation, updateTask)
  .delete(deleteTask);

router.post('/:id/comments', commentValidation, addComment);
router.put('/:id/position', updatePosition);

module.exports = router;