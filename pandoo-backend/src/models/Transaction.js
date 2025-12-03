const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'], // Only allow these two values
    required: true
  },
  category: {
    type: String, // e.g., 'Food', 'Salary', 'Rent'
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    trim: true
  },
  isRecurring: { // For your subscription feature
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);