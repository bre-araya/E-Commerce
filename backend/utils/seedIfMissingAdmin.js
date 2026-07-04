const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const dotenv = require('dotenv');

dotenv.config();

async function seedIfMissingAdmin() {
  await connectDB();

  const adminEmail = 'admin@ecommerce.com';
  const admin = await User.findOne({ email: adminEmail });

  if (!admin) {
    // Create admin user (role: admin)
    await User.create({
      name: 'Admin User',
      email: adminEmail,
      password: 'admin123',
      role: 'admin',
    });
    console.log('✅ Admin user ensured:', adminEmail);
  }

  // Keep the catalog empty until an admin adds products through the panel.
  const productCount = await Product.countDocuments({});
  console.log(`✅ Product catalog ready (${productCount} products currently stored)`);

}

module.exports = seedIfMissingAdmin;

