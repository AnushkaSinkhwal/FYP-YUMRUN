import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userAPI } from '../../utils/api';
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
  const { cartItems, cartStats, clearCart } = useCart();
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('khalti');
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    address: currentUser?.address || '',
    city: 'Bhaktapur',
    additionalInfo: '',
  });
  const [orderRestaurantId, setOrderRestaurantId] = useState(null);

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

    // Get restaurantId from first cart item
    const firstItem = cartItems[0];
    console.log('First cart item:', firstItem);
    
    let restaurantId = null;
    
    // Try to get restaurantId from different possible locations
    if (firstItem.restaurantId) {
      restaurantId = firstItem.restaurantId;
      console.log('Found restaurantId directly:', restaurantId);
    } else if (firstItem.restaurant?.id) {
      restaurantId = firstItem.restaurant.id;
      console.log('Found restaurantId from restaurant.id:', restaurantId);
    } else if (firstItem.restaurant?._id) {
      restaurantId = firstItem.restaurant._id;
      console.log('Found restaurantId from restaurant._id:', restaurantId);
    } else if (firstItem.id && firstItem.id.includes(':')) {
      // Try to extract restaurant ID from item ID if it follows pattern restaurant_id:product_id
      const parts = firstItem.id.split(':');
      if (parts.length === 2) {
        restaurantId = parts[0];
        console.log('Extracted restaurantId from id:', restaurantId);
      }
    }

    // If still no restaurantId, try to use restaurant name to find it
    if (!restaurantId && firstItem.restaurant?.name) {
      console.log('No restaurantId found, trying to find by restaurant name:', firstItem.restaurant.name);
      // This would require an API call to look up the restaurant by name
      // For now, we'll log a warning and redirect
      addToast('Unable to determine restaurant for order', { type: 'error' });
      navigate('/cart');
      return;
    }

    // Validate we have a restaurantId
    if (!restaurantId) {
      console.error('No restaurantId found in cart items:', cartItems);
      addToast('Unable to create order: Restaurant information is missing', { type: 'error' });
      navigate('/cart');
      return;
    }

    // Validate all items are from same restaurant if restaurantId exists
    const hasMultipleRestaurants = cartItems.some(item => {
      const itemRestaurantId = 
        item.restaurantId || 
        item.restaurant?.id || 
        item.restaurant?._id || 
        (item.id && item.id.includes(':') ? item.id.split(':')[0] : null);
      
      return itemRestaurantId && itemRestaurantId !== restaurantId;
    });

    if (hasMultipleRestaurants) {
      addToast('Error: Items from multiple restaurants detected in cart', { 
        type: 'error',
        duration: 7000
      });
      navigate('/cart');
      return;
    }

    console.log('Setting order restaurantId:', restaurantId);
    // Set restaurant ID for the order
    setOrderRestaurantId(restaurantId);
  }, [cartItems, navigate, addToast]);

  // Update form when user data changes
  useEffect(() => {
    if (currentUser) {
      setDeliveryAddress(prev => ({
        ...prev,
        fullName: currentUser.name || prev.fullName,
        email: currentUser.email || prev.email,
        phone: currentUser.phone || prev.phone,
        address: currentUser.address || prev.address,
      }));
    }
  }, [currentUser]);

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

    setIsLoading(true);

    // Create a unique order number (can still be generated locally if needed)
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create order payload
    const orderPayload = {
      orderNumber: orderNumber,
      userId: currentUser?._id || "67fb33ee85f505c7e9c02a7d",
      items: cartItems.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        options: item.options || []
      })),
      restaurantId: orderRestaurantId,
      totalPrice: cartStats.subTotal,
      deliveryFee: cartStats.shipping,
      tax: 0,
      grandTotal: cartStats.total,
      status: 'PENDING',
      paymentMethod: paymentMethod === 'cod' ? 'CASH' : 'KHALTI',
      paymentStatus: 'PENDING',
      isPaid: false,
      deliveryAddress: {
        fullAddress: deliveryAddress.address + (deliveryAddress.city ? `, ${deliveryAddress.city}` : '') + ', Nepal',
        street: deliveryAddress.address,
        city: deliveryAddress.city || 'Bhaktapur',
        country: 'Nepal'
      },
      specialInstructions: deliveryAddress.additionalInfo || ''
    };

    console.log('Order payload prepared:', orderPayload);

    try {
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
          clearCart();
          navigate(`/order-confirmation/${actualOrderId}`);
          addToast('Order placed successfully!', { type: 'success' });
          setIsLoading(false);
          return; 
        }
        
        if (paymentMethod === 'khalti') {
          console.log('Order created, proceeding to Khalti initiation for order ID:', actualOrderId);
          setKhaltiDetails({ orderId: actualOrderId, amount: createdOrder.grandTotal }); // Use actual order ID and amount
          setShowKhalti(true);
          setIsLoading(false); // Khalti component handles its own loading
          return;
        }

      } else {
        // Order creation failed
        const errorMsg = orderCreationResponse?.data?.message || 'Failed to create order in database';
        console.error('Order creation failed:', errorMsg);
        addToast(errorMsg, { type: 'error' });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error during order placement or payment initiation:', error);
      let errorMessage = 'Failed to place order. Please try again.';
      if (error.response) {
         errorMessage = error.response.data?.message || errorMessage;
      }
      addToast(errorMessage, { type: 'error' });
      setIsLoading(false);
    }
  };

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
                        City
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        value={deliveryAddress.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        disabled
                      />
                      <p className="mt-1 text-sm text-gray-500">Currently we only deliver in Bhaktapur</p>
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
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              {item.quantity} × Rs.{item.price}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">Rs.{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-3 space-y-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">Rs.{cartStats.subTotal.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-medium">
                          {cartStats.shipping === 0 ? 'Free' : `Rs.${cartStats.shipping.toFixed(2)}`}
                        </span>
                      </div>
                      
                      <div className="h-px my-3 bg-gray-100"></div>
                      
                      <div className="flex items-center justify-between font-medium">
                        <span>Total</span>
                        <span className="text-lg text-yumrun-accent">Rs.{cartStats.total.toFixed(2)}</span>
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
                          `Place Order - Rs.${cartStats.total.toFixed(2)}`
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