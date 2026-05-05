require('dotenv').config();
const mongoose = require('mongoose');
const Product  = require('../models/Product');
const User     = require('../models/User');
const connectDB = require('../config/db');

const products = [
  { name: 'Wireless Headphones Pro', description: 'Premium noise-cancelling wireless headphones with 30hr battery life.', price: 89.99, category: 'Electronics', stock: 50, featured: true, images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' }] },
  { name: 'Running Shoes Ultra', description: 'Lightweight performance running shoes for all terrains.', price: 129.99, category: 'Sports', stock: 30, featured: true, images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' }] },
  { name: 'Smart Watch Series X', description: 'Feature-packed smartwatch with health tracking and GPS.', price: 249.99, category: 'Electronics', stock: 25, featured: true, images: [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' }] },
  { name: 'Minimalist Backpack', description: 'Sleek 20L backpack perfect for daily commute and travel.', price: 59.99, category: 'Other', stock: 40, images: [{ url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' }] },
  { name: 'The Clean Coder', description: 'A code of conduct for professional programmers by Robert C. Martin.', price: 34.99, category: 'Books', stock: 100, images: [{ url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400' }] },
  { name: 'Coffee Maker Deluxe', description: 'Programmable 12-cup coffee maker with built-in grinder.', price: 79.99, category: 'Home', stock: 20, images: [{ url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400' }] },
];

const seed = async () => {
  await connectDB();
  await Product.deleteMany({});
  await User.deleteMany({});

  // Create admin user
  await User.create({
    name: 'Admin User',
    email: 'admin@ecommerce.com',
    password: 'admin123',
    role: 'admin',
  });

  await Product.insertMany(products);
  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin: admin@ecommerce.com / admin123');
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });