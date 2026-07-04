const express      = require('express');
const router       = express.Router();
const crypto       = require('crypto');
const User         = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt          = require('jsonwebtoken');
const { protect }  = require('../middleware/auth');
const { sendTokens, generateAccessToken } = require('../utils/auth');
const { sendMail } = require('../utils/email');
const validate     = require('../middleware/validate');
const { registerRules, loginRules } = require('../middleware/validators');

// ─── POST /api/auth/register ───────────────────────────────
router.post('/register', registerRules, validate, async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already in use' });
  }

  const user = await User.create({

    name,
    email,
    password,
    role: role || 'user',
  });

  await sendTokens(user, 201, res);
});

// ─── POST /api/auth/login ──────────────────────────────────
router.post('/login', loginRules, validate, async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  await sendTokens(user, 200, res);
});

// ─── POST /api/auth/refresh ────────────────────────────────
// Called automatically by frontend when access token expires
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No refresh token' });
  }

  // Find token in DB — if not found it was already used or deleted
  const stored = await RefreshToken.findOne({ token }).populate('user');
  if (!stored) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }

  // Check if expired
  if (stored.expiresAt < new Date()) {
    await stored.deleteOne();
    return res.status(401).json({ success: false, message: 'Refresh token expired, please login again' });
  }

  // Issue new access token
  const accessToken = generateAccessToken(stored.user._id);
  res.json({ success: true, accessToken });
});

// ─── POST /api/auth/logout ────────────────────────────────
router.post('/logout', async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    await RefreshToken.findOneAndDelete({ token }); // Remove from DB
  }

  res.clearCookie('refreshToken'); // Clear the cookie
  res.json({ success: true, message: 'Logged out successfully' });
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
  await user.save();
  await sendTokens(user, 200, res);
});

// ─── POST /api/auth/forgot-password ───────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same — don't reveal if email exists
  if (!user) {
    return res.json({ success: true, message: 'If that email exists, a reset link was sent' });
  }

  // Generate reset token
  const resetToken  = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken  = hashedToken;
  user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save({ validateBeforeSave: false });

  // In production: send email with reset link
  // For now: return token directly for testing
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  console.log('🔑 Reset URL (dev only):', resetUrl);

  res.json({
    success: true,
    message: 'If that email exists, a reset link was sent',
    ...(process.env.NODE_ENV === 'development' && { resetUrl }), // Only expose in dev
  });
});

// ─── POST /api/auth/reset-password/:token ─────────────────
router.post('/reset-password/:token', async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  // Hash the token from URL to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken:  hashedToken,
    resetPasswordExpire: { $gt: new Date() }, // Must not be expired
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }

  // Set new password and clear reset fields
  user.password            = password;
  user.resetPasswordToken  = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  await sendTokens(user, 200, res);
});

// ─── POST /api/auth/send-verify — send verification email with token
router.post('/send-verify', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.json({ success: true, message: 'If that email exists, a verification link was sent' });

  const verifyToken = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(verifyToken).digest('hex');
  user.verifyToken = hashed;
  user.verifyTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
  // Send email (non-blocking)
  sendMail({
    to: user.email,
    subject: 'Verify your account',
    text: `Verify your account: ${verifyUrl}`,
    html: `<p>Verify your account by clicking <a href="${verifyUrl}">here</a></p>`,
  }).catch(err => console.error('Failed to send verify email', err));

  res.json({ success: true, message: 'If that email exists, a verification link was sent' });
});

// ─── GET /api/auth/verify/:token — verify email token
router.get('/verify/:token', async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ verifyToken: hashed, verifyTokenExpire: { $gt: new Date() } });
  if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });

  user.isVerified = true;
  user.verifyToken = undefined;
  user.verifyTokenExpire = undefined;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Email verified successfully' });
});

module.exports = router;