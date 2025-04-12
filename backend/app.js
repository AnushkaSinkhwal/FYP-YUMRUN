const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cron = require('node-cron');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
const offerRoutes = require('./routes/offers');
const recommendationsRoutes = require('./routes/recommendations');
const reviewsRoutes = require('./routes/reviews');
const favoritesRoutes = require('./routes/favorites');
const paymentRoutes = require('./routes/payment');
const nutritionRoutes = require('./routes/nutrition');
const loyaltyRoutes = require('./routes/loyalty');
const searchRoutes = require('./routes/search');
const contactRoutes = require('./routes/contact');
const deliveryRoutes = require('./routes/delivery');

// --- Static File Serving ---
// Serve files from the 'uploads' directory publicly at /uploads
const uploadsPath = path.resolve(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));
console.log(`Serving static files from: ${uploadsPath} at /uploads`);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/delivery', deliveryRoutes);

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
      console.log(`CORS enabled for origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      // Log Khalti configuration status
      console.log(`Khalti API configuration:`, { 
        baseUrl: process.env.NODE_ENV === 'production' ? 'https://khalti.com/api/v2' : 'https://a.khalti.com/api/v2',
        secretKeyAvailable: !!process.env.KHALTI_SECRET_KEY
      });
      
      // Set up cron job to process expired loyalty points daily at midnight
      cron.schedule('0 0 * * *', async () => {
        try {
          console.log('Running scheduled job: Processing expired loyalty points');
          const { processExpiredPoints } = require('./utils/loyaltyUtils');
          const User = require('./models/user');
          const LoyaltyTransaction = require('./models/loyaltyTransaction');
          
          const processed = await processExpiredPoints(LoyaltyTransaction, User);
          console.log(`Successfully processed ${processed} expired point transactions`);
        } catch (error) {
          console.error('Error processing expired loyalty points:', error);
        }
      });
    });
  })
  .catch((err) => {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  });

module.exports = app;
