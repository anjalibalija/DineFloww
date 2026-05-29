const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const initSeed = require('./utils/initSeed');

// Automatically seed data if needed
initSeed();

// Route files
const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const tableRoutes = require('./routes/tableRoutes');
const globalTableRoutes = require('./routes/globalTableRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const couponRoutes = require('./routes/couponRoutes');
const aiRoutes = require('./routes/aiRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
// We mount tableRoutes under restaurants to get /api/restaurants/:id/tables
app.use('/api/restaurants/:id/tables', tableRoutes);
app.use('/api/tables', globalTableRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api', couponRoutes); // /api/puzzle and /api/coupons
app.use('/api/ai', aiRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5050;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. If you are on macOS, AirPlay Receiver might be using this port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

// Keep the event loop alive (Workaround for Node/Prisma early exit issue)
setInterval(() => {}, 1000 * 60 * 60);
