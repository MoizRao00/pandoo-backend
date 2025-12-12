const mongoose = require('mongoose');

const SplitExpenseSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SplitGroup',
    required: true
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String, // e.g., "Dinner at Bistro"
    required: true
  },
  splitBetween: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

SplitExpenseSchema.index({ groupId: 1 }); 
SplitExpenseSchema.index({ paidBy: 1 });

module.exports = mongoose.model('SplitExpense', SplitExpenseSchema);