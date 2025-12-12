// The model file in `src/models` is named `Goals.js`, so require that file.
const Goal = require('../models/Goals');

exports.addGoal = async (req, res) => {
  try {
    const { name, targetAmount, savedAmount, icon, deadline } = req.body;

    const newGoal = new Goal({
      userId: req.user.userId,
      name,
      targetAmount,
      savedAmount: savedAmount || 0,
      icon,
      deadline
    });

    const goal = await newGoal.save();
    res.status(201).json({ success: true, data: goal });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};


exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: goals.length,
      data: goals
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const { savedAmount } = req.body;
    
    // Find goal and update only the savedAmount
    let goal = await Goal.findById(req.params.id);

    if (!goal) return res.status(404).json({ msg: 'Goal not found' });

    // Ensure user owns this goal
    if (goal.userId.toString() !== req.user.userId) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    goal.savedAmount = savedAmount;
    await goal.save();

    res.json({ success: true, data: goal });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const goalId = req.params.id;
    
    // 1. Find and Delete in one step (Much safer)
    const deletedGoal = await Goal.findOneAndDelete({ 
      _id: goalId, 
      userId: req.user.userId // Ensure user owns it
    });

    if (!deletedGoal) {
      return res.status(404).json({ msg: 'Goal not found or unauthorized' });
    }

    res.json({ success: true, msg: 'Goal removed' });

  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: 'Server Error' });
  }
};