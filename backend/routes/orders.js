const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const validate = require('../middleware/validate');
const { orderRules } = require('../middleware/validators');
const { protect, adminOnly } = require('../middleware/auth');

// ─── POST /api/orders — place order from cart
router.post('/', protect, orderRules, validate, async (req, res) => {
  const { shippingAddress, paymentMethod, notes, paymentIntentId } = req.body;

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  // Calculate prices
  const itemsPrice    = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingPrice = itemsPrice > 100 ? 0 : 10; // Free shipping over $100
  const totalPrice    = itemsPrice + shippingPrice;

  // Create the order
  const order = await Order.create({
    user: req.user._id,
    items: cart.items.map((i) => ({
      product:  i.product,
      name:     i.name,
      price:    i.price,
      quantity: i.quantity,
      image:    i.image,
    })),
    shippingAddress,
    paymentMethod,
    paymentIntentId,
    itemsPrice,
    shippingPrice,
    totalPrice,
    notes,
  });

  // Decrement stock for each product ordered
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity, sold: item.quantity },
    });
  }

  // Clear the cart after order placed
  await Cart.findOneAndDelete({ user: req.user._id });

    // Generate invoice PDF and send order confirmation email in background
    try {
      const { generateInvoiceBuffer } = require('../utils/invoice');
      const { enqueue } = require('../utils/worker');
      const invoiceBuffer = await generateInvoiceBuffer(
        // Populate user for invoice
        await order.populate('user', 'name email').execPopulate?.() || (await Order.findById(order._id).populate('user', 'name email'))
      );

      // Enqueue email send task with attachment
      enqueue({
        type: 'sendEmail',
        payload: {
          to: req.user.email,
          subject: `Order Confirmation - ${order._id}`,
          text: `Thanks for your order! Order ID: ${order._id}`,
          attachments: [
            { filename: `invoice_${order._id}.pdf`, content: invoiceBuffer },
          ],
        },
      });
    } catch (err) {
      console.error('Failed to generate/send invoice', err);
    }

    res.status(201).json({ success: true, order });
});

// ─── GET /api/orders/my — user's order history
router.get('/my', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.json({ success: true, orders });
});

// ─── GET /api/orders — all orders (admin only)
// Must come BEFORE /:id route so Express matches this first
router.get('/', protect, adminOnly, async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { status } : {};
  const total  = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort('-createdAt')
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  res.json({ success: true, total, orders });
});

// ─── GET /api/orders/:id — single order detail
router.get('/:id', protect, async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  // Users can only see their own orders; admins see all
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  res.json({ success: true, order });
});

// ─── PUT /api/orders/:id/status — update status (admin)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  const { status } = req.body;
  const update = { status };
  if (status === 'Delivered') update.deliveredAt = Date.now();
  if (status === 'Cancelled') update.cancelledAt = Date.now();

  const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, order });
});

module.exports = router;