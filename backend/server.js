const express = require('express');
const cors    = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const morgan  = require('morgan');
require('dotenv').config();
require('express-async-errors'); // Catches all async errors automatically

const connectDB    = require('./config/db');
const authRoutes   = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes   = require('./routes/cart');
const orderRoutes  = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const adminUsersRoutes = require('./routes/adminUsers');
const errorHandler = require('./middleware/error');
const cookieParser = require('cookie-parser');
const seedIfMissingAdmin = require('./utils/seedIfMissingAdmin');
const path = require('path');


const app = express();

// ─── Connect Database ──────────────────────────────────────
connectDB();

// Warn loudly when MONGO_URI is missing (login will fail with 401 because DB won't connect)
if (!process.env.MONGO_URI) {
  console.warn('⚠️ MONGO_URI is not set. Check backend/.env');
}

// Serve uploaded product images locally for localhost development
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Global Middleware ─────────────────────────────────────
app.use(helmet());
app.use(hpp());

// CORS: allow only configured client in production, allow all in development
app.use(
  cors({ origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : '*', credentials: true })
);

// Global rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(apiLimiter);

// Stricter limiter for auth endpoints (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev')); // Logs every request: method, route, status, time

// ─── Routes ───────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/users', adminUsersRoutes);


// ─── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', env: process.env.NODE_ENV });
});

// ─── 404 handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler (must be last) ──────────────────
app.use(errorHandler);

// Ensure seeded admin exists (dev quality-of-life)
seedIfMissingAdmin().catch((e) => console.error('Seed admin/product failed', e));



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

