const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  options: [
    {
      name: String,
      value: String,
      price: Number
    }
  ],
  customization: {
    removedIngredients: [String],
    addedIngredients: [{
      name: String,
      price: Number
    }],
    servingSize: {
      type: String,
      default: 'Regular'
    },
    specialInstructions: String,
    cookingMethod: { type: String },
    cookingPrice: { type: Number, default: 0 }
  },
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    sodium: Number,
    fiber: Number,
    sugar: Number
  }
});

const statusUpdateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  items: [orderItemSchema],
  totalPrice: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  tip: {
    type: Number,
    default: 0
  },
  loyaltyPointsEarned: {
    type: Number,
    default: 0
  },
  loyaltyPointsUsed: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    default: function() {
      return this.totalPrice + this.deliveryFee + this.tax + this.tip;
    }
  },
  totalNutritionalInfo: {
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
    }
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },
  statusUpdates: [statusUpdateSchema],
  assignedRider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'KHALTI'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  paymentDetails: {
    provider: {
      type: String,
      enum: ['khalti', 'esewa', 'cash', 'card'],
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['initiated', 'completed', 'failed', 'pending', 'refunded'],
      default: 'pending'
    },
    sessionId: String,
    transaction_id: String,
    initiatedAt: Date,
    verifiedAt: Date,
    metadata: {
      type: Object,
      default: {}
    }
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date
  },
  deliveryAddress: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function(value) {
        if (typeof value === 'string') {
          return value.length > 0;
        } else if (typeof value === 'object') {
          return value.street || value.city || true;
        }
        return false;
      },
      message: 'Delivery address must be provided either as a string or an object with address details'
    }
  },
  deliveryPersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  specialInstructions: {
    type: String,
    default: ''
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ restaurantId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: 1 });
orderSchema.index({ deliveryPersonId: 1 });

// Update grandTotal when totalPrice, deliveryFee, tax, or tip changes
orderSchema.pre('save', function(next) {
  // Calculate grand total including loyalty points used
  const pointsUsed = this.loyaltyPointsUsed || 0;
  this.grandTotal = this.totalPrice + this.deliveryFee + this.tax + this.tip - pointsUsed;
  
  // Calculate total nutritional info from items
  if (this.items && this.items.length > 0) {
    const totalNutrition = this.items.reduce((acc, item) => {
      if (item.nutritionalInfo) {
        acc.calories += (item.nutritionalInfo.calories || 0) * item.quantity;
        acc.protein += (item.nutritionalInfo.protein || 0) * item.quantity;
        acc.carbs += (item.nutritionalInfo.carbs || 0) * item.quantity;
        acc.fat += (item.nutritionalInfo.fat || 0) * item.quantity;
        acc.sodium += (item.nutritionalInfo.sodium || 0) * item.quantity;
      }
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0 });
    
    this.totalNutritionalInfo = totalNutrition;
  }
  
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 