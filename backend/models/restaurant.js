const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: false,
    },
    address: {
        type: Object,
        required: false,
        default: {}
    },
    description: {
        type: String,
        required: true,
    },
    logo: {
        type: String,
        default: '',
    },
    coverImage: {
        type: String,
        default: '',
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    cuisine: {
        type: [String],
        default: ['General'],
    },
    priceRange: {
        type: String,
        default: '$$',
    },
    rating: {
        type: Number,
        default: 0,
    },
    reviewCount: {
        type: Number,
        default: 0,
    },
    phone: {
        type: String,
        default: '',
    },
    email: {
        type: String,
        default: '',
    },
    openingHours: {
        type: Object,
        default: {
            monday: { open: '09:00', close: '22:00' },
            tuesday: { open: '09:00', close: '22:00' },
            wednesday: { open: '09:00', close: '22:00' },
            thursday: { open: '09:00', close: '22:00' },
            friday: { open: '09:00', close: '22:00' },
            saturday: { open: '10:00', close: '23:00' },
            sunday: { open: '10:00', close: '22:00' }
        }
    },
    featuredItems: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'MenuItem',
        default: []
    },
    dateCreated: {
        type: Date,
        default: Date.now,
    }
});

restaurantSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

restaurantSchema.set('toJSON', {
    virtuals: true,
});

// Create and export the model directly
const Restaurant = mongoose.model('Restaurant', restaurantSchema);
module.exports = Restaurant; 