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
   const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ msg: 'User already exists' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ msg: 'Username is taken' });
      }
    }
    
    // 2. Encrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log(`✅ Password hashed successfully: ${hashedPassword.substring(0, 15)}...`);

    // 3. Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      avatar: avatar || "panda"
    });
    await user.save();
    console.log("🎉 User saved to MongoDB!");

    // 4. Token
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      msg: 'User registered successfully', 
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar }
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


const { OAuth2Client } = require('google-auth-library');
const appleSignin = require('apple-signin-auth');

// Initialize Google Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Login
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    // 1. Verify Google Token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID, // Client ID from Google Cloud Console
    });
    const { email, name, sub } = ticket.getPayload(); // 'sub' is Google's unique user ID

    console.log(`\n⚠️ GOOGLE LOGIN: ${email}`);

    // 2. Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      console.log("✅ User found. Logging in...");
    } else {
      console.log("🆕 User not found. Creating new account...");
      // 3. Create user if not exists
      // Note: We generate a dummy password since they use social login
      user = new User({
        username: name,
        email,
        password: await bcrypt.hash(Math.random().toString(36), 10), 
        googleId: sub, // Optional: Add this field to your Schema to link explicitly
      });
      await user.save();
    }

    // 4. Generate JWT
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      msg: 'Google Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });

  } catch (err) {
    console.error("GOOGLE AUTH ERROR:", err.message);
    res.status(400).json({ msg: 'Google Sign-In Failed' });
  }
};

// Apple Login
exports.appleLogin = async (req, res) => {
  try {
    const { identityToken, fullName } = req.body; 
    
    // Note: Apple only sends 'fullName' on the very first sign-in.
    // Your frontend must capture it and send it here.

    // 1. Verify Apple Token
    const { email, sub } = await appleSignin.verifyIdToken(identityToken, {
      audience: process.env.APPLE_CLIENT_ID, // Service ID or Bundle ID
      ignoreExpiration: true,
    });

    console.log(`\n🍎 APPLE LOGIN: ${email}`);

    // 2. Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      console.log("✅ User found. Logging in...");
    } else {
      console.log("🆕 User not found. Creating new account...");
      
      const name = fullName ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() : "Apple User";
      
      user = new User({
        username: name || "Apple User",
        email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        appleId: sub,
      });
      await user.save();
    }

    // 3. Generate JWT
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      msg: 'Apple Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });

  } catch (err) {
    console.error("APPLE AUTH ERROR:", err.message);
    res.status(400).json({ msg: 'Apple Sign-In Failed' });
  }
};