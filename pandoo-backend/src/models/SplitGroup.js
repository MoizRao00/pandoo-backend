const mongoose = require('mongoose');

const SplitGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  startDate: { type: Date },
  endDate: { type: Date },

  status: {
    type: String,
    enum: ['Active', 'Finished'],
    default: 'Active'
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

SplitGroupSchema.index({ members: 1 });

module.exports = mongoose.model('SplitGroup', SplitGroupSchema);