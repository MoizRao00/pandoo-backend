const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String, // e.g., "Vacation to Bali"
    required: true,
    trim: true
  },
  targetAmount: {
    type: Number, // e.g., 5000
    required: true
  },
  savedAmount: {
    type: Number, // e.g., 2500
    default: 0
  },
  icon: {
    type: String, // You can store an emoji or icon name (e.g., "✈️" or "plane")
    default: "🎯" 
  },
  color: {
    type: String, // Store hex code like "#FF5733" for the progress bar color
    default: "#10B981" // Emerald Green
  },
  deadline: {
    type: Date // Optional: "By Dec 2025"
  }
}, { timestamps: true });

module.exports = mongoose.model('Goal', GoalSchema);