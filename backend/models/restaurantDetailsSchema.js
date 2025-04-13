const mongoose = require('mongoose');

// Restaurant details schema 
const restaurantDetailsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Restaurant name is required'],
        trim: true
    },
    address: {
        type: Object,
        required: [true, 'Restaurant address is required'],
        default: {}
    },
    description: {
        type: String,
        required: [true, 'Restaurant description is required'],
        trim: true
    },
    panNumber: {
        type: String,
        required: [true, 'PAN number is required'],
        trim: true,
        validate: {
            validator: function(v) {
                return /^[0-9]{9}$/.test(v);
            },
            message: props => `${props.value} is not a valid PAN number! Must be 9 digits.`
        }
    },
    approved: {
        type: Boolean,
        default: false
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
    cuisine: {
        type: [String],
        default: ['Healthy', 'Vegetarian']
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    deliveryRadius: {
        type: Number,
        default: 5 // kilometers
    },
    minimumOrder: {
        type: Number,
        default: 0
    },
    deliveryFee: {
        type: Number,
        default: 0
    },
    logo: {
        type: String,
        default: ''
    },
    coverImage: {
        type: String,
        default: ''
    }
}, { _id: false });

module.exports = restaurantDetailsSchema; 