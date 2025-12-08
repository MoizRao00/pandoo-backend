const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/authMiddleware');

console.log("🚩 Transaction Routes Loading...");

// --- 1. SPECIFIC ROUTES (Must be first) ---
router.get('/dashboard', auth, transactionController.getDashboardSummary);
router.get('/categories', auth, transactionController.getCategoryBreakdown); // <--- Moved Up
router.get('/recurring', auth, transactionController.getRecurringTransactions);

// --- 2. GENERAL ROUTES (Must be last) ---
router.post('/', auth, transactionController.addTransaction);
router.get('/', auth, transactionController.getTransactions);

module.exports = router;