const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Try to load Stripe package and initialize only if available
let stripe;
try {
  // Require inside try so missing package doesn't crash the app
  // eslint-disable-next-line global-require
  const Stripe = require('stripe');
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY not set — /api/payments endpoints will fail until configured');
  }
  stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');
} catch (err) {
  // If Stripe package missing or key invalid, keep stripe undefined and return errors in handlers
  stripe = undefined;
}

// POST /api/payments/create-intent
// Body: { amount: number (in cents), currency?: string }
router.post('/create-intent', protect, async (req, res) => {
  const { amount, currency = 'usd' } = req.body;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  if (!stripe) {
    return res.status(500).json({ success: false, message: 'Stripe not configured on server' });
  }

  try {
    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { user: String(req.user._id) },
    });

    res.json({ success: true, clientSecret: intent.client_secret, intentId: intent.id });
  } catch (err) {
    console.error('Stripe create intent error', err.message || err);
    res.status(500).json({ success: false, message: 'Failed to create payment intent' });
  }
});

module.exports = router;
