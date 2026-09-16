const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  toggleArchive,
  addCollaborator,
  getProjectStats
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { projectValidation } = require('../middleware/validator');

// all routes require authentication
router.use(protect);

// project routes
router.route('/')
  .get(getProjects)
  .post(projectValidation, createProject);

router.route('/:id')
  .get(getProject)
  .put(projectValidation, updateProject)
  .delete(deleteProject);

router.put('/:id/archive', toggleArchive);
router.post('/:id/collaborators', addCollaborator);
router.get('/:id/stats', getProjectStats);

module.exports = router;