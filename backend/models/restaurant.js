const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    logo: {
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
    cuisine: {
        type: [String],
        default: ['General'],
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