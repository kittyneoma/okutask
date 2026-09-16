const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'The name is required'],
    trim: true,
    minlength: [2, 'The name must be at least 2 characters long'],
    maxlength: [50, 'The name must not exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'The email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'The password is required'],
    minlength: [8, 'The password must be at least 8 characters long'],
    select: false // do not include password in queries by default
  },
  avatar: {
    type: String,
    default: 'https://ui-avatars.com/api/?background=2292A4&color=fff'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// indexes
userSchema.index({ email: 1 });

// hash password b4 saving
userSchema.pre('save', async function(next) {
  // solo se hashea si el password fue modificado
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// method 2 compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// method 2 generate URL avatar
userSchema.methods.getAvatarUrl = function() {
  return this.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=2292A4&color=fff`;
};

// method to retrieve public user data
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

// virtual showcase for projects
userSchema.virtual('projectCount', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'owner',
  count: true
});

module.exports = mongoose.model('User', userSchema);