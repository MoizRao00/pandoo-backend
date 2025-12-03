const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // --- DEBUG LOG ---
  console.log("🛡️ Auth Middleware Triggered!");
  // -----------------

  // 1. Get token from the header
  const token = req.header('x-auth-token');

  // Check if token exists
  if (!token) {
    console.log("❌ No Token Found in Header");
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // 2. Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    console.log("✅ Token Verified for User:", req.user.userId);
    next(); 
  } catch (err) {
    console.log("❌ Token Invalid:", err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};