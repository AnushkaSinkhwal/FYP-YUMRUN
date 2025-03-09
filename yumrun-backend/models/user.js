const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');  // For password hashing

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v);  // Validate phone number format (10 digits)
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Validate email format
    },
    password: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^(?=.*[0-9])(?=.*[\W_]).{8,}$/.test(v); 
                // Ensures:
                // - At least 8 characters long
                // - Contains at least 1 number
                // - Contains at least 1 special character
            },
            message: 'Password must be at least 8 characters long and include at least one number and one special character.'
        }
    },
    healthCondition: {
        type: String,
        enum: ['Healthy', 'Diabetes', 'Heart Condition', 'Hypertension', 'Other'],
        default: 'Healthy'
    },
}, { timestamps: true });

// Hash the password before saving to database
userSchema.pre('save', async function(next) {
    if (this.isModified('password') || this.isNew) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Method to compare the entered password with the stored hashed password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
