const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { productRules, reviewRules } = require('../middleware/validators');

// ─── GET /api/products — list with search, filter, pagination
router.get('/', async (req, res) => {
  const { keyword, category, minPrice, maxPrice, page = 1, limit = 12, sort = '-createdAt' } = req.query;

  const query = {};
  if (keyword)   query.name = { $regex: keyword, $options: 'i' };
  if (category)  query.category = category;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const total    = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(sort)
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  res.json({
    success: true,
    total,
    page:  Number(page),
    pages: Math.ceil(total / limit),
    products,
  });
});

// ─── GET /api/products/featured — for homepage hero
router.get('/featured', async (req, res) => {
  const products = await Product.find({ featured: true }).limit(8);
  res.json({ success: true, products });
});

// ─── GET /api/products/:id
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id).populate('reviews.user', 'name avatar');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// ─── POST /api/products — admin only
router.post('/', protect, adminOnly, productRules, validate, async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
});

// ─── PUT /api/products/:id — admin only
router.put('/:id', protect, adminOnly, productRules, validate, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// ─── DELETE /api/products/:id — admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, message: 'Product deleted successfully' });
});

// ─── POST /api/products/:id/reviews — logged in users
router.post('/:id/reviews', protect, reviewRules, validate, async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  // Check if user already reviewed this product
  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (alreadyReviewed) {
    return res.status(400).json({ success: false, message: 'You already reviewed this product' });
  }

  product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment });
  product.calcAverageRating();
  await product.save();

  res.status(201).json({ success: true, message: 'Review submitted' });
});

module.exports = router;