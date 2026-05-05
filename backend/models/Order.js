const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true },
  image:    { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items:           [orderItemSchema],
    shippingAddress: {
      fullName:   { type: String, required: true },
      address:    { type: String, required: true },
      city:       { type: String, required: true },
      postalCode: { type: String, required: true },
      country:    { type: String, required: true },
      phone:      { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ['Cash on Delivery', 'Credit Card', 'Mobile Money'],
      default: 'Cash on Delivery',
    },
    itemsPrice:    { type: Number, required: true },
    shippingPrice: { type: Number, required: true, default: 0 },
    totalPrice:    { type: Number, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    deliveredAt: Date,
    cancelledAt: Date,
    notes:       String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);