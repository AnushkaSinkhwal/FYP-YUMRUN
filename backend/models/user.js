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

// Delivery rider details schema
const deliveryRiderDetailsSchema = new mongoose.Schema({
    vehicleType: {
        type: String,
        enum: ['motorcycle', 'scooter', 'bicycle'],
        required: [true, 'Vehicle type is required']
    },
    licenseNumber: {
        type: String,
        required: [true, 'License number is required'],
        trim: true
    },
    vehicleRegistrationNumber: {
        type: String,
        required: [true, 'Vehicle registration number is required'],
        trim: true
    },
    approved: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please provide your full name'],
        trim: true,
        minlength: [3, 'Name must be at least 3 characters']
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
                return /^\d{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number! Must be 10 digits.`
        }
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['customer', 'restaurantOwner', 'deliveryRider', 'admin'],
        default: 'customer'
    },
    healthCondition: {
        type: String,
        enum: ['Healthy', 'Diabetes', 'Heart Condition', 'Hypertension', 'Other'],
        default: 'Healthy'
    },
    settings: {
        type: Object,
        default: {
            notifications: {
                orderUpdates: true,
                promotions: false,
                newsletters: false,
                deliveryUpdates: true
            },
            preferences: {
                darkMode: false,
                language: 'en'
            },
            privacy: {
                shareOrderHistory: false,
                allowLocationTracking: true
            }
        }
    },
    restaurantDetails: {
        type: restaurantDetailsSchema,
        required: function() {
            return this.role === 'restaurantOwner';
        }
    },
    deliveryRiderDetails: {
        type: deliveryRiderDetailsSchema,
        required: function() {
            return this.role === 'deliveryRider';
        }
    },
    isActive: {
        type: Boolean,
        default: true
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

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
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
