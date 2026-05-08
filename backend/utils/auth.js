const jwt        = require('jsonwebtoken');
const crypto     = require('crypto');
const RefreshToken = require('../models/RefreshToken');

// Short-lived access token (15 minutes)
exports.generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

// Generate a secure random refresh token string
exports.generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(64).toString('hex'); // Cryptographically secure random string

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  // Save to DB
  await RefreshToken.create({ token, user: userId, expiresAt });
  return token;
};

// Send both tokens in response
exports.sendTokens = async (user, statusCode, res) => {
  const accessToken  = exports.generateAccessToken(user._id);
  const refreshToken = await exports.generateRefreshToken(user._id);

  // Refresh token goes in httpOnly cookie — JS cannot read this
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,   // Not accessible via JavaScript
    secure:   process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });

  res.status(statusCode).json({
    success:     true,
    accessToken, // Frontend stores this in memory only
    user: {
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
};