const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  targetAmount: {
    type: Number,
    required: true
  },
  savedAmount: {
    type: Number,
    default: 0
  },
  icon: {
    type: String,
    default: "🎯"
  },
  deadline: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Goal', GoalSchema);
