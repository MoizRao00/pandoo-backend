const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const appleSignin = require('apple-signin-auth');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register User
// @route   POST /api/auth/register
// @desc    Register User (MFA by Default)
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      if (existingUser.email === email) return res.status(400).json({ msg: 'User already exists' });
      if (existingUser.username === username) return res.status(400).json({ msg: 'Username is taken' });
    }
    
    // 2. Encrypt Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Generate Verification OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // 4. Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      avatar: "panda",
      isMfaEnabled: true, // 👈 ENABLED BY DEFAULT
      mfaOtp: otp,        // 👈 Save OTP immediately
      mfaOtpExpires: Date.now() + 10 * 60 * 1000 // 10 mins
    });

    await user.save();

    // 5. Send OTP via Email (Simulated)
    console.log(`\n📧 [VERIFICATION] To: ${user.email} | Code: ${otp}\n`);

    // 6. Respond WITHOUT Token (Force Verification)
    res.status(201).json({ 
      msg: 'User registered. Please verify email.', 
      mfaRequired: true, // 👈 Triggers OTP Dialog in App
      userId: user.id 
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Login User (with MFA support)
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    // 👇 MFA LOGIC
    if (user.isMfaEnabled) {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      
      user.mfaOtp = otp;
      user.mfaOtpExpires = Date.now() + 10 * 60 * 1000;
      await user.save();

      console.log(`\n📧 [EMAIL SENT] To: ${user.email} | Code: ${otp}\n`);

      return res.json({ 
        mfaRequired: true, 
        userId: user.id, 
        msg: 'OTP sent to email' 
      });
    }

    // Standard Login
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      msg: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isMfaEnabled: user.isMfaEnabled
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    res.status(500).send('Server Error');
  }
};
// @desc    Guest Login (Create Anonymous Account)
// @route   POST /api/auth/guest
// @desc    Guest Login (Create Anonymous Account)
// @route   POST /api/auth/guest
exports.guestLogin = async (req, res) => {
  try {
    // Generate unique ID
    const randomId = Math.floor(100000 + Math.random() * 900000);
    const guestEmail = `guest_${randomId}_${Date.now()}@pandoo.local`;
    
    const salt = await bcrypt.genSalt(10);
    const guestPassword = await bcrypt.hash(`guest_pass_${randomId}`, salt);

    // Create the Shadow User
    const user = new User({
      // 👇 FIX: Make Username Unique!
      username: `Guest User ${randomId}`, 
      email: guestEmail,
      password: guestPassword,
      isGuest: true, 
      avatar: "panda",
      isMfaEnabled: false 
    });

    await user.save();
    console.log(`👻 GUEST ACCOUNT CREATED: ${user.username}`);

    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '365d' });

    res.json({
      msg: 'Guest Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isGuest: true
      }
    });

  } catch (err) {
    console.error("GUEST LOGIN ERROR:", err.message);
    res.status(500).send('Server Error');
  }
};
// @desc    Google Login
// @route   POST /api/auth/google
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    // 1. Verify Google Token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, sub } = ticket.getPayload();

    console.log(`\n⚠️ GOOGLE LOGIN: ${email}`);

    // 2. Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Link Google ID if missing
      if (!user.googleId) {
        console.log("🔗 Linking Google ID to existing email account...");
        user.googleId = sub;
        await user.save();
      }
    } else {
      console.log("🆕 Creating new Google user...");
      user = new User({
        username: name,
        email,
        password: await bcrypt.hash(Math.random().toString(36), 10), 
        googleId: sub,
      });
      await user.save();
    }

    // 3. Generate JWT
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

// @desc    Apple Login
// @route   POST /api/auth/apple
exports.appleLogin = async (req, res) => {
  try {
    const { identityToken, fullName } = req.body; 

    const { email, sub } = await appleSignin.verifyIdToken(identityToken, {
      audience: process.env.APPLE_CLIENT_ID,
      ignoreExpiration: true,
    });

    let user = await User.findOne({ email });

    if (!user) {
      const name = fullName ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() : "Apple User";
      
      user = new User({
        username: name || "Apple User",
        email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        appleId: sub,
      });
      await user.save();
    }

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

exports.updateUser = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    let user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (username) user.username = username;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error("UPDATE ERROR:", err.message);
    res.status(500).send('Server Error');
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Social Login Check
    const isSocialUser = user.googleId || user.appleId;

    if (!isSocialUser) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) return res.status(400).json({ msg: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.json({ msg: 'Password updated successfully' });

  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err.message);
    res.status(500).send('Server Error');
  }
};


// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isMfaEnabled: user.isMfaEnabled,
      isGuest: user.isGuest,
      provider: user.provider || 'email'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Toggle MFA On/Off
// @route   PUT /api/auth/toggle-mfa
exports.toggleMfa = async (req, res) => {
  try {
    const { isEnabled } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Guest Accounts cannot enable MFA
    if (user.isGuest && isEnabled) {
      return res.status(400).json({ msg: 'Guests cannot enable MFA. Please create an account.' });
    }

    user.isMfaEnabled = isEnabled;
    await user.save();

    res.json({
      msg: isEnabled ? 'MFA Enabled' : 'MFA Disabled',
      isMfaEnabled: user.isMfaEnabled
    });

  } catch (err) {
    console.error("TOGGLE MFA ERROR:", err.message);
    res.status(500).send('Server Error');
  }
};

exports.verifyMfa = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (user.mfaOtp !== otp) {
      return res.status(400).json({ msg: 'Invalid Code' });
    }
    if (user.mfaOtpExpires && user.mfaOtpExpires < Date.now()) {
      return res.status(400).json({ msg: 'Code Expired' });
    }

    user.mfaOtp = undefined;
    user.mfaOtpExpires = undefined;
    await user.save();

    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      msg: 'MFA Verified',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });

  } catch (err) {
    console.error("MFA VERIFY ERROR:", err.message);
    res.status(500).send('Server Error');
  }
};
// @desc    Convert Guest to Real User
// @route   PUT /api/auth/convert-guest
exports.convertGuest = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userId = req.user.userId; // Taken from the current Guest Token

    // 1. Find the Guest User
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (!user.isGuest) {
      return res.status(400).json({ msg: 'Account is already verified.' });
    }

    // 2. Check if the NEW email is already taken
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ msg: 'This email is already in use.' });
    }

    // 3. Hash the New Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Update the User Document (Keep ID, Transactions, Settings!)
    user.username = username;
    user.email = email;
    user.password = hashedPassword;
    user.isGuest = false;       // 👈 The Magic Switch
    user.isMfaEnabled = true;   // 👈 Enforce security immediately

    await user.save();

    console.log(`🚀 GUEST CONVERTED: ${user.email}`);

    // 5. Send updated info back
    res.json({
      msg: 'Account saved successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isGuest: false
      }
    });

  } catch (err) {
    console.error("CONVERT GUEST ERROR:", err.message);
    res.status(500).send('Server Error');
  }
};