const mongoose = require('mongoose');

const menuItemSchema = mongoose.Schema({
    menu_id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        primaryKey: true
    },
    item_name: {
        type: String,
        required: true,
    },
    item_price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        default: '',
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
    calories: {
        type: Number,
        required: true,
    },
    protein: {
        type: Number,
        required: true,
    },
    carbs: {
        type: Number,
        required: true,
    },
    fat: {
        type: Number,
        required: true,
    },
    isVegetarian: {
        type: Boolean,
        default: false,
    },
    isVegan: {
        type: Boolean,
        default: false,
    },
    isGlutenFree: {
        type: Boolean,
        default: false,
    },
    isCustomizable: {
        type: Boolean,
        default: true,
    },
    dateCreated: {
        type: Date,
        default: Date.now,
    }
});

menuItemSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

menuItemSchema.set('toJSON', {
    virtuals: true,
});

exports.MenuItem = mongoose.model('MenuItem', menuItemSchema);
exports.menuItemSchema = menuItemSchema; 