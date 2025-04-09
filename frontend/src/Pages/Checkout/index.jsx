import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { initiateKhaltiPayment } from '../../utils/payment';
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

  // Form validation
  const [errors, setErrors] = useState({});

  // Check if cart is empty and redirect if needed
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
      addToast('Your cart is empty', { type: 'error' });
    }
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
      // Create a unique order ID
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // If payment method is cash on delivery, redirect to confirmation page
      if (paymentMethod === 'cod') {
        // Here you would make an API call to create the order in the backend
        // For now, we'll simulate a successful order
        setTimeout(() => {
          setIsLoading(false);
          clearCart();
          navigate(`/order-confirmation/${orderId}`);
          addToast('Order placed successfully!', { type: 'success' });
        }, 1500);
        return;
      }
      
      // For Khalti payment
      if (paymentMethod === 'khalti') {
        console.log('Initiating Khalti payment for order:', orderId);
        console.log('Amount:', cartStats.total);
        
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
          <h1 className="text-2xl sm:text-3xl font-bold">Checkout</h1>
          <Link 
            to="/cart" 
            className="inline-flex items-center text-yumrun-primary hover:text-yumrun-secondary transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Cart
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Delivery Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card>
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center">
                <FiMapPin className="mr-2 text-yumrun-primary" />
                <h2 className="font-medium">Delivery Information</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName" className="mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
                    {errors.fullName && <p className="mt-1 text-red-500 text-sm">{errors.fullName}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone" className="mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
                    {errors.phone && <p className="mt-1 text-red-500 text-sm">{errors.phone}</p>}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email" className="mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
                  {errors.email && <p className="mt-1 text-red-500 text-sm">{errors.email}</p>}
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
                  {errors.address && <p className="mt-1 text-red-500 text-sm">{errors.address}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center">
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
                  <div className="max-h-64 overflow-y-auto mb-4">
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
                  
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">Rs.{cartStats.subTotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium">
                        {cartStats.shipping === 0 ? 'Free' : `Rs.${cartStats.shipping.toFixed(2)}`}
                      </span>
                    </div>
                    
                    <div className="h-px bg-gray-100 my-3"></div>
                    
                    <div className="flex justify-between items-center font-medium">
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