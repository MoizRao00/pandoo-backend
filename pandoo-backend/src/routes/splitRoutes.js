const express = require('express');
const router = express.Router();
const splitController = require('../controllers/splitController');
const auth = require('../middleware/authMiddleware');

console.log("🚩 Split Routes File is loading...");

// @route   POST /api/split/create (Create Group)
router.post('/create', auth, splitController.createGroup);

router.get('/info/:id', auth, splitController.getGroupInfo);

// @route   GET /api/split (Get My Groups Dashboard)
router.get('/', auth, splitController.getMyGroups);

// @route   POST /api/split/expense (Add Bill)
router.post('/expense', auth, splitController.addExpense);

// @route   GET /api/split/balance/:groupId (The "Who Owes Whom" Math)
router.get('/balance/:groupId', auth, splitController.getGroupBalance);

// @route   GET /api/split/:groupId (Get Expense List)
router.get('/:groupId', auth, splitController.getGroupExpenses);

// Delete
router.delete('/:id', auth, splitController.deleteGroup);

module.exports = router;