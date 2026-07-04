require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const RefreshToken = require('../models/RefreshToken');

async function resetDatabase() {
  await connectDB();

  const deletedUsers = await User.deleteMany({});
  const deletedProducts = await Product.deleteMany({});
  const deletedCarts = await Cart.deleteMany({});
  const deletedOrders = await Order.deleteMany({});
  const deletedRefreshTokens = await RefreshToken.deleteMany({});

  console.log('✅ Database reset complete');
  console.log(JSON.stringify({
    usersDeleted: deletedUsers.deletedCount,
    productsDeleted: deletedProducts.deletedCount,
    cartsDeleted: deletedCarts.deletedCount,
    ordersDeleted: deletedOrders.deletedCount,
    refreshTokensDeleted: deletedRefreshTokens.deletedCount,
  }, null, 2));

  await mongoose.disconnect();
}

resetDatabase().catch((err) => {
  console.error('❌ Database reset failed:', err);
  process.exit(1);
});
