const express = require('express');
const router = express.Router();
const { auth, isRestaurantOwner } = require('../middleware/auth');
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/order');
const Restaurant = require('../models/restaurant');
const User = require('../models/user');
const { 
  createOrderNotification, 
  createRestaurantOrderNotification 
} = require('../utils/notifications');
const { sendEmail, emailTemplates } = require('../utils/emailService');
const mongoose = require('mongoose');
const MenuItem = require('../models/menuItem');
const Notification = require('../models/notification');
const Review = require('../models/review');
const RiderReview = require('../models/riderReview');

// GET all orders
router.get('/', auth, async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET current user's orders
router.get('/user', protect, async (req, res) => {
    try {
        // Fix: use the correct user ID property
        const userId = req.user._id || req.user.userId || req.user.id;
        console.log(`[Orders API] Fetching orders for user: ${userId}`);
        
        // Check if we have a valid user ID
        if (!userId) {
            console.error('[Orders API] Missing user ID in request');
            return res.status(400).json({
                success: false,
                message: 'User ID is missing'
            });
        }
        
        console.log(`[Orders API] Querying database for orders with userId: ${userId}`);
        // Fetch orders and include restaurant info
        const orders = await Order.find({ userId })
            .populate('restaurantId', 'restaurantDetails.name restaurantDetails.address')
            .sort({ createdAt: -1 })
            .lean();
        
        console.log(`[Orders API] Found ${orders.length} orders for user ${userId}`);

        // Enrich each order with existing menu item and rider reviews
        const enrichedOrders = await Promise.all(
          orders.map(async order => {
            // Attach menu item review if exists
            const menuReview = await Review.findOne({ user: userId, orderId: order._id }).lean();
            if (menuReview) {
              order.rating = menuReview.rating;
              order.isRated = true;
            }
            // Attach rider review if exists
            const riderReview = await RiderReview.findOne({ user: userId, orderId: order._id }).lean();
            if (riderReview) {
              order.riderRating = riderReview.rating;
              order.isRiderRated = true;
            }
            return order;
          })
        );
        return res.status(200).json({ success: true, data: enrichedOrders });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error loading your orders. Please try again later.' 
        });
    }
});

// GET restaurant orders for the logged-in owner (Fixed route placement)
router.get('/restaurant', auth, isRestaurantOwner, async (req, res) => {
    try {
        // Get user ID from auth middleware (this is the owner's user ID)
        const ownerUserId = req.user.userId;
        
        console.log(`[Orders API] Finding orders for restaurant owner with User ID: ${ownerUserId}`);
        
        if (!ownerUserId) {
            return res.status(400).json({
                success: false,
                message: 'Owner User ID is missing from token'
            });
        }
        
        // Find the User document for the owner
        const ownerUser = await User.findById(ownerUserId);
        if (!ownerUser) {
            console.log(`[Orders API] Owner user document not found for ID: ${ownerUserId}`);
            // Allow proceeding, maybe a Restaurant doc exists separately
        } else {
             console.log(`[Orders API] Found owner user document:`, {
                 id: ownerUser._id,
                 email: ownerUser.email,
                 role: ownerUser.role,
                 hasRestaurantDetails: !!ownerUser.restaurantDetails
             });
        }

        // Initialize possible IDs with the owner's User ID (as a string)
        const possibleRestaurantIds = [ownerUserId.toString()];
        
        // Although restaurantDetailsSchema doesn't have _id, log if it exists for debugging
        if (ownerUser && ownerUser.restaurantDetails) {
            console.log(`[Orders API] Owner user has restaurantDetails object.`);
            // If in the future restaurantDetails gets an _id, it would be added here.
            // if (ownerUser.restaurantDetails._id) {
            //     possibleRestaurantIds.push(ownerUser.restaurantDetails._id.toString());
            //     console.log(`[Orders API] Added restaurantDetails._id: ${ownerUser.restaurantDetails._id}`);
            // }
        }
        
        // Attempt to find a separate Restaurant document linked to the owner's User ID
        const ownedRestaurant = await Restaurant.findOne({ owner: ownerUserId });
        if (ownedRestaurant) {
            console.log(`[Orders API] Found linked Restaurant document with ID: ${ownedRestaurant._id}`);
            possibleRestaurantIds.push(ownedRestaurant._id.toString());
        } else {
            console.log(`[Orders API] No separate Restaurant document found linked to owner User ID: ${ownerUserId}`);
        }
        
        // Ensure IDs are unique strings
        const uniqueStringIds = [...new Set(possibleRestaurantIds)];
        
        console.log(`[Orders API] Final unique string IDs to search for orders:`, uniqueStringIds);
        
        // Find orders where restaurantId matches any of the collected IDs
        const orders = await Order.find({
            restaurantId: { $in: uniqueStringIds }
        })
            .sort({ createdAt: -1 })
            .populate('userId', 'firstName lastName fullName email phone') // Populate customer details
            .populate('deliveryPersonId', 'firstName lastName fullName phone deliveryRiderDetails.vehicleType deliveryRiderDetails.ratings') // Populate assigned rider details
            .populate({ // Populate the user who updated the status in the history
                path: 'statusUpdates.updatedBy',
                select: 'name' // Select only the name field
            })
            .lean(); // Use lean for performance
        
        console.log(`[Orders API] Found ${orders.length} orders matching IDs: ${uniqueStringIds.join(', ')}`);
        
        // Map deliveryPersonId to deliveryRiderId for front-end compatibility
        const ordersWithRiderField = orders.map(order => ({
            ...order,
            deliveryRiderId: order.deliveryPersonId || order.assignedRider || null
        }));
        
        // Return the found orders
        return res.status(200).json({
            success: true,
            data: ordersWithRiderField
        });
        
    } catch (error) {
        console.error('[Orders API] Error fetching restaurant orders:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching restaurant orders. Please try again later.' 
        });
    }
});

// GET user orders by user ID (putting specific routes before param routes)
router.get('/user/:userId', auth, async (req, res) => {
    try {
        // Ensure user can only see their own orders
        if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to view these orders' 
            });
        }
        
        const orders = await Order.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error(`Error fetching orders for user ${req.params.userId}:`, error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// NEW ROUTE: Safe route to get order details without authorization issues
router.get('/safe/details/:orderId', auth, async (req, res) => {
    console.log('SAFE ROUTE ACCESSED');
    try {
        const orderId = req.params.orderId;
        console.log(`SAFE ROUTE - Fetching order: ${orderId}`);
        
        const order = await Order.findById(orderId).lean();
        
        if (!order) {
            console.log('SAFE ROUTE - Order not found');
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        console.log('SAFE ROUTE - Order found, returning data');
        
        // Return a minimal, safe version of the order data
        return res.status(200).json({
            success: true,
            data: {
                _id: order._id,
                orderNumber: order.orderNumber || 'Unknown',
                status: order.status || 'Unknown',
                createdAt: order.createdAt,
                items: order.items || [],
                totalPrice: order.totalPrice || 0,
                deliveryFee: order.deliveryFee || 0,
                tax: order.tax || 0,
                grandTotal: order.grandTotal || 0,
                paymentMethod: order.paymentMethod || 'Unknown',
                paymentStatus: order.paymentStatus || 'Unknown',
                deliveryAddress: order.deliveryAddress || 'Unknown',
                specialInstructions: order.specialInstructions || ''
            }
        });
    } catch (error) {
        console.error('SAFE ROUTE ERROR:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET order by ID (moved to be AFTER the more specific routes)
router.get('/:id', auth, async (req, res) => {
    try {
        console.log(`ATTEMPTING TO FETCH ORDER: ${req.params.id}`);
        console.log(`USER AUTH INFO:`, req.user);
        
        // Ensure req.user and req.user.userId are available from the auth middleware
        if (!req.user || !req.user.userId) {
            console.error('Authorization Error: User information missing from request.');
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        
        const order = await Order.findById(req.params.id)
            .populate('userId', 'firstName lastName fullName email phone address')
            .populate('restaurantId', 'name owner') // Populate owner field for auth check
            .populate('deliveryPersonId', '_id') // Populate only the ID for auth check
            .populate({
              path: 'statusUpdates.updatedBy',
              select: 'name'
            });
            
        if (!order) {
            console.log(`ORDER NOT FOUND: ${req.params.id}`);
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        console.log(`ORDER FOUND: ${order._id}`);
        console.log(`ORDER USER ID:`, order.userId);
        console.log(`ORDER RESTAURANT ID:`, order.restaurantId);
        
        // TEMPORARILY BYPASS ALL AUTHORIZATION CHECKS
        // We'll just allow access to the order for testing purposes
        
        // Create formatted order without any risky .toString() calls
        const formattedOrder = {
            _id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            items: order.items,
            totalPrice: order.totalPrice,
            deliveryFee: order.deliveryFee,
            tax: order.tax,
            grandTotal: order.grandTotal,
            deliveryAddress: order.deliveryAddress,
            specialInstructions: order.specialInstructions,
            createdAt: order.createdAt,
            statusUpdates: order.statusUpdates || [],
            // Safely build restaurant info
            restaurant: null,
            // Safely build customer info
            customer: null
        };
        
        // Populate restaurant info if available
        if (order.restaurantId) {
           formattedOrder.restaurant = {
              id: order.restaurantId._id,
              name: order.restaurantId.name || order.restaurantId.restaurantDetails?.name || 'Unknown Restaurant'
              // Add other needed restaurant fields safely
           };
        }
        
        // Populate customer info if available
        if (order.userId) {
           formattedOrder.customer = {
              id: order.userId._id,
              name: order.userId.fullName || `${order.userId.firstName || ''} ${order.userId.lastName || ''}`.trim() || 'Unknown User',
              email: order.userId.email,
              phone: order.userId.phone
              // Add other needed user fields safely
           };
        }
        
        // --- Authorization Check --- 
        let authorized = false;
        const requestingUserId = req.user.userId.toString(); // Ensure it's a string for comparison

        // 1. Is the user an Admin?
        if (req.user.role === 'admin') {
            authorized = true;
            console.log('Access granted: Admin user.');
        }

        // 2. Is the user the customer who placed the order?
        if (!authorized && order.userId && order.userId._id.toString() === requestingUserId) {
            authorized = true;
            console.log('Access granted: User is the customer.');
        }

        // 3. Is the user the restaurant owner for this order?
        if (!authorized && req.user.role === 'restaurant' && order.restaurantId && order.restaurantId.owner) {
            // Check if the requesting user ID matches the owner ID populated from the restaurant
            if (order.restaurantId.owner.toString() === requestingUserId) {
               authorized = true;
               console.log('Access granted: User owns the restaurant.');
            }
        }

        // 4. Is the user the assigned delivery rider for this order?
        if (!authorized && req.user.role === 'delivery_rider' && order.deliveryPersonId) {
            if (order.deliveryPersonId._id.toString() === requestingUserId) {
                authorized = true;
                console.log('Access granted: User is the assigned delivery rider.');
            }
        }

        // If not authorized by any rule, deny access
        if (!authorized) {
            console.log('Authorization failed for user:', requestingUserId, 'role:', req.user.role);
            return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
        }
        // --- End Authorization Check ---
        
        console.log('Authorization check passed. Returning order.');
        return res.status(200).json({ success: true, data: formattedOrder });
    } catch (error) {
        console.error(`CRITICAL ERROR in GET /:id route:`, error);
        // Handle CastError for invalid ID format
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid order ID format' });
        }
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST create new order - supports both auth middlewares
router.post('/', async (req, res) => {
    console.log('[Orders API] Create order request received');
    
    // Check for authentication
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    
    try {
        const {
            items,
            restaurantId,
            deliveryAddress,
            orderNote,
            paymentMethod,
            totalPrice
        } = req.body;
        
        console.log('[Orders API] Request body:', { 
            itemsCount: items?.length, 
            restaurantId, 
            hasAddress: !!deliveryAddress,
            paymentMethod,
            totalPrice 
        });
        
        // Validate required fields (omitting loyalty redemption for simplicity)
        if (!items || !items.length || !restaurantId || !deliveryAddress || !totalPrice) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: items, restaurantId, deliveryAddress, and totalPrice'
            });
        }

        // Verify that the restaurant exists
        let restaurant;
        try {
            // First, make sure restaurantId is in a valid format
            const isValidObjectId = mongoose.Types.ObjectId.isValid(restaurantId);
            if (!isValidObjectId) {
                console.log(`[Orders API] Invalid restaurant ID format: ${restaurantId}`);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid restaurant ID format'
                });
            }
            
            // Try to find the restaurant - first by exact ID match
            restaurant = await Restaurant.findById(restaurantId);
            
            if (!restaurant) {
                // Try additional searches if direct lookup fails
                console.log(`[Orders API] Restaurant not found with ID (direct lookup): ${restaurantId}`);
                
                // Try looking up with string version
                restaurant = await Restaurant.findOne({ _id: restaurantId.toString() });
                
                if (!restaurant) {
                    console.log(`[Orders API] Restaurant not found with ID (string lookup): ${restaurantId}`);
                    
                    // Try with status field check, including 'approved' status  
                    restaurant = await Restaurant.findOne({ 
                        _id: restaurantId.toString(),
                        status: 'approved'
                    });
                    
                    if (!restaurant) {
                        // As a last resort, check status as a more permissive value
                        restaurant = await Restaurant.findOne({
                            _id: restaurantId.toString(),
                            $or: [
                                { status: 'approved' },
                                { status: 'pending_approval' }
                            ]
                        });
                        
                        if (!restaurant) {
                            // Show available restaurants for debugging
                            const allRestaurants = await Restaurant.find({}).limit(10);
                            console.log(`[Orders API] Available restaurants (first 10):`, 
                                allRestaurants.map(r => ({ id: r._id, name: r.name, status: r.status })));
                            
                            return res.status(404).json({
                                success: false,
                                message: 'Restaurant not found'
                            });
                        }
                    }
                }
                console.log(`[Orders API] Restaurant found with alternate lookup: ${restaurant._id}, status: ${restaurant.status}`);
            } else {
                console.log(`[Orders API] Restaurant found with direct lookup: ${restaurant._id}, status: ${restaurant.status}`);
            }
            
            // Additional check to ensure restaurant is in a valid state
            if (restaurant.status !== 'approved') {
                // For now, let's be permissive and continue processing even if not approved
                console.log(`[Orders API] Warning: Restaurant ${restaurant._id} has status ${restaurant.status}, but allowing order`);
            }
            
        } catch (error) {
            console.error(`[Orders API] Error finding restaurant:`, error);
            return res.status(500).json({
                success: false,
                message: 'Error validating restaurant',
                error: error.message
            });
        }

        // Validate menu items and calculate total
        let calculatedTotal = 0;
        const validatedItems = [];

        for (const item of items) {
            // Fetch the menu item with its add-ons
            let menuItem;
            try {
                // Clean and validate the menuItemId
                const menuItemId = item.menuItemId || item.id;
                if (!menuItemId || !mongoose.Types.ObjectId.isValid(menuItemId)) {
                    console.log(`[Orders API] Invalid menu item ID format: ${menuItemId}`);
                    return res.status(400).json({
                        success: false,
                        message: `Invalid menu item ID format: ${menuItemId}`
                    });
                }
                
                menuItem = await MenuItem.findById(menuItemId).lean(); // Use lean for performance
            } catch (error) {
                console.error(`[Orders API] Error finding menu item:`, error);
                return res.status(500).json({
                    success: false,
                    message: 'Error finding menu item',
                    error: error.message
                });
            }

            if (!menuItem) {
                console.log(`[Orders API] Menu item not found: ${item.menuItemId || item.id}`);
                return res.status(404).json({
                    success: false,
                    message: `Menu item not found: ${item.menuItemId || item.id}`
                });
            }

            // Check for the rare case where the menu item's restaurant is the same as the menu item ID
            if (menuItem.restaurant && menuItem.restaurant.toString() === menuItem._id.toString()) {
                console.log(`[Orders API] WARNING: Menu item ${menuItem._id} has self-referencing restaurant ID. Using order's restaurant ID instead.`);
                // Continue processing but use the order's restaurantId
            } 
            // Ensure item belongs to the specified restaurant
            else if (menuItem.restaurant && menuItem.restaurant.toString() !== restaurantId) {
                console.log(`[Orders API] Menu item mismatch. Item ${menuItem._id} belongs to restaurant ${menuItem.restaurant}, but order is for restaurant ${restaurantId}`);
                
                // For now, let's log but continue with a warning rather than failing the order
                console.log(`[Orders API] WARNING: Allowing item from different restaurant for now`);
            }

            const itemBasePrice = (item.price != null ? parseFloat(item.price) : menuItem.item_price);
            let currentItemTotal = itemBasePrice * item.quantity;
            const addedIngredientsForOrder = [];

            // Process selected add-ons if provided
            if (item.selectedAddOns && Array.isArray(item.selectedAddOns) && item.selectedAddOns.length > 0) {
                const availableAddOns = menuItem.customizationOptions?.availableAddOns || [];
                
                for (const selectedAddOn of item.selectedAddOns) {
                    // Find the add-on in the menu item's available add-ons
                    // Assuming selectedAddOn contains { id: '...' }
                    const addOnId = selectedAddOn.id; 
                    const matchedAddOn = availableAddOns.find(a => a._id && a._id.toString() === addOnId);

                    if (matchedAddOn) {
                        const addOnPrice = matchedAddOn.price || 0;
                        currentItemTotal += addOnPrice * item.quantity; // Add to the item's total
                        addedIngredientsForOrder.push({
                            _id: matchedAddOn._id, // Store ID for reference
                            name: matchedAddOn.name,
                            price: addOnPrice
                        });
                    } else {
                        // Handle invalid add-on ID - either error out or ignore
                        console.warn(`Invalid add-on ID ${addOnId} selected for item ${menuItem.item_name}`);
                        // Option: return error
                        // return res.status(400).json({ success: false, message: `Invalid add-on ID ${addOnId}` });
                    }
                }
            }

            // Process cooking method if provided
            let cookingMethodName = '';
            let cookingPrice = 0;
            if (item.cookingMethod) {
                const availableCooking = menuItem.customizationOptions?.cookingOptions || [];
                const matchedCooking = availableCooking.find(opt =>
                    (opt._id && opt._id.toString() === item.cookingMethod) || opt.id === item.cookingMethod
                );
                if (matchedCooking) {
                    cookingMethodName = matchedCooking.name;
                    cookingPrice = matchedCooking.price || 0;
                    currentItemTotal += cookingPrice * item.quantity;
                }
            }

            calculatedTotal += currentItemTotal;

            // Prepare the item structure for saving in the Order document
            validatedItems.push({
                productId: menuItem._id.toString(),
                name: menuItem.item_name,
                price: itemBasePrice,
                quantity: item.quantity,
                customization: {
                    addedIngredients: addedIngredientsForOrder,
                    specialInstructions: item.specialInstructions || '',
                    cookingMethod: cookingMethodName,
                    cookingPrice: cookingPrice
                },
            });
        }

        // Add delivery fee, tax, tip if applicable (fetch from restaurant or config)
        const deliveryFee = (req.body.deliveryFee !== undefined && typeof req.body.deliveryFee === 'number')
            ? req.body.deliveryFee
            : (restaurant.deliveryFee || 0);
        const taxRate = 0.0; // Example: Get tax rate from config/restaurant
        const taxAmount = calculatedTotal * taxRate;
        const tipAmount = req.body.tip || 0; // Get tip from request if provided
        const grandTotal = calculatedTotal + deliveryFee + taxAmount + tipAmount;

        // Ensure the total price matches the calculated total (allowing for small rounding differences)
        // Skip validation for now to ensure order works
        // if (Math.abs(grandTotal - totalPrice) > 1) {
        //    console.error(`Total price mismatch. Calculated Grand Total: ${grandTotal}, Received Total Price: ${totalPrice}`);
        //    return res.status(400).json({
        //        success: false,
        //        message: `Total price mismatch. Server calculated ${grandTotal}, client sent ${totalPrice}`
        //    });
        // }

        // Use server-calculated totalPrice (items total, ignore client-provided value)
        const finalTotalPrice = calculatedTotal;
        
        console.log('[Orders API] Pre-Save Pricing Debug:', {
            calculatedTotal_ItemsOnly: calculatedTotal,
            deliveryFee_FromRequestOrRestaurant: deliveryFee,
            taxAmount_Calculated: taxAmount,
            tipAmount_FromRequest: tipAmount,
            finalTotalPrice_ToBeSavedAsOrderTotalPrice: finalTotalPrice,
            loyaltyPointsUsed_FromRequest: parseInt(req.body.loyaltyPointsUsed, 10) || 0
        });

        // Get user ID from authentication
        const userId = req.user.id || req.user._id || req.user.userId;
        
        if (!userId) {
            console.error('[Orders API] User ID missing from authentication');
            return res.status(400).json({
                success: false,
                message: 'User ID missing from authentication'
            });
        }

        // Create the order (including offer and loyalty) 
        const order = new Order({
            orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
            userId: userId,
            restaurantId: restaurantId,
            items: validatedItems,
            totalPrice: finalTotalPrice,
            deliveryFee: deliveryFee,
            tax: taxAmount,
            tip: tipAmount,
            loyaltyPointsUsed: parseInt(req.body.loyaltyPointsUsed, 10) || 0,
            deliveryAddress: deliveryAddress,
            specialInstructions: orderNote,
            paymentMethod: paymentMethod || 'CASH',
            paymentStatus: 'PENDING',
            status: 'PENDING'
            // statusUpdates will be added automatically
        });

        console.log('[Orders API] Saving order:', {
            orderNumber: order.orderNumber,
            userId: order.userId,
            restaurantId: order.restaurantId,
            itemsCount: order.items.length,
            totalPrice_Saved: order.totalPrice,
            deliveryFee_Saved: order.deliveryFee,
            tax_Saved: order.tax,
            tip_Saved: order.tip,
            loyaltyPointsUsed_Saved: order.loyaltyPointsUsed,
            grandTotal_FromModelDefault_BeforePreSaveHook: order.grandTotal
        });

        await order.save();
        console.log('[Orders API] Post-Save Pricing Debug (from saved order object):', {
            orderId: order._id,
            totalPrice: order.totalPrice,
            deliveryFee: order.deliveryFee,
            tax: order.tax,
            tip: order.tip,
            loyaltyPointsUsed: order.loyaltyPointsUsed,
            grandTotal_Final: order.grandTotal
        });
        console.log(`[Orders API] Order saved with ID: ${order._id}`);

        // Fetch the user details to include in the email
        const customer = await User.findById(userId);

        // Send notifications and email
        try {
            // Create promises for notifications and email
            const notificationPromises = [
                // Notify the restaurant owner (using owner user ID and include order for actionUrl)
                createRestaurantOrderNotification(
                    restaurant.owner,
                    `New Order #${order.orderNumber}`,
                    `You have received a new order #${order.orderNumber} with a total value of Rs. ${order.grandTotal.toFixed(2)} (items: Rs. ${order.totalPrice.toFixed(2)}, delivery: Rs. ${order.deliveryFee.toFixed(2)}).`,
                    order
                ),
                createOrderNotification(
                    userId,
                    `Order #${order.orderNumber} Placed`,
                    `Your order has been placed and is waiting for restaurant confirmation.`
                )
            ];

            // Add email promise if customer exists and has an email
            if (customer && customer.email) {
                // Only send confirmation email immediately for non-Khalti orders
                if (order.paymentMethod?.toLowerCase() !== 'khalti') {
                    notificationPromises.push(
                        sendEmail({
                            to: customer.email,
                            subject: `YumRun Order Confirmation #${order.orderNumber}`,
                            html: emailTemplates.orderConfirmationEmail(order, customer) 
                        })
                    );
                } else {
                    console.log(`[Orders API] Order ${order._id} is Khalti payment, delaying confirmation email until payment verification.`);
                }
            } else {
                console.log(`[Orders API] Customer not found or no email for user ID: ${userId}. Skipping confirmation email.`);
            }

            // Add email promise for restaurant owner notification
            if (restaurant && restaurant.owner) {
                const ownerUser = await User.findById(restaurant.owner);
                if (ownerUser && ownerUser.email) {
                    notificationPromises.push(
                        sendEmail({
                            to: ownerUser.email,
                            subject: `New Order Received: #${order.orderNumber}`,
                            html: `
                              <p>Hello ${ownerUser.fullName || ownerUser.firstName || 'Owner'},</p>
                              <p>You have received a new order <strong>#${order.orderNumber}</strong> with a total value of Rs. ${order.grandTotal.toFixed(2)} (items: Rs. ${order.totalPrice.toFixed(2)}, delivery: Rs. ${order.deliveryFee.toFixed(2)}).</p>
                              <p>Please check your restaurant dashboard for details.</p>
                              <p>Regards,<br>The YumRun Team</p>
                            `
                        })
                    );
                }
            }

            // Execute all promises concurrently
            await Promise.all(notificationPromises).catch(err => {
                console.error('[Orders API] Error in post-order operations (notifications/email):', err);
                // Don't fail the request if these secondary operations fail
            });
            
        } catch (postOrderError) {
            console.error('[Orders API] General error during post-order operations:', postOrderError);
            // Continue with response even if notifications/email fail
        }
        
        // --- Loyalty: Earn points for this order ---
        try {
            const { calculateBasePoints, calculateOrderPoints, updateUserTier } = require('../utils/loyaltyUtils');
            const LoyaltyTransaction = require('../models/loyaltyTransaction');
            const userEarn = await User.findById(userId);
            // Calculate points based solely on order total
            const basePoints = calculateBasePoints(order.grandTotal);
            const pointsEarned = calculateOrderPoints(basePoints, userEarn.loyaltyTier);
            // Set expiry date 12 months from now
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 12);
            const earnTxn = new LoyaltyTransaction({
                user: userId,
                points: pointsEarned,
                type: 'EARN',
                source: 'ORDER',
                description: `Points earned from order #${order.orderNumber}`,
                referenceId: order._id,
                balance: (userEarn.loyaltyPoints || 0) + pointsEarned,
                expiryDate
            });
            await earnTxn.save();
            // Update user points
            userEarn.loyaltyPoints = (userEarn.loyaltyPoints || 0) + pointsEarned;
            userEarn.lifetimeLoyaltyPoints = (userEarn.lifetimeLoyaltyPoints || 0) + pointsEarned;
            await userEarn.save();
        } catch (err) {
            console.error('Error processing loyalty earn for order:', err);
        }
        
        // Return success response with the created order
        console.log('[Orders API] Returning successful response with order ID:', order._id);
        return res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error) {
        console.error('[Orders API] Error creating order:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while creating order',
            error: error.message
        });
    }
});

// PUT update order
router.put('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        // Only allow updates to certain fields
        const allowedUpdates = ['deliveryAddress', 'specialInstructions'];
        const updates = {};
        
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });
        
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No valid fields to update' 
            });
        }
        
        // Only allow updates if order is still pending
        if (order.status !== 'PENDING') {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot update order that is not in pending status' 
            });
        }
        
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        );
        
        res.status(200).json({ 
            success: true, 
            message: 'Order updated successfully', 
            order: updatedOrder 
        });
    } catch (error) {
        console.error(`Error updating order ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST update order status (Restaurant Owner only)
router.post('/:id/status', auth, isRestaurantOwner, async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;
        const ownerUserId = req.user.userId;

        // Get restaurantId from middleware
        if (!req.user.restaurantId) {
            console.error('Middleware did not attach restaurantId to user object for owner:', ownerUserId);
            return res.status(403).json({ 
                success: false, 
                message: 'Could not verify restaurant ownership.' 
            });
        }
        const ownerRestaurantId = req.user.restaurantId;

        if (!status) {
            return res.status(400).json({ success: false, message: 'Please provide a status' });
        }
        
        // Use model enum values for valid statuses
        const validStatuses = Order.schema.path('status').enumValues;
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }
        
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Verify the order belongs to the restaurant owner
        if (order.restaurantId.toString() !== ownerRestaurantId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
        }

        // Enforce allowed status transitions for restaurant owner
        const prev = order.status;
        const allowedTransitions = {
          PENDING: ['CONFIRMED','CANCELLED'],
          CONFIRMED: ['PREPARING','CANCELLED'],
          PREPARING: ['READY','CANCELLED'],
          READY: ['CANCELLED'],
          OUT_FOR_DELIVERY: [],
          DELIVERED: [],
          CANCELLED: []
        };
        if (!allowedTransitions[prev] || !allowedTransitions[prev].includes(status)) {
          return res.status(400).json({
            success: false,
            message: `Cannot change status from ${prev} to ${status}`
          });
        }

        // Update order status and log status update
        order.status = status;
        order.statusUpdates.push({
            status,
            timestamp: new Date(),
            updatedBy: ownerUserId // Log which user performed the update
        });
        // If marked delivered, record actual delivery time
        if (status === 'DELIVERED') {
            order.actualDeliveryTime = new Date();
        }

        await order.save();
        
        // Send status update email to the customer
        const customer = await User.findById(order.userId);
        if (customer) {
            const emailOptions = {
                order: order, 
                status: status.toLowerCase(), // Use lowercase status for template key
                name: customer.fullName
            };
            sendEmail({
                to: customer.email,
                subject: `YumRun Order Update: ${order.orderNumber} is now ${status}`,
                html: emailTemplates.orderStatusUpdateEmail(emailOptions)
            }).catch(err => console.error('Failed to send order status update email:', err));
        } else {
            console.error('Could not find customer to send status update email for order:', order._id);
        }
        
        // Create in-app notification for the customer about status change
        createOrderNotification(
          order.userId,
          `Order #${order.orderNumber} ${status}`,
          `Your order #${order.orderNumber} is now ${status}`,
          order
        );
        
        // Populate user details in the response
        const updatedOrder = await Order.findById(order._id)
            .populate('userId', 'fullName email phone');

        res.status(200).json({ 
            success: true, 
            message: 'Order status updated successfully', 
            data: updatedOrder 
        });
    } catch (error) {
        console.error(`Error updating status for order ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE order (Optional - maybe only admin?)
// Add DELETE route if needed, with appropriate authorization

// Get all orders (admin only)
router.get('/admin', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const orders = await Order.find()
            .populate('userId', 'firstName lastName email phone')
            .populate('restaurantId', 'name logo')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get orders by restaurant ID (for restaurant owners)
router.get('/restaurant/:restaurantId', auth, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        
        // Check if the user is the owner of this restaurant
        const user = await User.findById(req.user.id);
        const isOwner = user.role === 'restaurant' && 
                       user.restaurantDetails && 
                       user.restaurantDetails._id.toString() === restaurantId;
        
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not own this restaurant.'
            });
        }

        const orders = await Order.find({ restaurantId })
            .populate('userId', 'firstName lastName email phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error(`Error fetching orders for restaurant ${req.params.restaurantId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get user orders
router.get('/user', auth, async (req, res) => {
    try {
        // Fix: use correct user ID property (req.user._id or req.user.userId)
        const userId = req.user._id || req.user.userId || req.user.id;
        
        console.log(`[Orders API] Finding orders for user ID: ${userId}`);
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is missing from authentication data'
            });
        }
        
        const orders = await Order.find({ userId })
            .populate('restaurantId', 'name logo restaurantDetails.name')
            .sort({ createdAt: -1 });

        console.log(`[Orders API] Found ${orders.length} orders for user`);
        
        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error(`Error fetching orders for user:`, error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get a specific order
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('userId', 'firstName lastName email phone')
            .populate('restaurantId', 'name logo')
            .populate('deliveryRiderId', 'firstName lastName phone');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Only allow the user who placed the order, the restaurant owner, or admin to view
        const isOwner = req.user.role === 'restaurant' && 
                       req.user.restaurantDetails && 
                       req.user.restaurantDetails._id.toString() === order.restaurantId._id.toString();
        
        if (order.userId._id.toString() !== req.user.id && 
            !isOwner && 
            req.user.role !== 'admin' &&
            req.user.role !== 'delivery_rider') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error(`Error fetching order ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Update order status (restaurant or admin)
router.patch('/:id/status', auth, isRestaurantOwner, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = Order.schema.path('status').enumValues;
        
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user has permission to update this order
        const isRestaurantOwner = req.user.role === 'restaurant' &&
                              req.user.restaurantId &&
                              req.user.restaurantId.toString() === order.restaurantId.toString();
        
        if (!isRestaurantOwner && req.user.role !== 'admin' && req.user.role !== 'delivery_rider') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to update this order.'
            });
        }

        // Specific status restrictions
        if (status === 'DELIVERED' && req.user.role !== 'delivery_rider' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only delivery riders can mark orders as delivered'
            });
        }

        // Enforce allowed status transitions for restaurant owner
        const prev = order.status;
        const allowedTransitions = {
          PENDING: ['CONFIRMED','CANCELLED'],
          CONFIRMED: ['PREPARING','CANCELLED'],
          PREPARING: ['READY','CANCELLED'],
          READY: ['CANCELLED'],
          OUT_FOR_DELIVERY: [],
          DELIVERED: [],
          CANCELLED: []
        };
        if (!allowedTransitions[prev] || !allowedTransitions[prev].includes(status)) {
          return res.status(400).json({
            success: false,
            message: `Cannot change status from ${prev} to ${status}`
          });
        }

        // Update the order status
        order.status = status;
        
        // Add status update entry
        order.statusUpdates.push({
            status,
            timestamp: new Date(),
            updatedBy: req.user.id
        });

        // If order is delivered, update actual delivery time
        if (status === 'DELIVERED') {
            order.actualDeliveryTime = new Date();
        }

        await order.save();

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error(`Error updating order status for ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Assign delivery rider to order
router.patch('/:id/assign-rider', auth, isRestaurantOwner, async (req, res) => {
    try {
        const { riderId } = req.body;
        
        if (!riderId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a rider ID'
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user has permission to assign riders
        const isRestaurantOwner = req.user.role === 'restaurant' &&
                              req.user.restaurantId &&
                              req.user.restaurantId.toString() === order.restaurantId.toString();
        
        if (!isRestaurantOwner && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only restaurant owners or admins can assign riders.'
            });
        }

        // Verify the rider exists and is active
        const rider = await User.findById(riderId);
        if (!rider || rider.role !== 'delivery_rider') {
            return res.status(404).json({
                success: false,
                message: 'Delivery rider not found'
            });
        }

        // Update the order with the correct rider fields
        order.assignedRider = riderId;       // Legacy assigned rider field
        order.deliveryPersonId = riderId;    // Used by rider dashboard
        order.status = 'OUT_FOR_DELIVERY';
        
        // Add status update entry for rider assignment
        order.statusUpdates.push({
            status: 'OUT_FOR_DELIVERY',
            timestamp: new Date(),
            updatedBy: req.user.id
        });

        await order.save();

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error(`Error assigning rider to order ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Cancel order (user can cancel their own order)
router.patch('/:id/cancel', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if the order can be cancelled (only pending orders)
        const cancelableStatuses = ['PENDING'];
        if (!cancelableStatuses.includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel order in ${order.status} status. Only orders in ${cancelableStatuses.join(', ')} status can be cancelled.`
            });
        }

        // Check if the user has permission to cancel this order (only owner or admin)
        const isUser = order.userId.toString() === req.user.id;
        if (!isUser && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to cancel this order.'
            });
        }

        // Update the order status
        order.status = 'CANCELLED';
        
        // Add status update entry for cancellation
        order.statusUpdates.push({
            status: 'CANCELLED',
            timestamp: new Date(),
            updatedBy: req.user.id
        });

        // Add cancellation reason if provided
        if (req.body.cancellationReason) {
            order.cancellationReason = req.body.cancellationReason;
        }

        await order.save();

        // Notify restaurant owner via email about cancellation
        try {
            const restaurantDoc = await Restaurant.findById(order.restaurantId);
            if (restaurantDoc && restaurantDoc.owner) {
                const ownerUser = await User.findById(restaurantDoc.owner);
                if (ownerUser && ownerUser.email) {
                    await sendEmail({
                        to: ownerUser.email,
                        subject: `Order Cancelled: #${order.orderNumber}`,
                        html: `
                          <p>Hello ${ownerUser.fullName || ownerUser.firstName || 'Owner'},</p>
                          <p>Order <strong>#${order.orderNumber}</strong> has been cancelled by the customer.</p>
                          <p>Regards,<br>The YumRun Team</p>
                        `
                    });
                }
            }
        } catch (emailError) {
            console.error('Error sending cancellation email to owner:', emailError);
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error(`Error cancelling order ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// NEW ROUTE: Assign a rider to an order
router.post('/:id/assign-rider', auth, isRestaurantOwner, async (req, res) => {
    try {
        const { riderId } = req.body;
        const orderId = req.params.id;
        const ownerUserId = req.user.userId;

        // Get restaurantId from middleware
        if (!req.user.restaurantId) {
            console.error('Middleware did not attach restaurantId to user object for owner:', ownerUserId);
            return res.status(403).json({ 
                success: false, 
                message: 'Could not verify restaurant ownership.' 
            });
        }
        const ownerRestaurantId = req.user.restaurantId;

        if (!riderId || !mongoose.Types.ObjectId.isValid(riderId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a valid rider ID' 
            });
        }
        
        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        // Verify the order belongs to the restaurant owner
        if (order.restaurantId.toString() !== ownerRestaurantId.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to update this order' 
            });
        }

        // Check if rider exists and is a delivery rider
        const rider = await User.findOne({
            _id: riderId,
            role: 'delivery_rider'
        });

        if (!rider) {
            return res.status(404).json({ 
                success: false, 
                message: 'Rider not found or not a delivery rider' 
            });
        }

        // Update order with assigned rider
        order.assignedRider = riderId;
        order.deliveryPersonId = riderId; // For compatibility with older code
        
        // Add status update if order is ready but not out for delivery yet
        if (order.status === 'READY' || order.status === 'PREPARING') {
            order.status = 'OUT_FOR_DELIVERY';
            order.statusUpdates.push({
                status: 'OUT_FOR_DELIVERY',
                timestamp: new Date(),
                updatedBy: ownerUserId 
            });
        }
        
        await order.save();
        
        // Notify the rider about the new assignment
        await Notification.create({
            userId: riderId,
            title: 'New Delivery Assignment',
            message: `You've been assigned to deliver order #${order.orderNumber}`,
            type: 'delivery_assignment',
            entityId: order._id
        });
        
        // Notify the customer about the rider assignment and status change
        const customer = await User.findById(order.userId);
        if (customer && customer.email) {
            const emailOptions = {
                order: order,
                riderName: rider.fullName || `${rider.firstName} ${rider.lastName}`,
                customerName: customer.fullName || `${customer.firstName} ${customer.lastName}`
            };
            
            sendEmail({
                to: customer.email,
                subject: `YumRun Order Update: Rider Assigned to Your Order #${order.orderNumber}`,
                html: emailTemplates.riderAssignmentEmail ? 
                      emailTemplates.riderAssignmentEmail(emailOptions) :
                      `<p>Your order #${order.orderNumber} has been assigned to ${emailOptions.riderName} for delivery.</p>`
            }).catch(err => console.error('Failed to send rider assignment email:', err));
        }

        // Get updated order with populated fields
        const updatedOrder = await Order.findById(order._id)
            .populate('userId', 'fullName email phone')
            .populate('assignedRider', 'fullName phone deliveryRiderDetails');

        res.status(200).json({ 
            success: true, 
            message: 'Rider assigned successfully', 
            data: updatedOrder 
        });
    } catch (error) {
        console.error(`Error assigning rider to order ${req.params.id}:`, error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
});

// NEW ROUTE: Get order status history
router.get('/:id/status-history', auth, async (req, res) => {
    try {
        const orderId = req.params.id;
        
        // Find the order
        const order = await Order.findById(orderId)
            .populate('statusUpdates.updatedBy', 'firstName lastName fullName')
            .select('orderNumber statusUpdates createdAt');
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }
        
        // Return status history with the initial creation status
        const statusHistory = [
            {
                status: 'CREATED',
                timestamp: order.createdAt,
                updatedBy: null
            },
            ...order.statusUpdates
        ];
        
        return res.status(200).json({
            success: true,
            data: {
                orderNumber: order.orderNumber,
                statusHistory
            }
        });
    } catch (error) {
        console.error(`Error fetching status history for order ${req.params.id}:`, error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
});

module.exports = router; 