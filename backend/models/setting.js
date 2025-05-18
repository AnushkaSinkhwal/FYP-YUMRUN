const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  siteName: { type: String, default: 'YumRun' },
  siteDescription: { type: String, default: 'Food Delivery Platform' },
  contactEmail: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  contactAddress: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema); 