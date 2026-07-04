const express = require('express');
const router = express.Router();

const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/admin/users — list all users (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const p = Number(page);
  const l = Number(limit);

  const total = await User.countDocuments({});

  const users = await User.find({})
    .select('name email role avatar isVerified createdAt')
    .sort('-createdAt')
    .limit(l)
    .skip((p - 1) * l);

  res.json({ success: true, total, page: p, limit: l, pages: Math.ceil(total / l), users });
});

// POST /api/admin/users — create user with chosen role (admin)
// Body: { name, email, password, role }
router.post('/', protect, adminOnly, async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'name, email, password are required' });
  }

  if (role && !['admin', 'user'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user',
  });

  res.status(201).json({ success: true, user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
});

// PUT /api/admin/users/:id/role — change role (admin)
router.put('/:id/role', protect, adminOnly, async (req, res) => {
  const { role } = req.body;
  if (!role || !['admin', 'user'].includes(role)) {
    return res.status(400).json({ success: false, message: 'role must be admin or user' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  user.role = role;
  await user.save();

  res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
});

module.exports = router;

