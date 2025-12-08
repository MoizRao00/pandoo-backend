const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @desc    Get List of AI Recommendations
// @route   GET /api/ai/tips
exports.getAiAdvice = async (req, res) => {
  try {
    const userId = req.user.userId;
    const transactions = await Transaction.find({ userId });
    const user = await User.findById(userId);

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = {};

    // 1. Analyze Data
    transactions.forEach(txn => {
      if (txn.type === 'income') totalIncome += txn.amount;
      if (txn.type === 'expense') {
        totalExpense += txn.amount;
        // Track category spending
        categoryTotals[txn.category] = (categoryTotals[txn.category] || 0) + txn.amount;
      }
    });

    // 2. Generate Recommendations Array
    const recommendations = [];

    // --- Tip A: Health Check ---
    if (totalExpense > totalIncome && totalIncome > 0) {
      recommendations.push({
        title: "High Spending Alert",
        content: `You spent more than you earned this month. Review your expenses.`,
        type: "warning"
      });
    } else {
      recommendations.push({
        title: "Healthy Balance",
        content: "You are spending within your means. Great job!",
        type: "success"
      });
    }

    // --- Tip B: Top Expense Category ---
    let highestCat = "";
    let highestAmount = 0;
    for (const [cat, amount] of Object.entries(categoryTotals)) {
      if (amount > highestAmount) {
        highestAmount = amount;
        highestCat = cat;
      }
    }

    if (highestCat) {
      recommendations.push({
        title: "Top Expense",
        content: `Your highest spending is on '${highestCat}' ($${highestAmount}). Can you reduce this?`,
        type: "info"
      });
    }

    // --- Tip C: General Savings ---
    const savings = totalIncome - totalExpense;
    if (savings > (totalIncome * 0.2)) {
      recommendations.push({
        title: "Savings Goal",
        content: "You saved over 20% of your income! Consider investing the surplus.",
        type: "success"
      });
    } else {
      recommendations.push({
        title: "Optimize Savings",
        content: "Try to save at least 20% of your income next month.",
        type: "info"
      });
    }

    // 3. Send List
    res.json({
      success: true,
      data: {
        tips: recommendations, // Array of cards
        score: user.financialHealthScore || 50 // Send score for the Gauge
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};