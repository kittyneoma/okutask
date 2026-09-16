const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'The task title is required'],
    trim: true,
    minlength: [3, 'The title must be at least 3 characters long'],
    maxlength: [200, 'The title must not exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'The description must not exceed 1000 characters']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'completed', 'blocked'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    min: [0, 'The estimated hours must be a positive number']
  },
  actualHours: {
    type: Number,
    min: [0, 'The actual hours must be a positive number']
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  position: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// indexes
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: -1, dueDate: 1 });
taskSchema.index({ position: 1 });

// middleware 2 establish completedAt
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completed') {
      this.completedAt = undefined;
    }
  }
  next();
});

// virtual 2 verify if its expired
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') {
    return false;
  }
  return new Date() > this.dueDate;
});

// virtual 4 days reamianing
taskSchema.virtual('daysRemaining').get(function() {
  if (!this.dueDate || this.status === 'completed') {
    return null;
  }
  const diffTime = this.dueDate - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// method to add comment
taskSchema.methods.addComment = function(userId, text) {
  this.comments.push({
    user: userId,
    text: text
  });
  return this.save();
};

// static method 4 expired tasks
taskSchema.statics.findOverdue = function(projectId) {
  return this.find({
    project: projectId,
    dueDate: { $lt: new Date() },
    status: { $ne: 'completed' }
  }).sort({ dueDate: 1 });
};

// static method 4 stats
taskSchema.statics.getProjectStats = async function(projectId) {
  const stats = await this.aggregate([
    { $match: { project: new mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    total: 0,
    todo: 0,
    'in-progress': 0,
    review: 0,
    completed: 0,
    blocked: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  return result;
};

module.exports = mongoose.model('Task', taskSchema);