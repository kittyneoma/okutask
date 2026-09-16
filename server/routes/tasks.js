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
const { protect } = require('../middleware/auth');
const { taskValidation, commentValidation } = require('../middleware/validator');

//al routes require authentication
router.use(protect);

// task routes of user
router.get('/my-tasks', getMyTasks);

// individual task routes
router.route('/:id')
  .get(getTask)
  .put(taskValidation, updateTask)
  .delete(deleteTask);

router.post('/:id/comments', commentValidation, addComment);
router.put('/:id/position', updatePosition);

module.exports = router;