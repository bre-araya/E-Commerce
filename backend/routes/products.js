const express    = require('express');
const router     = express.Router();
const Product    = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const validate   = require('../middleware/validate');
const { productRules, reviewRules } = require('../middleware/validators');
const { upload, cloudinary } = require('../config/cloudinary');
const Order = require('../models/Order');

const parseSpecifications = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item) => item && (item.key?.trim() || item.value?.trim()));
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item) => item && (item.key?.trim() || item.value?.trim()))
        : [];
    } catch {
      return [];
    }
  }
  return [];
};

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

    const payload = {
      ...req.body,
      images,
      specifications: parseSpecifications(req.body.specifications),
    };
    const product = await Product.create(payload);
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

    // Only replace images if user uploaded new ones
    if (req.files?.length > 0) {
      // Delete every existing image from Cloudinary first
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

    if (req.body.specifications !== undefined) {
      req.body.specifications = parseSpecifications(req.body.specifications);
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

// ─── POST /api/products/import-csv — import products from CSV or JSON array (admin)
router.post('/import-csv', protect, adminOnly, async (req, res) => {
  // Accept either raw CSV text in req.body.csv or JSON array in req.body.products
  const csv = req.body.csv;
  const productsArray = req.body.products;

  if (!csv && !Array.isArray(productsArray)) {
    return res.status(400).json({ success: false, message: 'No CSV or products provided' });
  }

  const rows = [];
  if (csv) {
    const lines = csv.split(/\r?\n/).filter(Boolean);
    const headers = lines.shift().split(',').map(h => h.trim());
    for (const line of lines) {
      const cols = line.split(',');
      const obj = {};
      headers.forEach((h, i) => { obj[h] = cols[i] ? cols[i].trim() : ''; });
      rows.push(obj);
    }
  } else {
    for (const p of productsArray) rows.push(p);
  }

  const created = [];
  for (const r of rows) {
    try {
      const doc = await Product.create({
        name: r.name || 'Unnamed',
        description: r.description || '',
        price: Number(r.price) || 0,
        category: r.category || 'Other',
        stock: Number(r.stock) || 0,
        featured: r.featured === 'true' || r.featured === true,
        images: r.image ? [{ url: r.image }] : [],
      });
      created.push(doc);
    } catch (err) {
      // skip invalid rows
      console.error('Import product failed', err.message);
    }
  }

  res.json({ success: true, created: created.length });
});

// ─── GET /api/products/export/products.csv — export products as CSV (admin)
router.get('/export/products', protect, adminOnly, async (req, res) => {
  const products = await Product.find().limit(10000);
  const headers = ['_id','name','description','price','category','stock','featured','image'];
  const lines = [headers.join(',')];
  for (const p of products) {
    const row = [p._id, p.name, (p.description||'').replace(/,/g, ' '), p.price, p.category, p.stock, p.featured, p.images[0]?.url||''];
    lines.push(row.join(','));
  }
  const csv = lines.join('\n');
  res.header('Content-Type', 'text/csv');
  res.attachment('products.csv').send(csv);
});

// ─── GET /api/products/export/orders.csv — export orders as CSV (admin)
router.get('/export/orders', protect, adminOnly, async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').limit(10000);
  const headers = ['_id','userName','userEmail','itemsCount','itemsPrice','shippingPrice','totalPrice','status','createdAt'];
  const lines = [headers.join(',')];
  for (const o of orders) {
    const row = [o._id, o.user?.name||'', o.user?.email||'', o.items.length, o.itemsPrice, o.shippingPrice, o.totalPrice, o.status, o.createdAt.toISOString()];
    lines.push(row.join(','));
  }
  const csv = lines.join('\n');
  res.header('Content-Type', 'text/csv');
  res.attachment('orders.csv').send(csv);
});

module.exports = router;
