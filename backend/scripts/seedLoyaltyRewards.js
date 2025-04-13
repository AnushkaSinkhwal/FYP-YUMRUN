const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const LoyaltyReward = require('../models/loyaltyReward');

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading environment variables from: ${envPath}`);
dotenv.config({ path: envPath });

// Get the MongoDB connection URI
const connectionString = process.env.CONNECTION_STRING;

console.log('Loaded environment variables:', Object.keys(process.env));
console.log('Connection string exists:', !!connectionString);

if (!connectionString) {
  console.error('MongoDB connection string not found in environment variables');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Default rewards
const defaultRewards = [
  {
    name: '₹50 off your order',
    description: 'Get ₹50 off your next order',
    pointsRequired: 500,
    value: 50,
    type: 'discount',
    active: true
  },
  {
    name: '₹100 off your order',
    description: 'Get ₹100 off your next order',
    pointsRequired: 1000,
    value: 100,
    type: 'discount',
    active: true
  },
  {
    name: '₹200 off your order',
    description: 'Get ₹200 off your next order',
    pointsRequired: 2000,
    value: 200,
    type: 'discount',
    active: true
  },
  {
    name: 'Free delivery',
    description: 'Get free delivery on your next order',
    pointsRequired: 300,
    value: 'free_delivery',
    type: 'free_delivery',
    active: true
  },
  {
    name: 'Priority order processing',
    description: 'Your order will be prioritized by the restaurant',
    pointsRequired: 250,
    value: 'priority',
    type: 'special',
    active: true
  }
];

const seedRewards = async () => {
  try {
    // Delete existing rewards
    await LoyaltyReward.deleteMany({});
    
    // Insert default rewards
    await LoyaltyReward.insertMany(defaultRewards);
    
    console.log('Default loyalty rewards seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding loyalty rewards:', error);
    process.exit(1);
  }
};

// Run the seeder
seedRewards(); 