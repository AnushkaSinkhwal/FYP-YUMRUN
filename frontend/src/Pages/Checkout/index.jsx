import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userAPI, loyaltyAPI, default as api } from '../../utils/api';
import { isValidObjectId, cleanObjectId } from '../../utils/validationUtils';
import { FiArrowLeft, FiMapPin, FiCreditCard, FiHome, FiPhone, FiUser, FiMail } from 'react-icons/fi';
import {
  Container,
  Card,
  Button,
  Input,
  Textarea,
  Label,
  RadioGroup,
  Alert,
  Spinner,
  RadioGroupItem
} from '../../components/ui';
import KhaltiPayment from '../../components/Payments/KhaltiPayment';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, cartStats } = useCart();
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('khalti');
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: currentUser?.fullName || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    address: currentUser?.address || '',
    city: '',
    additionalInfo: '',
  });
  const [orderRestaurantId, setOrderRestaurantId] = useState(null);
  const [loyaltyInfo, setLoyaltyInfo] = useState({ currentPoints: 0, lifetimePoints: 0 });
  const [restaurantOffers, setRestaurantOffers] = useState([]);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  // Add state for Khalti flow
  const [showKhalti, setShowKhalti] = useState(false);
  const [khaltiDetails, setKhaltiDetails] = useState({ orderId: null, amount: null });

  // Form validation
  const [errors, setErrors] = useState({});

  // Check if cart is empty and redirect if needed
  useEffect(() => {
    if (!cartItems.length) {
      addToast('Your cart is empty', { type: 'error' });
      navigate('/');
      return;
    }

    // Get restaurantId from first cart item - now more explicit about which ID we want
    const firstItem = cartItems[0];
    console.log('First cart item:', firstItem);
    
    let restaurantId = null;
    
    // Try to get restaurantId from different possible locations (priority order)
    if (firstItem.restaurantId) {
      restaurantId = firstItem.restaurantId;
      console.log('Found restaurantId directly:', restaurantId);
    } else if (firstItem.restaurant?.id) {
      restaurantId = firstItem.restaurant.id;
      console.log('Found restaurantId from restaurant.id:', restaurantId);
    } else if (firstItem.restaurant?._id) {
      restaurantId = firstItem.restaurant._id;
      console.log('Found restaurantId from restaurant._id:', restaurantId);
    }

    // Validate we have a restaurantId
    if (!restaurantId) {
      console.error('No restaurantId found in cart items. Item data:', firstItem);
      addToast('Unable to create order: Restaurant information is missing', { type: 'error' });
      navigate('/cart');
      return;
    }

    // Debug log: Print all variations of the restaurant ID to help diagnose
    console.log('Restaurant ID debugging:', {
      original: restaurantId,
      asString: String(restaurantId),
      trimmed: String(restaurantId).trim(),
      standardized: cleanObjectId(restaurantId)
    });

    // Standardize the restaurantId format (remove quotes, trim whitespace)
    const cleanedRestaurantId = cleanObjectId(restaurantId);
    
    // Validate the restaurantId is in a valid MongoDB ObjectId format (24 hex chars)
    if (!isValidObjectId(cleanedRestaurantId)) {
      console.error('Invalid restaurant ID format:', cleanedRestaurantId);
      addToast('Unable to create order: Invalid restaurant ID format', { type: 'error' });
      navigate('/cart');
      return;
    }
    
    // Check if the restaurantId is actually a menu item ID (common error case)
    const menuItemId = firstItem.menuItemId || firstItem.id;
    if (menuItemId && cleanedRestaurantId === cleanObjectId(menuItemId)) {
      console.error('Restaurant ID is the same as menu item ID - this is a data error:', {
        restaurantId: cleanedRestaurantId,
        menuItemId: cleanObjectId(menuItemId)
      });
      addToast('Unable to create order: Item configuration error. Please clear your cart and try again.', { type: 'error' });
      navigate('/cart');
      return;
    }
    
    setOrderRestaurantId(cleanedRestaurantId);
  }, [cartItems, navigate, addToast]);

  // Prefill deliveryAddress from the user's stored profile
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const res = await userAPI.getProfile();
        if (res.data.success) {
          const u = res.data.data;
          setDeliveryAddress(prev => ({
            ...prev,
            fullName: u.fullName || '',
            phone: u.phone || '',
            email: u.email || '',
            address: u.address || '',
          }));
        }
      } catch (err) {
        console.error('Error fetching profile in checkout:', err);
      }
    };
    loadUserProfile();
  }, []);

  // Fetch loyalty info
  useEffect(() => {
    if (!orderRestaurantId) return;
    const fetchLoyalty = async () => {
      try {
        // Scope loyalty query to this restaurant
        const res = await loyaltyAPI.getInfo(orderRestaurantId);
        if (res.data.success) {
          setLoyaltyInfo(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching loyalty info:', err);
      }
    };
    fetchLoyalty();
  }, [orderRestaurantId]);

  // Fetch public offers for this restaurant in checkout
  useEffect(() => {
    if (!orderRestaurantId) return;
    const fetchOffers = async () => {
      try {
        console.log(`[Checkout] Fetching offers for restaurant ${orderRestaurantId}`);
        const res = await api.get(`/offers/public/restaurant/${orderRestaurantId}`);
        console.log('[Checkout] Offers API response:', res.data);
        if (res.data.success) {
          setRestaurantOffers(res.data.data);
          console.log('[Checkout] Updated restaurantOffers state:', res.data.data);
        }
      } catch (err) {
        console.error('[Checkout] Error fetching offers:', err);
      }
    };
    fetchOffers();
  }, [orderRestaurantId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryAddress(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!deliveryAddress.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!deliveryAddress.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(deliveryAddress.phone.trim())) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (!deliveryAddress.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(deliveryAddress.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!deliveryAddress.address.trim()) {
      newErrors.address = 'Delivery address is required';
    }
    
    if (!deliveryAddress.city) {
      newErrors.city = 'Please select a city';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      addToast('Please fill in all required fields', { type: 'error' });
      return;
    }

    // Validate we have a restaurantId
    if (!orderRestaurantId) {
      console.error('Missing restaurantId for order!');
      addToast('Unable to create order: Restaurant information is missing', { type: 'error' });
      return;
    }

    // Recalculate adjusted total (including offers)
    const recalcItems = cartItems.map(item => {
      const rawBasePrice = item.basePrice != null
        ? item.basePrice
        : item.unitPrice != null
          ? item.unitPrice
          : (item.price && item.quantity ? item.price / item.quantity : 0);
      const offer = restaurantOffers.filter(o => {
        if (o.appliesTo === 'All Menu') return true;
        if (o.appliesTo === 'Selected Items' && Array.isArray(o.menuItems)) {
          return o.menuItems.some(mi => (mi._id || mi.id || '').toString() === item.menuItemId.toString());
        }
        return false;
      }).reduce((best, cur) => cur.discountPercentage > best.discountPercentage ? cur : best, { discountPercentage: 0 });
      const discount = offer.discountPercentage || 0;
      const discountedBase = Math.round((rawBasePrice * (100 - discount)) / 100 * 100) / 100;
      const addOnCost = (item.selectedAddOns || []).reduce((sum, a) => sum + (a.price || 0), 0);
      const unitPrice = Math.round((discountedBase + addOnCost) * 100) / 100;
      const lineTotal = Math.round((unitPrice * item.quantity) * 100) / 100;
      return lineTotal;
    });
    const adjustedSub = recalcItems.reduce((sum, v) => sum + v, 0);
    const adjustedTotal = adjustedSub + cartStats.shipping;
    setIsLoading(true);

    // Create a unique order number (can still be generated locally if needed)
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create order payload
    const orderPayload = {
      orderNumber: orderNumber,
      userId: currentUser?._id || "67fb33ee85f505c7e9c02a7d",
      items: cartItems.map(item => ({
        menuItemId: item.menuItemId || item.id,
        name: item.name,
        price: item.unitPrice || item.basePrice || (item.price / item.quantity),
        quantity: item.quantity,
        selectedAddOns: (item.selectedAddOns || []).map(addOn => ({ id: addOn.id })),
        cookingMethod: item.customizationDetails?.cookingMethod,
        specialInstructions: item.customizationDetails?.specialInstructions
      })),
      restaurantId: orderRestaurantId,
      totalPrice: cartStats.total,
      subTotal: cartStats.subTotal,
      deliveryFee: cartStats.shipping,
      discount: pointsToRedeem, // Loyalty discount
      loyaltyPointsUsed: pointsToRedeem,
      deliveryAddress: {
        fullName: deliveryAddress.fullName,
        phone: deliveryAddress.phone,
        email: deliveryAddress.email,
        address: deliveryAddress.address,
        additionalInfo: deliveryAddress.additionalInfo || ''
      },
      orderNote: deliveryAddress.additionalInfo || '',
      paymentMethod: paymentMethod === 'khalti' ? 'KHALTI' : 'CASH'
    };

    console.log('Order payload prepared:', orderPayload);

    try {
      // Debug check: Pre-verify that restaurant exists
      console.log('Validating restaurant existence...', orderRestaurantId);
      console.log(`[Checkout] Attempting to validate restaurant with cleaned ID: '${orderRestaurantId}' (Type: ${typeof orderRestaurantId})`);
      
      const validateResponse = await userAPI.getRestaurantDetails(orderRestaurantId);
      console.log('Restaurant validation response:', validateResponse);
      
      // Only proceed if restaurant was found
      if (!validateResponse?.data?.success) {
        console.error('Restaurant validation failed:', validateResponse?.data?.message || 'Unknown error');
        
        // Display a user-friendly error message based on specific error type
        if (validateResponse?.data?.message === 'Invalid restaurant ID format') {
          addToast('Invalid restaurant information. Please clear your cart and try again.', { type: 'error' });
        } else if (validateResponse?.data?.message === 'Restaurant not found') {
          // Check if this might be a case of menu item ID being used as restaurant ID
          const firstItem = cartItems[0];
          const menuItemId = firstItem.menuItemId || firstItem.id;
          if (menuItemId && orderRestaurantId === cleanObjectId(menuItemId)) {
            addToast('Unable to process order: The restaurant information is incorrectly configured. Please clear your cart and try again.', { type: 'error' });
          } else {
            addToast('The selected restaurant is no longer available. Please try ordering from another restaurant.', { type: 'error' });
          }
        } else {
          addToast('Unable to place order: Restaurant validation failed. Please try again.', { type: 'error' });
        }
        
        setIsLoading(false);
        navigate('/cart'); // Return to cart
        return;
      }
      
      // STEP 1: Create the order in the database *first*
      console.log('Attempting to create order in DB...');
      const orderCreationResponse = await userAPI.createOrder(orderPayload);
      console.log('Order creation response:', orderCreationResponse);

      if (orderCreationResponse?.data?.success) {
        // Correctly access the order object from response.data.data
        const createdOrder = orderCreationResponse.data.data;
        
        if (!createdOrder || !createdOrder._id) {
            console.error('Order data or _id missing in the response:', orderCreationResponse.data);
            addToast('Failed to retrieve created order details.', { type: 'error' });
            setIsLoading(false);
            return;
        }

        const actualOrderId = createdOrder._id; // Use the ID from the database
        console.log('Order created successfully with ID:', actualOrderId);

        // STEP 2: Handle payment method based on the created order
        if (paymentMethod === 'cod') {
          console.log('Processing Cash on Delivery...');
          navigate(`/order-confirmation/${actualOrderId}`);
          addToast('Order placed successfully!', { type: 'success' });
          setIsLoading(false);
          return; 
        }
        
        if (paymentMethod === 'khalti') {
          console.log('Order created, proceeding to Khalti initiation for order ID:', actualOrderId);
          // Pay adjusted total minus redeemed points
          const amountToPay = adjustedTotal - pointsToRedeem;
          setKhaltiDetails({ orderId: actualOrderId, amount: amountToPay });
          setShowKhalti(true);
          setIsLoading(false); // Khalti component handles its own loading
          return;
        }
      } else {
        // Order creation failed
        const errorMsg = orderCreationResponse?.data?.message || 'Failed to create order in database';
        console.error('Order creation failed:', errorMsg);
        
        // Special case for "Restaurant not found" error
        if (errorMsg === 'Restaurant not found') {
          addToast('Restaurant not found. Please try adding items from an active restaurant.', { type: 'error' });
          navigate('/cart'); // Return to cart
        } else if (errorMsg === 'Invalid restaurant ID format') {
          addToast('Invalid restaurant information. Please clear your cart and try again.', { type: 'error' });
          navigate('/cart'); // Return to cart
        } else {
          addToast(errorMsg, { type: 'error' });
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error during order placement or payment initiation:', error);
      
      // Check for specific axios error responses
      if (error.response) {
        console.log('Error response data:', error.response.data);
        console.log('Error response status:', error.response.status);
        
        // Special handling for 404 (Restaurant not found)
        if (error.response.status === 404 && error.response.data?.message === 'Restaurant not found') {
          addToast('Restaurant not found. Please try adding items from an active restaurant.', { type: 'error' });
          navigate('/cart');
        } else {
          addToast(error.response.data?.message || 'Error processing your order. Please try again.', { type: 'error' });
        }
      } else {
        addToast('Error processing your order. Please try again.', { type: 'error' });
      }
      
      setIsLoading(false);
    }
  };

  // Compute adjusted items with offers
  console.log('[Checkout] cartItems:', cartItems);
  console.log('[Checkout] restaurantOffers:', restaurantOffers);
  const adjustedItems = cartItems.map(item => {
    // Determine raw base price (fallback to unitPrice or total price/quantity)
    const rawBasePrice = item.basePrice != null
      ? item.basePrice
      : item.unitPrice != null
        ? item.unitPrice
        : (item.price && item.quantity ? item.price / item.quantity : 0);
    // Find best applicable offer for this item
    const offer = restaurantOffers.filter(o => {
      if (o.appliesTo === 'All Menu') return true;
      if (o.appliesTo === 'Selected Items' && Array.isArray(o.menuItems)) {
        // menuItems may be populated objects
        return o.menuItems.some(mi => (mi._id || mi.id || '').toString() === item.menuItemId.toString());
      }
      return false;
    }).reduce((best, cur) => cur.discountPercentage > best.discountPercentage ? cur : best, { discountPercentage: 0 });
    console.log(`[Checkout] Item ${item.menuItemId} best offer:`, offer);
    const discount = offer.discountPercentage || 0;
    const discountedBase = Math.round((rawBasePrice * (100 - discount)) / 100 * 100) / 100;
    const addOnCost = (item.selectedAddOns || []).reduce((sum, a) => sum + (a.price || 0), 0);
    const unitPrice = Math.round((discountedBase + addOnCost) * 100) / 100;
    const lineTotal = Math.round((unitPrice * item.quantity) * 100) / 100;
    return { ...item, offer, basePrice: rawBasePrice, discountedBase, unitPrice, lineTotal };
  });
  console.log('[Checkout] adjustedItems:', adjustedItems);
  const adjustedSubTotal = adjustedItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const adjustedTotal = adjustedSubTotal + cartStats.shipping;

  return (
    <section className="py-10">
      <Container>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Checkout</h1>
          {!showKhalti && (
            <Link
              to="/cart"
              className="inline-flex items-center transition-colors text-yumrun-primary hover:text-yumrun-secondary"
            >
              <FiArrowLeft className="mr-2" />
              Back to Cart
            </Link>
          )}
        </div>

        {!showKhalti ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Delivery Information */}
            <div className="space-y-6 lg:col-span-2">
              {/* Delivery Address */}
              <Card>
                <div className="flex items-center p-4 border-b border-gray-100 bg-gray-50">
                  <FiMapPin className="mr-2 text-yumrun-primary" />
                  <h2 className="font-medium">Delivery Information</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="fullName" className="mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <div className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2">
                          <FiUser />
                        </div>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={deliveryAddress.fullName}
                          onChange={handleInputChange}
                          className={`pl-10 ${errors.fullName ? 'border-red-500' : ''}`}
                          placeholder="Your full name"
                        />
                      </div>
                      {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="phone" className="mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <div className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2">
                          <FiPhone />
                        </div>
                        <Input
                          id="phone"
                          name="phone"
                          value={deliveryAddress.phone}
                          onChange={handleInputChange}
                          className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                          placeholder="10-digit phone number"
                        />
                      </div>
                      {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <div className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2">
                        <FiMail />
                      </div>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={deliveryAddress.email}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                        placeholder="Your email address"
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="address" className="mb-1.5">
                      Delivery Address <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-3.5 text-gray-400">
                        <FiHome />
                      </div>
                      <Textarea
                        id="address"
                        name="address"
                        value={deliveryAddress.address}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.address ? 'border-red-500' : ''}`}
                        placeholder="Your delivery address"
                        rows={2}
                      />
                    </div>
                    {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="city" className="mb-1.5">
                        City <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <select
                          id="city"
                          name="city"
                          value={deliveryAddress.city}
                          onChange={(e) => {
                            const value = e.target.value;
                            setDeliveryAddress(prev => ({ ...prev, city: value }));
                            if (errors.city) {
                              setErrors(prev => ({ ...prev, city: null }));
                            }
                          }}
                          className={`w-full rounded-md border ${errors.city ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-yumrun-primary`}
                        >
                          <option value="" disabled>Select city</option>
                          <option value="Bhaktapur">Bhaktapur</option>
                          <option value="Kathmandu">Kathmandu</option>
                          <option value="Lalitpur">Lalitpur</option>
                        </select>
                      </div>
                      {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="additionalInfo" className="mb-1.5">
                        Additional Information
                      </Label>
                      <Textarea
                        id="additionalInfo"
                        name="additionalInfo"
                        value={deliveryAddress.additionalInfo}
                        onChange={handleInputChange}
                        placeholder="Landmark, delivery instructions, etc."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Payment Method */}
              <Card>
                <div className="flex items-center p-4 border-b border-gray-100 bg-gray-50">
                  <FiCreditCard className="mr-2 text-yumrun-primary" />
                  <h2 className="font-medium">Payment Method</h2>
                </div>
                
                <div className="p-6">
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="khalti" id="khalti" />
                      <Label htmlFor="khalti" className="flex items-center cursor-pointer">
                        <img src="/images/khalti-logo.png" alt="Khalti" className="h-8 mr-2" />
                        Pay with Khalti
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="cursor-pointer">
                        Cash on Delivery (COD)
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {paymentMethod === 'khalti' && (
                    <Alert variant="info" className="mt-4">
                      You will be redirected to Khalti to complete your payment.
                    </Alert>
                  )}
                  
                  {paymentMethod === 'cod' && (
                    <Alert variant="info" className="mt-4">
                      Please have the exact amount ready for the delivery person.
                    </Alert>
                  )}
                </div>
              </Card>
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <Card className="overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-medium">Order Summary</h2>
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-4 overflow-y-auto max-h-64">
                      {adjustedItems.map((item) => (
                        <div key={item.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span>{item.quantity} × Rs. {item.unitPrice.toFixed(2)}</span>
                              {item.offer.discountPercentage > 0 && (
                                <span className="text-xs text-gray-400 line-through">Rs. {item.basePrice.toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">Rs. {item.lineTotal.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Loyalty Points Section */}
                    <div className="p-4 mb-4 border border-gray-200 rounded-md bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Loyalty Points</span>
                        <span className="font-semibold">{loyaltyInfo.currentPoints || 0}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="w-5 h-5 form-checkbox text-yumrun-primary"
                            disabled={loyaltyInfo.currentPoints <= 0}
                            checked={pointsToRedeem > 0}
                            onChange={() => {
                              const available = Math.min(loyaltyInfo.currentPoints, Math.floor(cartStats.total));
                              setPointsToRedeem(pointsToRedeem > 0 ? 0 : available);
                            }}
                          />
                          <span className="ml-2">Redeem points</span>
                        </label>
                      </div>
                      {loyaltyInfo.currentPoints > 0 && pointsToRedeem === 0 && (
                        <p className="mt-2 text-sm text-gray-500">
                          You have {loyaltyInfo.currentPoints} points available
                        </p>
                      )}
                      {pointsToRedeem > 0 && (
                        <p className="mt-2 text-sm text-green-600">
                          Redeeming {pointsToRedeem} points for Rs. {pointsToRedeem.toFixed(2)} off
                        </p>
                      )}
                    </div>
                    
                    <div className="pt-3 space-y-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">Rs. {adjustedSubTotal.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-medium">
                          {cartStats.shipping === 0 ? 'Free' : `Rs. ${cartStats.shipping.toFixed(2)}`}
                        </span>
                      </div>
                      
                      <div className="h-px my-3 bg-gray-100"></div>
                      
                      <div className="flex items-center justify-between font-medium">
                        <span>Total</span>
                        <span className="text-lg text-yumrun-accent">Rs. {(adjustedTotal - pointsToRedeem).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <Button 
                        className="w-full py-3" 
                        size="lg" 
                        onClick={handlePlaceOrder}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Processing...
                          </>
                        ) : (
                          `Place Order - Rs. ${(adjustedTotal - pointsToRedeem).toFixed(2)}`
                        )}
                      </Button>
                      
                      <div className="mt-4 text-xs text-center text-gray-500">
                        <p>By completing your purchase, you agree to these <Link to="/terms" className="underline">Terms of Service</Link>.</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          // Render Khalti Component when showKhalti is true
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md">
              {khaltiDetails.orderId && khaltiDetails.amount ? (
                <KhaltiPayment
                  orderId={khaltiDetails.orderId}
                  amount={khaltiDetails.amount}
                  onFailure={(error) => {
                    console.error('Khalti payment initiation failed:', error);
                    addToast(error || 'Khalti payment failed', { type: 'error' });
                    setShowKhalti(false); // Go back to checkout form on failure
                    setKhaltiDetails({ orderId: null, amount: null });
                  }}
                />
              ) : (
                // Optional: Show a loading or error state if details aren't ready
                <div className="p-6 text-center">
                  <Spinner size="lg" />
                  <p className="mt-2 text-gray-600">Preparing Khalti payment...</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </Container>
    </section>
  );
};

export default Checkout; 