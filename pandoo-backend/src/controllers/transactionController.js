const Transaction = require('../models/Transaction');

// @desc    Add a new transaction
// @route   POST /api/transactions
exports.addTransaction = async (req, res) => {
  try {
    const { amount, type, category, description, date, isRecurring } = req.body;

    const transaction = new Transaction({
      userId: req.user.userId,
      amount,
      type,
      category,
      description,
      date,
      isRecurring: isRecurring || false
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Get all transactions (History List)
// @route   GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.userId })
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Get Dashboard Summary (Balance, Chart Data)
// @route   GET /api/transactions/dashboard
// --- NEW FUNCTION ---
exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const transactions = await Transaction.find({ userId });

    let totalIncome = 0;
    let totalExpense = 0;
    
    // Array for the chart (12 slots for Jan-Dec)
    const monthlyData = new Array(12).fill(0); 

    transactions.forEach(txn => {
      if (txn.type === 'income') {
        totalIncome += txn.amount;
      } else {
        totalExpense += txn.amount;
        
        // Add to the specific month slot for the chart
        const monthIndex = new Date(txn.date).getMonth();
        monthlyData[monthIndex] += txn.amount;
      }
    });

    const balance = totalIncome - totalExpense;

    res.json({
      success: true,
      data: {
        username: req.user.username,
        balance,
        totalIncome,
        totalExpense,
        chartData: monthlyData // This powers your wave chart
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Get Recurring Bills (Pre-Authorized)
// @route   GET /api/transactions/recurring
// --- NEW FUNCTION ---
exports.getRecurringTransactions = async (req, res) => {
  try {
    const recurring = await Transaction.find({ 
      userId: req.user.userId, 
      isRecurring: true 
    }).sort({ date: 1 });

    res.json({
      success: true,
      count: recurring.length,
      data: recurring
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getCategoryBreakdown = async (req, res) => {
  try {
    const userId = req.user.userId;
    const transactions = await Transaction.find({ userId, type: 'expense' });

    const categoryMap = {};
    let totalExpense = 0;

    // 1. Group by Category
    transactions.forEach(txn => {
      const cat = txn.category;
      if (!categoryMap[cat]) {
        categoryMap[cat] = 0;
      }
      categoryMap[cat] += txn.amount;
      totalExpense += txn.amount;
    });

    // 2. Format for Frontend
    const breakdown = Object.keys(categoryMap).map(key => {
      const amount = categoryMap[key];
      const percent = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      
      // Assign Colors based on category name (Simple logic)
      let color = "#9E9E9E"; // Default Grey
      if (key.includes('Food') || key.includes('Groceries')) color = "#FF4081"; // Pink
      if (key.includes('Transport') || key.includes('Fuel')) color = "#2196F3"; // Blue
      if (key.includes('Shopping')) color = "#FFC107"; // Amber
      if (key.includes('Bill') || key.includes('Rent')) color = "#4CAF50"; // Green
      if (key.includes('Freelance')) color = "#10B981"; // Emerald

      return {
        category: key,
        value: Math.round(percent), // Send percentage for Pie Chart
        amount: amount,
        color: color
      };
    });

    res.json({
      success: true,
      data: breakdown
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};