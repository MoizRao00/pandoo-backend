const Transaction = require('../models/Transaction');
const User = require('../models/User'); // <--- Capital 'U' is crucial!

// @desc    Get AI Financial Advice
// @route   GET /api/ai/tips
exports.getAiAdvice = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 1. Fetch User Data
    const transactions = await Transaction.find({ userId });

    // 2. Basic Analysis Logic
    let totalIncome = 0;
    let totalExpense = 0;
    let foodExpense = 0;

    transactions.forEach(txn => {
      if (txn.type === 'income') totalIncome += txn.amount;
      if (txn.type === 'expense') {
        totalExpense += txn.amount;
        if (txn.category === 'Food' || txn.category === 'Groceries') {
          foodExpense += txn.amount;
        }
      }
    });

    // 3. Generate Advice
    let advice = "Keep tracking your expenses to stay healthy!";
    let mood = "Happy";

    if (totalExpense > totalIncome && totalIncome > 0) {
      advice = "⚠️ Warning: You are spending more than you earn! Pandoo is worried.";
      mood = "Worried";
    } else if (foodExpense > (totalExpense * 0.4)) {
      advice = "🍔 You spent over 40% of your budget on Food. Try cooking at home next week!";
      mood = "Surprised";
    } else if (totalIncome > 0 && totalExpense < (totalIncome * 0.5)) {
      advice = "🚀 Amazing! You saved more than 50% of your income. You are a savings pro!";
      mood = "Excited";
    }

    // 4. Send Response
    res.json({
      success: true,
      data: {
        tip: advice,
        mood: mood,
        generatedAt: new Date()
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};