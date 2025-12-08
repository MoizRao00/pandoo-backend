const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register User
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // --- DEBUG LOGS ---
    console.log("\n⚠️ REGISTER ATTEMPT ⚠️");
    console.log(`1. Username: '${username}'`);
    console.log(`2. Email:    '${email}'`);
    console.log(`3. Password: '${password}'`); // Check for spaces here!
    // ------------------

    // 1. Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log("❌ Register Failed: User already exists");
      return res.status(400).json({ msg: 'User already exists' });
    }

    // 2. Encrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log(`✅ Password hashed successfully: ${hashedPassword.substring(0, 15)}...`);

    // 3. Create user
    user = new User({
      username,
      email,
      password: password
    });

    await user.save();
    console.log("🎉 User saved to MongoDB!");

    // 4. Token
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      msg: 'User registered successfully', 
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });

  } catch (err) {
    console.error("SERVER ERROR:", err.message);
    res.status(500).send('Server Error');
  }
};

// ... (keep the register function at the top)

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- DEBUGGING LOGS (Start) ---
    console.log("\n⚠️ LOGIN ATTEMPT RECEIVED ⚠️");
    console.log(`1. Email from App:    '${email}'`); // Quotes help us see spaces
    console.log(`2. Password from App: '${password}'`);
    // -----------------------------

    // 1. Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log("❌ FAILURE: User not found in database.");
      
      // Let's print all users to see what is actually saved
      const allUsers = await User.find();
      console.log("   --> Emails currently in DB:", allUsers.map(u => u.email));
      
      return res.status(400).json({ msg: 'Invalid Credentials (User not found)' });
    }

    console.log(`✅ SUCCESS: User found: '${user.email}'`);
    console.log(`3. Hashed Password in DB: ${user.password.substring(0, 20)}...`);

    // 2. Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log("❌ FAILURE: Password does not match.");
      return res.status(400).json({ msg: 'Invalid Credentials (Password wrong)' });
    }

    console.log("🎉 SUCCESS: Password Matched! Logging in...");

    // 3. Generate Token
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // 4. Send Success
    res.json({
      msg: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        financialHealthScore: user.financialHealthScore
      }
    });

  } catch (err) {
    console.error("SERVER ERROR:", err.message);
    res.status(500).send('Server Error');
  }
};