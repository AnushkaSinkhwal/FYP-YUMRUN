const mongoose = require('mongoose');

// Notification schema for handling user profile change requests
const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'PROFILE_UPDATE', 
      'RESTAURANT_UPDATE', 
      'RESTAURANT_REGISTRATION', 
      'RESTAURANT_APPROVAL',
      'RESTAURANT_REJECTION',
      'PROFILE_UPDATE_REQUEST',
      'SYSTEM', 
      'ORDER', 
      'REWARD'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAdminNotification: {
    type: Boolean,
    default: false,
    index: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
notificationSchema.index({ status: 1 });
notificationSchema.index({ userId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 