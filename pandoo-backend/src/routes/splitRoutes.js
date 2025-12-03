const express = require('express');
const router = express.Router();
const splitController = require('../controllers/splitController');
const auth = require('../middleware/authMiddleware');

console.log("🚩 Split Routes File is loading..."); // Debug line

// @route   POST /api/split/create
router.post('/create', auth, splitController.createGroup);

// @route   GET /api/split
router.get('/', auth, splitController.getMyGroups);

// @route   POST /api/split/expense
router.post('/expense', auth, splitController.addExpense);

// @route   GET /api/split/:groupId
router.get('/:groupId', auth, splitController.getGroupExpenses);

// --- THE CRITICAL LINE ---
module.exports = router;