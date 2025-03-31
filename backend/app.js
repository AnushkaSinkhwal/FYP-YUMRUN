const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const restaurantRoutes = require('./routes/restaurant');
const restaurantsRoutes = require('./routes/restaurants');
const adminRoutes = require('./routes/admin');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

// API Status Route
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'Online',
    message: 'YumRun API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// Not Found Middleware
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Error Handling Middleware
app.use(errorHandler);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 8000;

mongoose.connect(process.env.CONNECTION_STRING)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`MongoDB Connected`);
      console.log(`CORS enabled for origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    });
  })
  .catch((err) => {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  });

module.exports = app;
