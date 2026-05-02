const { mongoose } = require('../db');

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 4
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const shotSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  description: {
    type: String,
    trim: true,
    maxLength: 500
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['web', 'mobile', 'branding', 'illustration', 'animation', 'product', 'typography'],
    default: 'web'
  },
  tags: [{
    type: String,
    trim: true
  }],
  author: {
    type: String,
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  comments: [commentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Shot = mongoose.model('Shot', shotSchema);

module.exports = Shot;