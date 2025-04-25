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
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    isFeatured: {
        
    },
    description: {
        type: String,
        default: '',
    },
    logo: {
        type: String,
        default: 'uploads/placeholders/restaurant-placeholder.jpg',
    },
    coverImage: {
        type: String,
        default: 'uploads/placeholders/restaurant-placeholder.jpg',
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending_approval', 'approved', 'rejected', 'deleted'],
        default: 'pending_approval',
        required: true,
    },
    isOpen: {
        type: Boolean,
        default: true,
    },
    cuisine: {
        type: [String],
        default: [],
    },
    priceRange: {
        type: String,
        default: '$$',
    },
    rating: {
        type: Number,
        default: 0,
    },
    totalRatings: {
        type: Number,
        default: 0,
    },
    reviewCount: {
        type: Number,
        default: 0,
    },
    contactInfo: {
        phone: String,
        email: String,
        website: String
    },
    panNumber: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^[0-9]{9}$/.test(v);
            },
            message: props => `${props.value} is not a valid PAN number! Must be 9 digits.`
        }
    },
    openingHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String }
    },
    featuredItems: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'MenuItem',
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true
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