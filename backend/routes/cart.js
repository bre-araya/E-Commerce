const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// All cart routes require login
router.use(protect);

// ─── GET /api/cart
router.get('/', async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name price images stock');
  if (!cart) return res.json({ success: true, cart: { items: [], totalPrice: 0 } });
  res.json({ success: true, cart });
});

// ─── POST /api/cart — add item
router.post('/', async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  // Validate product exists and has stock
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  if (product.stock < quantity) {
    return res.status(400).json({ success: false, message: `Only ${product.stock} items in stock` });
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    // First time — create cart
    cart = await Cart.create({
      user: req.user._id,
      items: [{ product: product._id, name: product.name, price: product.price, image: product.images[0]?.url, quantity }],
    });
  } else {
    const existingItem = cart.items.find((i) => i.product.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity; // Increment if already in cart
    } else {
      cart.items.push({ product: product._id, name: product.name, price: product.price, image: product.images[0]?.url, quantity });
    }
    await cart.save();
  }

  res.json({ success: true, cart });
});

// ─── PUT /api/cart/:itemId — update quantity
router.put('/:itemId', async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

  const item = cart.items.id(req.params.itemId);
  if (!item) return res.status(404).json({ success: false, message: 'Item not found in cart' });

  if (quantity <= 0) {
    item.deleteOne(); // Remove if quantity set to 0
  } else {
    item.quantity = quantity;
  }

  await cart.save();
  res.json({ success: true, cart });
});

// ─── DELETE /api/cart/:itemId — remove one item
router.delete('/:itemId', async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

  cart.items = cart.items.filter((i) => i._id.toString() !== req.params.itemId);
  await cart.save();
  res.json({ success: true, cart });
});

// ─── DELETE /api/cart — clear entire cart
router.delete('/', async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user._id });
  res.json({ success: true, message: 'Cart cleared' });
});

module.exports = router;