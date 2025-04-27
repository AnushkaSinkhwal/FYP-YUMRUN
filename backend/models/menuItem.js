const mongoose = require('mongoose');

// Schema for individual ingredients
const ingredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    calories: {
        type: Number,
        default: 0
    },
    protein: {
        type: Number,
        default: 0
    },
    carbs: {
        type: Number,
        default: 0
    },
    fat: {
        type: Number,
        default: 0
    },
    sodium: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        default: 0
    },
    isRemovable: {
        type: Boolean,
        default: true
    },
    isDefault: {
        type: Boolean, 
        default: true
    }
}, { _id: true });

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
        default: '',
    },
    image: {
        type: String,
        default: 'uploads/placeholders/food-placeholder.jpg',
    },
    imageUrl: {
        type: String,
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
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
    },
    protein: {
        type: Number,
    },
    carbs: {
        type: Number,
    },
    fat: {
        type: Number,
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
    ingredients: {
        type: [ingredientSchema],
        default: []
    },
    customizationOptions: {
        allowRemoveIngredients: {
            type: Boolean,
            default: true
        },
        allowAddIngredients: {
            type: Boolean,
            default: true
        },
        availableAddOns: {
            type: [ingredientSchema],
            default: []
        },
        servingSizeOptions: {
            type: [String],
            default: ['Regular']
        }
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
    averageRating: {
        type: Number,
        default: 0,
    },
    numberOfRatings: {
        type: Number,
        default: 0,
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Pre-save hook to ensure restaurant ID is valid
menuItemSchema.pre('save', async function(next) {
    try {
        // Skip validation if restaurant field is not modified
        if (!this.isModified('restaurant')) {
            return next();
        }

        // If the restaurant ID is the same as the menu item ID (self-reference), fix it 
        if (this.restaurant && this._id && this.restaurant.toString() === this._id.toString()) {
            console.error(`Detected self-referencing restaurant ID in menu item ${this._id}`);
            // Set restaurant to null for now - it will need to be fixed later
            this.restaurant = null;
            return next(new Error('Menu item cannot reference itself as restaurant'));
        }

        // Get Restaurant model
        const Restaurant = mongoose.model('Restaurant');
        
        // Check if the restaurant exists
        const restaurant = await Restaurant.findById(this.restaurant);
        
        // If not found, check if this might be a User ID instead of a Restaurant ID
        if (!restaurant) {
            const User = mongoose.model('User');
            const user = await User.findById(this.restaurant);
            
            if (user && user.role === 'restaurant') {
                // Get the actual restaurant owned by this user
                const actualRestaurant = await Restaurant.findOne({ owner: this.restaurant });
                
                if (actualRestaurant) {
                    // Set the correct restaurant ID
                    console.log(`Fixing menu item: changing restaurant from user ID ${this.restaurant} to restaurant ID ${actualRestaurant._id}`);
                    this.restaurant = actualRestaurant._id;
                    return next();
                }
            }
            
            // If we can't fix it, throw an error
            return next(new Error('Invalid restaurant ID. Please provide a valid restaurant ID.'));
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

menuItemSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Calculate total nutritional value based on ingredients
menuItemSchema.methods.calculateNutrition = function() {
    if (!this.ingredients || this.ingredients.length === 0) {
        return {
            calories: this.calories,
            protein: this.protein,
            carbs: this.carbs,
            fat: this.fat,
            sodium: this.sodium
        };
    }

    const totalNutrition = this.ingredients.reduce((acc, ingredient) => {
        if (ingredient.isDefault) {
            acc.calories += ingredient.calories || 0;
            acc.protein += ingredient.protein || 0;
            acc.carbs += ingredient.carbs || 0;
            acc.fat += ingredient.fat || 0;
            acc.sodium += ingredient.sodium || 0;
        }
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0 });

    return totalNutrition;
};

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
module.exports = MenuItem;
module.exports.menuItemSchema = menuItemSchema; 