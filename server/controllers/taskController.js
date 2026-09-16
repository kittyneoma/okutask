const Task = require('../models/Task');
const Project = require('../models/Project');

/**
 * @desc    gets all project tasks
 * @route   GET /api/projects/:projectId/tasks
 * @access  Private
 */
exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, assignedTo } = req.query;
    const { projectId } = req.params;

    // verifies that the project exists and the user has access
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.owner.toString() !== req.user.id && 
        !project.collaborators.some(collab => collab.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this project'
      });
    }

    // filter build
    let filters = { project: projectId };
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (assignedTo) filters.assignedTo = assignedTo;

    const tasks = await Task.find(filters)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate({
        path: 'comments.user',
        select: 'name avatar'
      })
      .sort({ position: 1, createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      data: {
        tasks
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    gets task by id
 * @route   GET /api/tasks/:id
 * @access  Private
 */
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name color')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate({
        path: 'comments.user',
        select: 'name avatar'
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // verifies permissions
    const project = await Project.findById(task.project._id);
    if (project.owner.toString() !== req.user.id && 
        !project.collaborators.some(collab => collab.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this task'
      });
    }

    res.json({
      success: true,
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    creates new task
 * @route   POST /api/projects/:projectId/tasks
 * @access  Private
 */
exports.createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, priority, dueDate, assignedTo, estimatedHours, tags } = req.body;

    // verifies project
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // verifies permissions
    if (project.owner.toString() !== req.user.id && 
        !project.collaborators.some(collab => collab.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create tasks in this project'
      });
    }

    // gets last position
    const lastTask = await Task.findOne({ project: projectId }).sort({ position: -1 });
    const position = lastTask ? lastTask.position + 1 : 0;

    const task = await Task.create({
      title,
      description,
      project: projectId,
      createdBy: req.user.id,
      assignedTo,
      priority,
      dueDate,
      estimatedHours,
      tags,
      position
    });

    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Tarea creada exitosamente',
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    updates task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // verifies permissions
    const project = await Project.findById(task.project);
    if (project.owner.toString() !== req.user.id && 
        !project.collaborators.some(collab => collab.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this task'
      });
    }

    const allowedUpdates = [
      'title', 'description', 'status', 'priority', 
      'dueDate', 'assignedTo', 'estimatedHours', 'actualHours', 
      'tags', 'position'
    ];
    
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    task = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    deletes task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // verifies permissions
    const project = await Project.findById(task.project);
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the Owner of the project can delete tasks'
      });
    }

    await task.remove();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    add commento to task
 * @route   POST /api/tasks/:id/comments
 * @access  Private
 */
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // verifies permissions
    const project = await Project.findById(task.project);
    if (project.owner.toString() !== req.user.id && 
        !project.collaborators.some(collab => collab.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to comment on this task'
      });
    }

    await task.addComment(req.user.id, text);
    
    await task.populate({
      path: 'comments.user',
      select: 'name avatar'
    });

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    updates task position - drag and drop
 * @route   PUT /api/tasks/:id/position
 * @access  Private
 */
exports.updatePosition = async (req, res, next) => {
  try {
    const { position, status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // verifies permissions
    const project = await Project.findById(task.project);
    if (project.owner.toString() !== req.user.id && 
        !project.collaborators.some(collab => collab.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to move this task'
      });
    }

    if (position !== undefined) task.position = position;
    if (status) task.status = status;

    await task.save();

    res.json({
      success: true,
      message: 'Task position updated successfully',
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    gets user tasks
 * @route   GET /api/tasks/my-tasks
 * @access  Private
 */
exports.getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate('project', 'name color')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, priority: -1 });

    res.json({
      success: true,
      count: tasks.length,
      data: {
        tasks
      }
    });
  } catch (error) {
    next(error);
  }
};