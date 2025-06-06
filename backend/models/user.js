const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // For password hashing
const validator = require("validator");
const crypto = require('crypto'); // Import crypto for token generation
const restaurantDetailsSchema = require("./restaurantDetailsSchema");

// Restaurant details schema
// const restaurantDetailsSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: [true, 'Restaurant name is required'],
//         trim: true
//     },
//     address: {
//         type: String,
//         required: [true, 'Restaurant address is required'],
//         trim: true
//     },
//     description: {
//         type: String,
//         required: [true, 'Restaurant description is required'],
//         trim: true
//     },
//     panNumber: {
//         type: String,
//         required: [true, 'PAN number is required'],
//         trim: true,
//         validate: {
//             validator: function(v) {
//                 return /^[0-9]{9}$/.test(v);
//             },
//             message: props => `${props.value} is not a valid PAN number! Must be 9 digits.`
//         }
//     },
//     approved: {
//         type: Boolean,
//         default: false
//     },
//     openingHours: {
//         type: Object,
//         default: {
//             monday: { open: '09:00', close: '22:00' },
//             tuesday: { open: '09:00', close: '22:00' },
//             wednesday: { open: '09:00', close: '22:00' },
//             thursday: { open: '09:00', close: '22:00' },
//             friday: { open: '09:00', close: '22:00' },
//             saturday: { open: '10:00', close: '23:00' },
//             sunday: { open: '10:00', close: '22:00' }
//         }
//     },
//     cuisine: {
//         type: [String],
//         default: ['Healthy', 'Vegetarian']
//     },
//     isOpen: {
//         type: Boolean,
//         default: true
//     },
//     deliveryRadius: {
//         type: Number,
//         default: 5 // kilometers
//     },
//     minimumOrder: {
//         type: Number,
//         default: 0
//     },
//     deliveryFee: {
//         type: Number,
//         default: 0
//     },
//     logo: {
//         type: String,
//         default: ''
//     },
//     coverImage: {
//         type: String,
//         default: ''
//     }
// }, { _id: false });

// Delivery rider details schema
const deliveryRiderDetailsSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      enum: ["motorcycle", "scooter", "bicycle", "car"],
      required: [true, "Vehicle type is required"],
    },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      trim: true,
    },
    vehicleRegistrationNumber: {
      type: String,
      required: [true, "Vehicle registration number is required"],
      trim: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [85.324, 27.7172], // Default to Kathmandu coordinates
      },
    },
    ratings: {
      average: { type: Number, default: 5 },
      count: { type: Number, default: 0 },
    },
    completedDeliveries: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// Health and dietary preferences schema
const healthProfileSchema = new mongoose.Schema(
  {
    dietaryPreferences: {
      type: [String],
      enum: [
        "Vegetarian",
        "Vegan",
        "Pescatarian",
        "Keto",
        "Paleo",
        "Low Carb",
        "Low Fat",
        "Gluten Free",
        "Dairy Free",
        "None",
      ],
      default: ["None"],
    },
    healthConditions: {
      type: [String],
      enum: [
        "None",
        "Diabetes",
        "Heart Disease",
        "Hypertension",
        "High Cholesterol",
        "Obesity",
        "Other",
      ],
      default: ["None"],
    },
    allergies: {
      type: [String],
      default: [],
    },
    weightManagementGoal: {
      type: String,
      enum: ["Maintain", "Lose", "Gain", "None"],
      default: "None",
    },
    fitnessLevel: {
      type: String,
      enum: [
        "Sedentary",
        "Light Activity",
        "Moderate Activity",
        "Very Active",
        "Extra Active",
        "None",
      ],
      default: "None",
    },
    dailyCalorieGoal: {
      type: Number,
      default: 2000,
    },
    macroTargets: {
      protein: {
        type: Number, // percentage
        default: 25,
      },
      carbs: {
        type: Number, // percentage
        default: 50,
      },
      fat: {
        type: Number, // percentage
        default: 25,
      },
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOTP: {
      type: String,
      default: null,
    },
    emailVerificationOTPExpires: {
      type: Date,
      default: null,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false // Hide password by default when querying
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'delivery_rider', 'restaurant'],
      default: "customer",
    },
    address: {
      type: Object,
      default: {},
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      validate: {
        validator: function (v) {
          return /^[0-9]{10}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid phone number! Must be 10 digits.`,
      },
    },
    profilePic: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notifications: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      newsletters: { type: Boolean, default: false },
      deliveryUpdates: { type: Boolean, default: true }
    },
    favorites: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'MenuItem',
      default: []
    },
    // Loyalty points system
    loyaltyPoints: {
      type: Number,
      default: 0
    },
    lifetimeLoyaltyPoints: {
      type: Number,
      default: 0
    },
    loyaltyTier: {
      type: String,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
      default: 'BRONZE'
    },
    tierUpdateDate: {
      type: Date,
      default: Date.now
    },
    // Health profile for diet and health recommendations
    healthProfile: {
      height: { type: Number, default: 0 }, // in cm
      weight: { type: Number, default: 0 }, // in kg
      allergies: [String],
      healthConditions: [String], // like diabetes, hypertension
      dietaryPreferences: [String], // like vegetarian, vegan, keto
      fitnessGoals: [String], // like weight loss, muscle gain
      activityLevel: {
        type: String,
        enum: [
          "sedentary",
          "lightly_active",
          "moderately_active",
          "very_active",
          "extremely_active",
        ],
        default: "moderately_active",
      },
      // Daily targets
      dailyTargets: {
        calories: { type: Number, default: 2000 },
        protein: { type: Number, default: 50 }, // in grams
        carbs: { type: Number, default: 250 }, // in grams
        fat: { type: Number, default: 70 }, // in grams
        fiber: { type: Number, default: 25 }, // in grams
      },
      // Food preferences for recommendations
      favouriteFoods: [String],
      dislikedFoods: [String],
    },
    // If the user is a restaurant owner
    restaurantDetails: restaurantDetailsSchema,
    // Add restaurant ID reference
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null
    },
    // If user is a delivery rider
    deliveryRiderDetails: deliveryRiderDetailsSchema,
    // Add fields for password reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for id
userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  try {
    console.log('comparePassword:', {
      userId: this._id.toString(),
      email: this.email,
      storedPasswordLength: this.password.length,
      enteredPasswordLength: enteredPassword.length,
    });
    
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log('Password match result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error in comparePassword:', error);
    return false;
  }
};

// Method to generate password reset token
userSchema.methods.getResetPasswordToken = function() {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire time (e.g., 10 minutes from now)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Return the unhashed token (to be sent via email)
    return resetToken;
};

// Update timestamps on save
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for geospatial queries on rider location
userSchema.index({ "deliveryRiderDetails.currentLocation": "2dsphere" });

// Pre-save middleware to set fullName based on firstName and lastName if not provided
userSchema.pre('save', function (next) {
  // Only set fullName if it's not already set or if firstName/lastName have changed
  if (!this.fullName || this.isModified('firstName') || this.isModified('lastName')) {
    this.fullName = `${this.firstName} ${this.lastName}`.trim();
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
