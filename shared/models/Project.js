const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'The project name is required'],
    trim: true,
    minlength: [3, 'The name must be at least 3 characters long'],
    maxlength: [100, 'The name must not exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'The description must not exceed 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  color: {
    type: String,
    default: '#2292A4',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hexadecimal code']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived', 'on-hold'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// indexes
projectSchema.index({ owner: 1, status: 1 });
projectSchema.index({ name: 'text', description: 'text' });
projectSchema.index({ createdAt: -1 });

// virtual 4 tasks
projectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project'
});

// virtual 2 count tasks
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true
});

// methot to calculate progress
projectSchema.methods.calculateProgress = async function() {
  const Task = mongoose.model('Task');
  const totalTasks = await Task.countDocuments({ project: this._id });
  const completedTasks = await Task.countDocuments({ 
    project: this._id, 
    status: 'completed' 
  });
  
  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
};

// middleware to delete tasks when a project is deleted
projectSchema.pre('remove', async function(next) {
  const Task = mongoose.model('Task');
  await Task.deleteMany({ project: this._id });
  next();
});

// static method 2 search projects
projectSchema.statics.findByOwner = function(ownerId, filters = {}) {
  return this.find({ owner: ownerId, ...filters })
    .populate('collaborators', 'name email avatar')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Project', projectSchema);