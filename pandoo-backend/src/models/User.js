const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique : true,
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  
  // -- Financial & Plaid Data --
  currency: { type: String, default: 'USD' },
  plaidAccessToken: { type: String, default: null }, // Will be encrypted
  plaidItemId: { type: String, default: null },
  isBankLinked: { type: Boolean, default: false },

  // -- Gamification & App Settings --
  financialHealthScore: { type: Number, default: 50 }, // Starts at 50/100

  avatar: { 
    type: String, 
    default: "panda" 
  },

  isPremium: { type: Boolean, default: false },
  language: { type: String, default: 'en' }, // 'en' or 'fr'
  
}, { timestamps: true });

const bcrypt = require('bcryptjs');

// 2. Helper to compare passwords during Login
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Keep your export line at the bottom
module.exports = mongoose.model('User', UserSchema);