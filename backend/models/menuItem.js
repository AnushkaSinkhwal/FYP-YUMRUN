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
        ref: 'User',
        required: true,
    },
    category: {
        type: String,
        enum: [
            'Appetizers',
            'Main Course',
            'Desserts',
            'Drinks',
            'Beverages',
            'Sides',
            'Specials',
            'Breakfast',
            'Lunch',
            'Dinner',
            'Vegan',
            'Vegetarian',
            'Gluten-Free'
        ],
        default: 'Main Course'
    },
    calories: {
        type: Number,
        default: 0,
    },
    protein: {
        type: Number,
        default: 0,
    },
    carbs: {
        type: Number,
        default: 0,
    },
    fat: {
        type: Number,
        default: 0,
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
    isAvailable: {
        type: Boolean,
        default: true,
    },
    dateCreated: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

menuItemSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

exports.MenuItem = mongoose.model('MenuItem', menuItemSchema);
exports.menuItemSchema = menuItemSchema; 