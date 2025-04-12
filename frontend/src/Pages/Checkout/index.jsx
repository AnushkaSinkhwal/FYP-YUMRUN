import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { initiateKhaltiPayment } from '../../utils/payment';
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
    let restaurantId = firstItem.restaurantId;
    
    // Try to get restaurantId from different possible locations
    if (!restaurantId) {
      if (firstItem.restaurant?.id) {
        restaurantId = firstItem.restaurant.id;
      } else if (firstItem.restaurant?._id) {
        restaurantId = firstItem.restaurant._id;
      } else if (firstItem.id) {
        // Try to extract restaurant ID from item ID if it follows pattern restaurant_id:product_id
        const parts = firstItem.id.split(':');
        if (parts.length === 2) {
          restaurantId = parts[0];
        }
      }
    }

    // Validate all items are from same restaurant if restaurantId exists
    if (restaurantId) {
      const hasMultipleRestaurants = cartItems.some(item => {
        const itemRestaurantId = item.restaurantId || item.restaurant?.id || item.restaurant?._id;
        return itemRestaurantId && itemRestaurantId !== restaurantId;
      });

      if (hasMultipleRestaurants) {
        addToast('Error: Items from multiple restaurants detected in cart', { 
          type: 'error',
          duration: 5000
        });
        navigate('/cart');
        return;
      }
    }

    // Set restaurant ID for the order
    setOrderRestaurantId(restaurantId || null);
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

    setIsLoading(true);

    try {
      // Get first cart item to identify restaurant
      if (!cartItems.length) {
        addToast('Your cart is empty', { type: 'error' });
        setIsLoading(false);
        return;
      }
      
      // Create a unique order ID
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Create order payload
      const orderPayload = {
        orderNumber: orderId,
        userId: currentUser._id,
        items: cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          options: item.options || []
        })),
        restaurantId: orderRestaurantId || cartItems[0]?.id?.split(':')[0] || cartItems[0]?.restaurantId,
        totalPrice: cartStats.subTotal,
        deliveryFee: cartStats.shipping,
        tax: 0,
        grandTotal: cartStats.total,
        status: 'PENDING',
        paymentMethod: paymentMethod === 'cod' ? 'CASH' : 'KHALTI',
        paymentStatus: 'PENDING',
        isPaid: false,
        deliveryAddress: {
          street: deliveryAddress.address,
          city: deliveryAddress.city,
          state: '',
          zipCode: '',
          country: 'Nepal'
        },
        specialInstructions: deliveryAddress.additionalInfo || ''
      };
      
      console.log('Order payload:', orderPayload);
      
      // If payment method is cash on delivery
      if (paymentMethod === 'cod') {
        try {
          // Create order in the database
          console.log('Sending order payload:', orderPayload);
          const response = await userAPI.createOrder(orderPayload);
          
          if (response.data && response.data.success) {
            // Clear cart and redirect to confirmation page
            clearCart();
            navigate(`/order-confirmation/${response.data.order._id}`);
            addToast('Order placed successfully!', { type: 'success' });
          } else {
            const errorMsg = response.data?.message || 'Failed to create order';
            console.error('Order creation failed:', errorMsg);
            throw new Error(errorMsg);
          }
        } catch (error) {
          console.error('Error creating order:', error);
          let errorMessage = 'Failed to create order. Please try again.';
          
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Server error response:', error.response.data);
            errorMessage = error.response.data?.message || 
                         error.response.data?.error || 
                         'Server error: ' + error.response.status;
          } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request);
            errorMessage = 'No response from server. Please check your connection.';
          } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error setting up request:', error.message);
            errorMessage = error.message;
          }
          
          addToast(errorMessage, { 
            type: 'error',
            duration: 5000
          });
        } finally {
          setIsLoading(false);
        }
        return;
      }
      
      // For Khalti payment
      if (paymentMethod === 'khalti') {
        console.log('Initiating Khalti payment for order:', orderId);
        console.log('Amount:', cartStats.total);
        
        // Save order payload to session storage
        sessionStorage.setItem('orderPayload', JSON.stringify(orderPayload));
        
        // Create customer details object for Khalti
        const customerDetails = {
          name: deliveryAddress.fullName,
          email: deliveryAddress.email,
          phone: deliveryAddress.phone
        };
        
        console.log('Customer details:', customerDetails);
        
        // Save cart items to session storage for payment processing
        sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
        
        // Save order details to session storage for retrieval after payment
        sessionStorage.setItem('pendingOrder', JSON.stringify({
          orderId,
          items: cartItems,
          amount: cartStats.total,
          deliveryAddress,
          paymentMethod: 'khalti'
        }));
        
        // Initiate Khalti payment
        initiateKhaltiPayment(
          orderId,
          cartStats.total,
          customerDetails,
          (result) => {
            console.log('Khalti payment result:', result);
            
            if (!result.success) {
              // If payment initiation failed, show error and allow retry
              setIsLoading(false);
              addToast(result.message || 'Payment initiation failed. Please try again.', { type: 'error' });
            }
            
            // Note: We don't set isLoading to false on success because 
            // the user will be redirected to Khalti payment page
          }
        );
      }
    } catch (error) {
      console.error('Order placement error:', error);
      setIsLoading(false);
      addToast('Failed to place order. Please try again.', { type: 'error' });
    }
  };

  return (
    <section className="py-10">
      <Container>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Checkout</h1>
          <Link 
            to="/cart" 
            className="inline-flex items-center transition-colors text-yumrun-primary hover:text-yumrun-secondary"
          >
            <FiArrowLeft className="mr-2" />
            Back to Cart
          </Link>
        </div>

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
      </Container>
    </section>
  );
};

export default Checkout; 