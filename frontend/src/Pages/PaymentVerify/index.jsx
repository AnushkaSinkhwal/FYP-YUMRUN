import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyKhaltiPayment } from '../../utils/payment';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userAPI } from '../../utils/api';
import { useCart } from '../../context/CartContext';
import { Container, Card, Spinner, Alert, Button } from '../../components/ui';
import { FiCheckCircle, FiAlertTriangle, FiShoppingBag } from 'react-icons/fi';

const PaymentVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const { clearCart } = useCart();
  
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Verifying your payment...');
  const [orderData, setOrderData] = useState(null);
  
  const pidx = searchParams.get('pidx');
  const txnStatus = searchParams.get('status');
  
  useEffect(() => {
    // Try to get the pending order from session storage
    const pendingOrderJson = sessionStorage.getItem('pendingOrder');
    let pendingOrder = null;
    
    if (pendingOrderJson) {
      try {
        pendingOrder = JSON.parse(pendingOrderJson);
        setOrderData(pendingOrder);
        console.log('Pending order retrieved:', pendingOrder);
      } catch (error) {
        console.error('Error parsing pending order data:', error);
      }
    } else {
      console.log('No pending order data found in session storage');
    }

    // Try to get the order payload from session storage
    const orderPayloadJson = sessionStorage.getItem('orderPayload');
    let orderPayload = null;
    
    if (orderPayloadJson) {
      try {
        orderPayload = JSON.parse(orderPayloadJson);
        console.log('Order payload retrieved:', orderPayload);
      } catch (error) {
        console.error('Error parsing order payload data:', error);
      }
    }

    if (!currentUser) {
      navigate('/signin');
      return;
    }
    
    // If no pidx, something is wrong
    if (!pidx) {
      setStatus('error');
      setMessage('Invalid payment verification request - missing transaction reference');
      setIsLoading(false);
      return;
    }
    
    // Check payment status from URL parameters
    if (txnStatus === 'Completed') {
      // Even if the URL says completed, we should verify with our backend
      console.log('Transaction reported as completed, verifying...');
    } else if (txnStatus === 'Failed' || txnStatus === 'Cancelled') {
      setStatus('failed');
      setMessage(txnStatus === 'Cancelled' ? 'Payment was cancelled' : 'Payment failed');
      setIsLoading(false);
      return;
    } else if (txnStatus === 'User canceled') {
      setStatus('canceled');
      setMessage('You canceled the payment process');
      setIsLoading(false);
      return;
    }
    
    // Verify payment through API
    const verifyPayment = async () => {
      try {
        setIsLoading(true);
        console.log('Verifying payment with pidx:', pidx);
        
        const result = await verifyKhaltiPayment({ pidx });
        console.log('Payment verification result:', result);
        
        if (result.success) {
          // Create the order in the database
          if (orderPayload) {
            try {
              console.log('Creating order in database...');
              const orderResponse = await userAPI.createOrder(orderPayload);
              
              if (orderResponse.data && orderResponse.data.success) {
                console.log('Order created successfully:', orderResponse.data.order);
                // Update orderData with the actual order ID from the database
                if (pendingOrder) {
                  pendingOrder.orderId = orderResponse.data.order._id;
                  setOrderData(pendingOrder);
                }
                
                // Clear the cart
                clearCart();
                
                setStatus('success');
                setMessage('Payment successful! Your order has been confirmed.');
                addToast('Order placed successfully!', { type: 'success' });
              } else {
                console.error('Error creating order:', orderResponse.data);
                setStatus('success-payment-only');
                setMessage('Payment successful, but there was an issue creating your order. Our team will contact you.');
                addToast('Payment successful, but order creation failed.', { type: 'warning' });
              }
            } catch (orderError) {
              console.error('Error creating order:', orderError);
              setStatus('success-payment-only');
              setMessage('Payment successful, but there was an issue creating your order. Our team will contact you.');
              addToast('Payment successful, but order creation failed.', { type: 'warning' });
            }
          } else {
            setStatus('success');
            setMessage('Payment successful! Your order has been confirmed.');
            addToast('Payment verified successfully', { type: 'success' });
          }
          
          // Clear any pending order data from session storage on success
          sessionStorage.removeItem('pendingOrder');
          sessionStorage.removeItem('orderPayload');
          sessionStorage.removeItem('cartItems');
        } else {
          if (result.status === 'Pending') {
            setStatus('pending');
            setMessage('Your payment is being processed. We will notify you once completed.');
            addToast('Payment is being processed', { type: 'info' });
          } else {
            setStatus('failed');
            setMessage(result.message || 'Payment verification failed');
            addToast('Payment verification failed', { type: 'error' });
          }
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your payment');
        addToast('Payment verification error', { type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    
    verifyPayment();
  }, [pidx, txnStatus, currentUser, navigate, addToast, clearCart]);
  
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <FiCheckCircle className="h-12 w-12 text-green-500" />;
      case 'pending':
        return <FiAlertTriangle className="h-12 w-12 text-yellow-500" />;
      case 'canceled':
      case 'failed':
      case 'error':
        return <FiAlertTriangle className="h-12 w-12 text-red-500" />;
      default:
        return null;
    }
  };
  
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'canceled':
      case 'failed':
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };
  
  return (
    <Container className="py-10">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-6">Payment Verification</h1>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Spinner size="lg" className="mb-4" />
                <p className="text-gray-600">Verifying your payment...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className={`p-6 border rounded-lg ${getStatusColor()}`}>
                  <div className="flex flex-col items-center">
                    {getStatusIcon()}
                    <h2 className="text-xl font-semibold mt-4">
                      {status === 'success' ? 'Payment Successful' : 
                       status === 'pending' ? 'Payment Pending' : 
                       status === 'canceled' ? 'Payment Canceled' : 'Payment Failed'}
                    </h2>
                    <p className="text-gray-600 mt-2 text-center">{message}</p>
                    {orderData && (
                      <div className="mt-3 text-sm text-gray-500">
                        <p>Order ID: {orderData.orderId}</p>
                        <p>Amount: Rs. {orderData.amount.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {status === 'success' && (
                  <div className="space-y-4">
                    <Alert>Your order has been confirmed. Thank you for your purchase!</Alert>
                    <div className="flex justify-center">
                      <Button 
                        className="mr-4"
                        onClick={() => navigate('/user/orders')}
                      >
                        View My Orders
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/')}
                      >
                        <FiShoppingBag className="mr-2" />
                        Continue Shopping
                      </Button>
                    </div>
                  </div>
                )}
                
                {status === 'pending' && (
                  <div className="space-y-4">
                    <Alert variant="warning">
                      Your payment is being processed. This may take a few minutes. You can check the status in your orders.
                    </Alert>
                    <div className="flex justify-center">
                      <Button 
                        className="mr-4"
                        onClick={() => navigate('/user/orders')}
                      >
                        View My Orders
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/')}
                      >
                        <FiShoppingBag className="mr-2" />
                        Continue Shopping
                      </Button>
                    </div>
                  </div>
                )}
                
                {(status === 'failed' || status === 'error' || status === 'canceled') && (
                  <div className="space-y-4">
                    <Alert variant="destructive">
                      {status === 'canceled' 
                        ? 'You canceled the payment process.' 
                        : 'There was a problem with your payment. Please try again or choose a different payment method.'}
                    </Alert>
                    <div className="flex justify-center">
                      <Button 
                        className="mr-4"
                        onClick={() => navigate('/checkout')}
                      >
                        Try Again
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/')}
                      >
                        <FiShoppingBag className="mr-2" />
                        Continue Shopping
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default PaymentVerify; 