const express = require('express');
const router = express.Router({ mergeParams: true });
const { getTasks, createTask } = require('../controllers/taskController');
const { protect } = require('../../../../shared/middleware/auth');
const { taskValidation } = require('../../../../shared/middleware/validator');

// mount on server.js as /projects/:projectId/tasks
router.use(protect);

router.route('/')
  .get(getTasks)
  .post(taskValidation, createTask);

module.exports = router;