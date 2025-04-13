require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Restaurant = require('../models/restaurant');
const MenuItem = require('../models/menuItem');

// Connection string from .env or default
const connectionString = process.env.CONNECTION_STRING;

console.log('Using connection string:', connectionString);

// Test users data
const testUsers = [
  // Admin user
  {
    firstName: 'Admin',
    lastName: 'User',
    username: 'admin',
    phone: '1234567890',
    email: 'admin@yumrun.com',
    password: 'Secret@123',
    role: 'admin',
    healthCondition: 'Healthy',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Restaurant owner
  {
    firstName: 'Restaurant',
    lastName: 'Owner',
    username: 'restaurant',
    phone: '9876543210',
    email: 'owner@yumrun.com',
    password: 'Secret@123',
    role: 'restaurant',
    restaurantDetails: {
      name: 'Tasty Bites Restaurant',
      address: '123 Food Street, Foodville',
      description: 'A family-friendly restaurant serving delicious meals',
      cuisineType: 'Multi-cuisine',
      approved: true,
      approvedAt: new Date(),
    },
    healthCondition: 'Healthy',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Regular user
  {
    firstName: 'Regular',
    lastName: 'User',
    username: 'user',
    phone: '5555555555',
    email: 'user@yumrun.com',
    password: 'Secret@123',
    role: 'customer',
    healthCondition: 'Healthy',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Delivery Rider
  {
    firstName: 'Delivery',
    lastName: 'Rider',
    username: 'delivery',
    phone: '9876543210',
    email: 'delivery@yumrun.com',
    password: 'Secret@123',
