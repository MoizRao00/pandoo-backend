const SplitGroup = require('../models/SplitGroup');
const User = require('../models/User');
const SplitExpense = require('../models/SplitExpense');

// @desc    Create a new Split Group
// @route   POST /api/split/create
exports.createGroup = async (req, res) => {
  try {
    const { name, memberEmails } = req.body;

    // 1. Find member IDs based on emails (if provided)
    let members = [req.user.userId]; // Creator is always a member
    
    if (memberEmails && memberEmails.length > 0) {
      const users = await User.find({ email: { $in: memberEmails } });
      users.forEach(user => members.push(user._id));
    }

    // 2. Create the Group
    const newGroup = new SplitGroup({
      name,
      createdBy: req.user.userId,
      members: members,
      totalSpent: 0
    });

    await newGroup.save();

    res.status(201).json({ success: true, data: newGroup });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Get all groups for the logged-in user
// @route   GET /api/split
exports.getMyGroups = async (req, res) => {
  try {
    // Find groups where the user is in the members list
    const groups = await SplitGroup.find({ members: req.user.userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Add an Expense to a Group
// @route   POST /api/split/expense
exports.addExpense = async (req, res) => {
  try {
    const { groupId, amount, description } = req.body;

    // 1. Create the Expense Record
    const expense = new SplitExpense({
      groupId,
      paidBy: req.user.userId,
      amount,
      description
    });

    await expense.save();

    // 2. Update the Group's Total Spent
    const group = await SplitGroup.findById(groupId);
    group.totalSpent += amount;
    await group.save();

    res.status(201).json({ success: true, data: expense, groupTotal: group.totalSpent });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Get Expenses for a specific Group
// @route   GET /api/split/:groupId
exports.getGroupExpenses = async (req, res) => {
  try {
    const expenses = await SplitExpense.find({ groupId: req.params.groupId })
      .populate('paidBy', 'username email') 
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};