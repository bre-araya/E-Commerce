const express    = require('express');
const router     = express.Router();
const Product    = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const validate   = require('../middleware/validate');
const { productRules, reviewRules } = require('../middleware/validators');
const { upload, cloudinary } = require('../config/cloudinary');

// ─── GET /api/products — list with search, filter, pagination ─
router.get('/', async (req, res) => {
  const {
    keyword,
    category,
    minPrice,
    maxPrice,
    page  = 1,
    limit = 12,
    sort  = '-createdAt',
  } = req.query;

  const query = {};
  if (keyword)  query.name = { $regex: keyword, $options: 'i' };
  if (category) query.category = category;
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

// ─── GET /api/products/featured — homepage hero section ───────
// IMPORTANT: This route MUST be before /:id — otherwise Express
// will treat "featured" as a product _id and return a CastError
router.get('/featured', async (req, res) => {
  const products = await Product.find({ featured: true }).limit(8);
  res.json({ success: true, products });
});

// ─── GET /api/products/:id — single product with reviews ──────
router.get('/:id', async (req, res) => {
  const product = await Product
    .findById(req.params.id)
    .populate('reviews.user', 'name avatar');

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  res.json({ success: true, product });
});

// ─── POST /api/products — create with image upload (admin) ────
// upload.array('images', 4) runs BEFORE productRules so that
// req.body is fully populated from the multipart form before
// validation reads it.
router.post(
  '/',
  protect,
  adminOnly,
  upload.array('images', 4),  // Accept up to 4 image files under field name "images"
  productRules,
  validate,
  async (req, res) => {
    // req.files is populated by Multer after successful Cloudinary upload
    const images = req.files?.map((file) => ({
      url:       file.path,      // Permanent Cloudinary HTTPS URL
      public_id: file.filename,  // Used later to delete from Cloudinary
    })) || [];

    // Merge uploaded images into the product body
    const product = await Product.create({ ...req.body, images });
    res.status(201).json({ success: true, product });
  }
);

// ─── PUT /api/products/:id — update with optional new images ──
// productRules removed here intentionally — partial updates
// (e.g. only changing price) should not require all fields again
router.put(
  '/:id',
  protect,
  adminOnly,
  upload.array('images', 4),
  async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Only replace images if admin uploaded new ones
    if (req.files?.length > 0) {
      // Delete every existing image from Cloudinary first
      // WHY: Cloudinary charges for storage — orphaned images cost money
      for (const img of product.images) {
        if (img.public_id) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }

      // Replace with new uploaded images
      req.body.images = req.files.map((file) => ({
        url:       file.path,
        public_id: file.filename,
      }));
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ success: true, product: updated });
  }
);

// ─── DELETE /api/products/:id — delete product + images ───────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Delete all associated images from Cloudinary before removing product
  // WHY: If we delete the DB record first and Cloudinary fails,
  // we get orphaned images with no way to track them
  for (const img of product.images) {
    if (img.public_id) {
      await cloudinary.uploader.destroy(img.public_id);
    }
  }

  await product.deleteOne();
  res.json({ success: true, message: 'Product and all images deleted successfully' });
});

// ─── POST /api/products/:id/reviews — submit review ──────────
router.post('/:id/reviews', protect, reviewRules, validate, async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Prevent duplicate reviews from same user
  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (alreadyReviewed) {
    return res.status(400).json({ success: false, message: 'You already reviewed this product' });
  }

  product.reviews.push({
    user:    req.user._id,
    name:    req.user.name,
    rating:  Number(rating),
    comment,
  });

  // Recalculate average rating and numReviews
  product.calcAverageRating();
  await product.save();

  res.status(201).json({ success: true, message: 'Review submitted successfully' });
});

module.exports = router;