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
const { protect } = require('../../../../shared/middleware/auth');
const { projectValidation, updateProjectValidation } = require('../../../../shared/middleware/validator');

// all routes require auth
router.use(protect);

// projects routes
router.route('/')
  .get(getProjects)
  .post(projectValidation, createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProjectValidation, updateProject)
  .delete(deleteProject);

router.put('/:id/archive', toggleArchive);
router.post('/:id/collaborators', addCollaborator);
router.get('/:id/stats', getProjectStats);

module.exports = router;