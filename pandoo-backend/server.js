const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  console.log(`📢 Request received: ${req.method} ${req.url}`);
  next();
});


// Database Connection 
const DB_URI = "mongodb://raomoiz474_db_user:Moiz_123@ac-pe1orif-shard-00-00.wefmutr.mongodb.net:27017,ac-pe1orif-shard-00-01.wefmutr.mongodb.net:27017,ac-pe1orif-shard-00-02.wefmutr.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-evt0tu-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(DB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.log('❌ DB Error:', err.message);
  });

// Routes

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
console.log("🚩 Server is trying to load transaction routes...");
app.use('/api/transactions', require('./src/routes/transactionRoutes')); 
app.use('/api/goals', require('./src/routes/goalRoutes'));
app.use('/api/ai', require('./src/routes/aiRoutes'));
app.use('/api/split', require('./src/routes/splitRoutes'));
app.use('/api/leaderboard', require('./src/routes/leaderBoardRoutes'));


// Test Route
app.get('/', (req, res) => {
  res.send('Pandoo Backend is Running! 🐼');
});

// Start Server
const PORT = process.env.PORT || 5000;
// Add '0.0.0.0' as the second argument
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});