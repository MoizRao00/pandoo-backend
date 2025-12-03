const SplitGroup = require('../models/SplitGroup');
const SplitExpense = require('../models/SplitExpense'); // Ensure Capital S, Capital E
const User = require('../models/User'); // <--- MUST BE CAPITAL 'U'

// @desc    Create a new Split Group
exports.createGroup = async (req, res) => {
  try {
    const { name, memberEmails } = req.body;
    let members = [req.user.userId]; 
    
    if (memberEmails && memberEmails.length > 0) {
      const users = await User.find({ email: { $in: memberEmails } });
      users.forEach(user => members.push(user._id));
    }

    const newGroup = new SplitGroup({
      name,
      createdBy: req.user.userId,
      members: members,
      totalSpent: 0
    });

    await newGroup.save();
    res.status(201).json({ success: true, data: newGroup });
  } catch (err) {
    console.error("Create Group Error:", err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Get all groups
exports.getMyGroups = async (req, res) => {
  try {
    const groups = await SplitGroup.find({ members: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: groups.length, data: groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Add an Expense
exports.addExpense = async (req, res) => {
  try {
    const { groupId, amount, description } = req.body;

    const expense = new SplitExpense({
      groupId,
      paidBy: req.user.userId,
      amount,
      description
    });

    await expense.save();

    // Update the Group Total
    const group = await SplitGroup.findById(groupId);
    if(group) {
        group.totalSpent += amount;
        await group.save();
    }

    res.status(201).json({ success: true, data: expense, groupTotal: group ? group.totalSpent : 0 });
  } catch (err) {
    console.error("Add Expense Error:", err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Get Group Expenses
exports.getGroupExpenses = async (req, res) => {
  try {
    const expenses = await SplitExpense.find({ groupId: req.params.groupId })
      .populate('paidBy', 'username email')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: expenses.length, data: expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};