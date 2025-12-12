const User = require('../models/User');

exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) return res.json([]);

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        // If you want to allow searching by email too:
        { email: { $regex: query, $options: 'i' } } 
      ]
    })
    .select('username email avatar financialHealthScore') // Only return public info
    .limit(10);

    res.json(users);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

