const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const auth = require('../middleware/authMiddleware');

// @route   POST /api/goals (Create)
router.post('/', auth, goalController.addGoal);

// @route   GET /api/goals (Fetch List)
router.get('/', auth, goalController.getGoals);

// @route   PUT /api/goals/:id (Update Progress)
router.put('/:id', auth, goalController.updateGoal);

// --- THIS LINE IS MANDATORY ---
module.exports = router;