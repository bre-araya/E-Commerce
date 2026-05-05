const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerRules, loginRules } = require('../middleware/validators');

// Helper: sign JWT
const signToken = (id) => {
  const rawExp = process.env.JWT_EXPIRE || '1h';
  let expiresIn = rawExp;

  // If numeric string, normalize to number of seconds expected by jsonwebtoken.
  // Heuristic: treat large numbers as milliseconds (e.g. 3600000) and convert to seconds.
  if (/^\d+$/.test(String(rawExp))) {
    const n = Number(rawExp);
    expiresIn = n > 86400 ? Math.floor(n / 1000) : n; // convert ms->s if > 1 day (in seconds)
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

// Helper: send token response
const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
};

// ─── POST /api/auth/register ───────────────────────────────
router.post('/register', registerRules, validate, async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, password });
  sendToken(user, 201, res);
});

// ─── POST /api/auth/login ──────────────────────────────────
router.post('/login', loginRules, validate, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  // Explicitly select password (it's hidden by default via select:false)
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  sendToken(user, 200, res);
});

// ─── GET /api/auth/me ─────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// ─── PUT /api/auth/profile ────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  const { name, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, avatar },
    { new: true, runValidators: true }
  );
  res.json({ success: true, user });
});

// ─── PUT /api/auth/password ───────────────────────────────
router.put('/password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save(); // triggers bcrypt pre-save hook
  sendToken(user, 200, res);
});

module.exports = router;