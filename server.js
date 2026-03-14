require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect MongoDB and seed admin
const startServer = async () => {
  await connectDB();
  await seedAdmin();
};

startServer();

// CORS first so headers are not overridden
// FRONTEND_URL = comma-separated allowed origins (e.g. http://localhost:5173,https://your-app.vercel.app)
// ALLOW_LOCALHOST = set to "true" to also allow http://localhost:* and http://127.0.0.1:* (for local dev against live backend)
const corsOrigin = process.env.FRONTEND_URL;
const allowLocalhost = process.env.ALLOW_LOCALHOST === 'true' || process.env.ALLOW_LOCALHOST === '1';
const allowedOrigins = corsOrigin
  ? corsOrigin.split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean)
  : [];
const isLocalhost = (origin) => {
  if (!origin || typeof origin !== 'string') return false;
  try {
    const u = new URL(origin);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch {
    return false;
  }
};
const corsOptions = {
  credentials: true,
  origin: allowedOrigins.length === 0 && !allowLocalhost
    ? true
    : (origin, cb) => {
      if (!origin) return cb(null, true);
      const normalized = origin.replace(/\/$/, '');
      const inList = allowedOrigins.some((o) => o === origin || o === normalized);
      const fromLocalhost = allowLocalhost && isLocalhost(origin);
      const allowed = inList || fromLocalhost;
      return cb(null, allowed ? origin : false);
    },
};
app.use(cors(corsOptions));

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Body parser
app.use(
  express.json({
    verify: (req, res, buf) => {
      // Save raw body for Stripe webhook signature verification
      if (req.originalUrl.startsWith('/api/payment/webhook')) {
        req.rawBody = buf;
      }
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
