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
    sodium: {
        type: Number,
        default: 0,
    },
    sugar: {
        type: Number,
        default: 0,
    },
    fiber: {
        type: Number,
        default: 0,
    },
    healthAttributes: {
        isDiabeticFriendly: {
            type: Boolean,
            default: false,
        },
        isLowSodium: {
            type: Boolean,
            default: false,
        },
        isHeartHealthy: {
            type: Boolean,
            default: false,
        },
        isLowGlycemicIndex: {
            type: Boolean,
            default: false,
        },
        isHighProtein: {
            type: Boolean,
            default: false,
        },
        isLowCarb: {
            type: Boolean,
            default: false,
        },
    },
    allergens: {
        type: [String],
        default: [],
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