const SplitGroup = require('../models/SplitGroup');
const User = require('../models/User');
const SplitExpense = require('../models/SplitExpense');


exports.createGroup = async (req, res) => {
  try {
    const { name, members, startDate,endDate } = req.body;

    //  Add the Creator (You) to the list
    // Set ensures no duplicates if you accidentally added yourself
    const allMemberIds = [...new Set([...members, req.user.userId])];


    // 2. Create the Group
    const newGroup = new SplitGroup({
      name,
      createdBy: req.user.userId,
      members: allMemberIds,
      totalSpent: 0,
      startDate, 
      endDate    
    });

    await newGroup.save();

    const populatedGroup = await newGroup.populate('members', 'username avatar');

    res.status(201).json({ success: true, data: populatedGroup });

 } catch (err) {
    console.error("CREATE GROUP ERROR:", err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getGroupInfo = async (req, res) => {
  try {
    const group = await SplitGroup.findById(req.params.id)
      .populate('members', 'username avatar'); // Return members with names/avatars
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.status(200).json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
};


exports.getMyGroups = async (req, res) => {
  try {
    const groups = await SplitGroup.find({ members: req.user.userId })
      .populate('members', 'username avatar')
      .sort({ updatedAt: -1 })
      .lean();

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



exports.addExpense = async (req, res) => {
  try {
    // 1. Check if 'paidBy' is sent from frontend.
    // If yes, use it. If no, default to the logged-in user (req.user.userId)
    const { groupId, amount, description, involvedMembers, paidBy } = req.body;

    const group = await SplitGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const finalSplitMembers = (involvedMembers && involvedMembers.length > 0) 
      ? involvedMembers 
      : group.members;

    // 2. Create Expense with the correct Payer
    const expense = new SplitExpense({
      groupId,
      paidBy: paidBy || req.user.userId, 
      amount,
      description,
      splitBetween: finalSplitMembers
    });

    await expense.save();
      
    group.totalSpent += Number(amount);
    await group.save();

    res.status(201).json({ success: true, data: expense, groupTotal: group.totalSpent });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};


exports.getGroupExpenses = async (req, res) => {
  try {
    const expenses = await SplitExpense.find({ groupId: req.params.groupId })
      .populate('paidBy', 'username avatar') 
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


exports.getGroupBalance = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    // 1. Fetch Group & Expenses
  const [group, expenses] = await Promise.all([
      SplitGroup.findById(groupId).populate('members', 'username avatar').lean(),
      SplitExpense.find({ groupId }).lean()
    ]);
    
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // 2. Initialize Balances
    // Map: { "userId": 0.0 }
    let balances = {};
    group.members.forEach(member => {
      balances[member._id.toString()] = 0;
    });

    // 3. Process Every Expense
    expenses.forEach(expense => {
      const paidBy = expense.paidBy.toString();
      const amount = expense.amount;
      
      // Who was involved? (Default to all members if empty)
      const involved = (expense.splitBetween && expense.splitBetween.length > 0) 
        ? expense.splitBetween.map(id => id.toString())
        : group.members.map(m => m._id.toString());

      const splitAmount = amount / involved.length;

      // Payer gets POSITIVE balance (They are owed money)
      if (balances[paidBy] !== undefined) {
        balances[paidBy] += amount;
      }

      // Consumers get NEGATIVE balance (They owe money)
      involved.forEach(memberId => {
        if (balances[memberId] !== undefined) {
          balances[memberId] -= splitAmount;
        }
      });
    });

    // 4. Separate Debtors (Negative) and Creditors (Positive)
    let debtors = [];
    let creditors = [];

    for (const [memberId, amount] of Object.entries(balances)) {
      if (amount < -0.01) debtors.push({ memberId, amount }); // Owes money
      if (amount > 0.01) creditors.push({ memberId, amount });  // Is owed money
    }

    // 5. Match them up (Greedy Algorithm)
    // "Take the biggest debtor and make them pay the biggest creditor"
    debtors.sort((a, b) => a.amount - b.amount); // Ascending (biggest negative first)
    creditors.sort((a, b) => b.amount - a.amount); // Descending (biggest positive first)

    let debts = [];
    let i = 0; // Debtor index
    let j = 0; // Creditor index

    while (i < debtors.length && j < creditors.length) {
      let debtor = debtors[i];
      let creditor = creditors[j];

      // The amount to settle is the minimum of what Debtor owes vs what Creditor needs
      let amount = Math.min(Math.abs(debtor.amount), creditor.amount);

      // Find user details for UI
      const debtorInfo = group.members.find(m => m._id.toString() === debtor.memberId);
      const creditorInfo = group.members.find(m => m._id.toString() === creditor.memberId);

      debts.push({
        from: debtorInfo ? debtorInfo.username : 'Unknown',
        fromAvatar: debtorInfo ? debtorInfo.avatar : 'panda',
        to: creditorInfo ? creditorInfo.username : 'Unknown',
        toAvatar: creditorInfo ? creditorInfo.avatar : 'panda',
        amount: Number(amount.toFixed(2))
      });

      // Update remaining amounts
      debtor.amount += amount;
      creditor.amount -= amount;

      // Move to next person if settled
      if (Math.abs(debtor.amount) < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    // 6. Return Final Report
    res.status(200).json({
      success: true,
      data: {
        totalGroupSpent: group.totalSpent,
        debts: debts // The list of "Who pays Whom"
      }
    });

  } catch (err) {
    console.error("BALANCE ERROR:", err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Delete a Group and its Expenses
// @route   DELETE /api/split/:id
exports.deleteGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.userId;

    console.log(`🗑️ Attempting to delete group: ${groupId}`);
    console.log(`👤 Requesting User: ${userId}`);

    const group = await SplitGroup.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if the requester is the owner
    if (group.createdBy.toString() !== userId) {
      return res.status(401).json({ error: 'Not authorized. Only the admin can delete this group.' });
    }

    await SplitExpense.deleteMany({ groupId: groupId });
    await SplitGroup.findByIdAndDelete(groupId);

    res.status(200).json({ success: true, message: 'Group deleted successfully' });

  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
};