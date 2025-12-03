const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/authMiddleware');

// --- 🟢 NEW DASHBOARD ROUTE (Must be at the top) ---
// This powers the charts and balance cards
router.get('/dashboard', auth, transactionController.getDashboardSummary);

// --- 🟢 NEW RECURRING ROUTE ---
// This powers the "Pre-Authorized Debits" list
router.get('/recurring', auth, transactionController.getRecurringTransactions);

// @route   POST /api/transactions
// @desc    Add a new transaction (Income/Expense)
router.post('/', auth, transactionController.addTransaction);

// @route   GET /api/transactions
// @desc    Get the full history list
router.get('/', auth, transactionController.getTransactions);

module.exports = router;