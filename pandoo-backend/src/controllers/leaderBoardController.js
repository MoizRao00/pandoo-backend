const User = require('../models/User'); // Capital U

// @desc    Send Request
// @route   POST /api/leaderboard/request
exports.sendRequest = async (req, res) => {
  try {
    const { email } = req.body;
    
    const friend = await User.findOne({ email });
    if (!friend) return res.status(404).json({ msg: 'User not found' });

    if (friend._id.toString() === req.user.userId) {
      return res.status(400).json({ msg: 'You cannot compete with yourself' });
    }

    res.json({ success: true, msg: `Competition request sent to ${friend.username}!` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Get Leaderboard
// @route   GET /api/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({})
      .select('username financialHealthScore pandaState icon')
      .sort({ financialHealthScore: -1 })
      .limit(10);

    res.json({
      success: true,
      count: leaderboard.length,
      data: leaderboard
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};