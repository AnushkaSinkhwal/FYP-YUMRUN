const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');  // For password hashing
const validator = require('validator');

// Restaurant details schema
const restaurantDetailsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Restaurant name is required'],
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Restaurant address is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    cuisineType: {
        type: String,
        trim: true
    },
    approved: {
        type: Boolean,
        default: false
    },
    approvedAt: {
        type: Date
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true,
        minlength: [3, 'Name must be at least 3 characters']
    },
    username: {
        type: String,
        trim: true,
        unique: true,
        sparse: true, // Allows multiple null values (useful during creation)
        minlength: [3, 'Username must be at least 3 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Please provide your phone number'],
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v);  // Validate phone number format (10 digits)
            },
            message: props => `${props.value} is not a valid phone number! Must be 10 digits.`
        }
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    healthCondition: {
        type: String,
        enum: ['Healthy', 'Diabetes', 'Heart Condition', 'Hypertension', 'Other'],
        default: 'Healthy'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isRestaurantOwner: {
        type: Boolean,
        default: false
    },
    isDeliveryStaff: {
        type: Boolean,
        default: false
    },
    restaurantDetails: {
        type: restaurantDetailsSchema,
        required: function() {
            return this.isRestaurantOwner === true;
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for id
userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return this.name;
});

// Function to generate username from email
const generateUsernameFromEmail = (email) => {
    if (!email) return null;
    const parts = email.split('@');
    return parts[0].toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Pre-save hook to generate username from email if not provided
userSchema.pre('save', async function(next) {
    // Generate username from email if not provided
    if (!this.username) {
        let baseUsername = generateUsernameFromEmail(this.email);
        let username = baseUsername;
        let count = 1;
        
        // Check if username exists and add number if it does
        let userExists = await mongoose.models.User.findOne({ username });
        while (userExists) {
            username = `${baseUsername}${count}`;
            count++;
            userExists = await mongoose.models.User.findOne({ username });
        }
        
        this.username = username;
    }
    next();
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
    // Only hash the password if it's been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        
        // Hash the password with the salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error(error);
    }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
