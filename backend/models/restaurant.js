const mongoose = require('mongoose');

const restaurantSchema = mongoose.Schema({
    restaurant_id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        primaryKey: true
    },
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

exports.Restaurant = mongoose.model('Restaurant', restaurantSchema);
exports.restaurantSchema = restaurantSchema; 