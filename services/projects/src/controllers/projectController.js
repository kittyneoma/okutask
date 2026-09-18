const { Project, Task } = require('../../../../shared/models');

/**
 * @desc    gets all project
 * @route   GET /projects
 * @access  Private
 */
exports.getProjects = async (req, res, next) => {
  try {
    const { status, priority, search } = req.query;

    let filters = {
      owner: req.user.id,
      isArchived: false
    };

    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    let projects = await Project.find(filters)
      .populate('collaborators', 'name email avatar')
      .sort({ createdAt: -1 });

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      projects = projects.filter(project =>
        searchRegex.test(project.name) ||
        searchRegex.test(project.description)
      );
    }

    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const progress = await project.calculateProgress();
        const taskCount = await Task.countDocuments({ project: project._id });
        return {
          ...project.toObject(),
          progress,
          taskCount
        };
      })
    );

    res.json({
      success: true,
      count: projectsWithProgress.length,
      data: { projects: projectsWithProgress }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    get project by id
 * @route   GET /projects/:id
 * @access  Private
 */
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('collaborators', 'name email avatar')
      .populate({ path: 'tasks', options: { sort: { position: 1 } } });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = project.owner.toString() === req.user.id;
    const isCollaborator = project.collaborators.some(
      (collab) => collab._id.toString() === req.user.id
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this project'
      });
    }

    const progress = await project.calculateProgress();
    const stats = await Task.getProjectStats(project._id);

    res.json({
      success: true,
      data: { project: { ...project.toObject(), progress, stats } }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    creates project
 * @route   POST /projects
 * @access  Private
 */
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, color, priority, dueDate, tags } = req.body;

    const project = await Project.create({
      name,
      description,
      color,
      priority,
      dueDate,
      tags,
      owner: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    updates project
 * @route   PUT /projects/:id
 * @access  Private
 */
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this project'
      });
    }

    const allowedUpdates = ['name', 'description', 'color', 'status', 'priority', 'dueDate', 'tags'];
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    project = await Project.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).populate('collaborators', 'name email avatar');

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    deletes project and its tasks
 * @route   DELETE /projects/:id
 * @access  Private
 */
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this project'
      });
    }

    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    archives/unarchives project
 * @route   PUT /projects/:id/archive
 * @access  Private
 */
exports.toggleArchive = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to archive this project'
      });
    }

    project.isArchived = !project.isArchived;
    await project.save();

    res.json({
      success: true,
      message: `Project ${project.isArchived ? 'archived' : 'unarchived'} successfully`,
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    adds collaborators to project
 * @route   POST /projects/:id/collaborators
 * @access  Private
 */
exports.addCollaborator = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can add collaborators'
      });
    }

    if (project.collaborators.some((c) => c.toString() === userId)) {
      return res.status(400).json({ success: false, message: 'User is already a collaborator' });
    }

    project.collaborators.push(userId);
    await project.save();
    await project.populate('collaborators', 'name email avatar');

    res.json({
      success: true,
      message: 'Collaborator added successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    gets project stats
 * @route   GET /projects/:id/stats
 * @access  Private
 */
exports.getProjectStats = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const stats = await Task.getProjectStats(project._id);
    const overdueTasks = await Task.findOverdue(project._id);
    const progress = await project.calculateProgress();

    res.json({
      success: true,
      data: {
        stats: { ...stats, progress, overdueCount: overdueTasks.length }
      }
    });
  } catch (error) {
    next(error);
  }
};