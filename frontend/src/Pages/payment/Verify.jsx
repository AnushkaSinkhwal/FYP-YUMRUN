import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userAPI } from '../../utils/api';
import { Card, Button, Alert } from '../../components/ui';

const PaymentVerificationPage = () => {
  const [queryParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      // Get parameters from URL
      const pidx = queryParams.get('pidx');
      let orderId = queryParams.get('orderId');
      const method = queryParams.get('method') || 'khalti'; // Default to Khalti
      const txnStatus = queryParams.get('status');
      
      console.log('Payment callback received:', { 
        pidx, 
        orderId, 
        method, 
        status: txnStatus,
        allParams: Object.fromEntries(queryParams.entries())
      });
      
      // If order ID is missing but we have pidx, try to get order ID from session storage
      if (!orderId && pidx) {
        try {
          const pendingOrderJson = sessionStorage.getItem('pendingOrder');
          if (pendingOrderJson) {
            const pendingOrder = JSON.parse(pendingOrderJson);
            if (pendingOrder.pidx === pidx || !pendingOrder.pidx) {
              orderId = pendingOrder.orderId;
              console.log('Retrieved order ID from session storage:', orderId);
            }
          }
        } catch (error) {
          console.error('Error retrieving order ID from session storage:', error);
        }
      }
      
      // If we don't have necessary params, show error
      if (!pidx || !orderId) {
        setStatus('error');
        setError('Missing payment information. Please try again or check your orders page.');
        return;
      }
      
      // If the status indicates a failure, show error without verification
      if (txnStatus === 'User canceled' || txnStatus === 'Failed' || txnStatus === 'Expired') {
        setStatus('error');
        setError(`Payment ${txnStatus.toLowerCase()}. Please try again.`);
        return;
      }
      
      try {
        console.log(`Verifying ${method} payment for order ${orderId} with pidx ${pidx}`);
        
        // Process based on payment method
        if (method === 'khalti') {
          const response = await userAPI.verifyKhaltiPayment({
            pidx,
            orderId
          });
          
          console.log('Payment verification response:', response);
          
          if (response.data && response.data.success) {
            // Determine status based on payment status
            const paymentStatus = response.data.data?.status;
            
            if (paymentStatus === 'Completed') {
              setStatus('success');
              setOrderDetails(response.data.data.order);
              
              // Clear pending order from session storage
              sessionStorage.removeItem('pendingOrder');
            } else if (paymentStatus === 'Pending') {
              setStatus('pending');
              setOrderDetails(response.data.data.order);
            } else {
              setStatus('error');
              setError(`Payment status is ${paymentStatus}. Please try again or contact support.`);
            }
          } else {
            setStatus('error');
            setError(response.data?.message || 'Payment verification failed');
          }
        } else {
          // For future payment methods
          setStatus('error');
          setError('Unsupported payment method');
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        setStatus('error');
        
        // Extract more detailed error information if available
        let errorMessage = 'An error occurred while verifying payment. Please check your orders page or contact support.';
        if (err.response) {
          errorMessage = err.response.data?.message || err.response.statusText || errorMessage;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      }
    };
    
    verifyPayment();
  }, [queryParams, navigate]);

  const handleTryAgain = () => {
    // Check if we have order details to retry payment
    const pendingOrderJson = sessionStorage.getItem('pendingOrder');
    if (pendingOrderJson) {
      try {
        const pendingOrder = JSON.parse(pendingOrderJson);
        if (pendingOrder.orderId) {
          navigate(`/payment/${pendingOrder.orderId}`);
          return;
        }
      } catch (error) {
        console.error('Error retrieving pending order for retry:', error);
      }
    }
    // If no order details, just go to orders page
    navigate('/orders');
  };

  const handleGoToOrder = () => {
    if (orderDetails && orderDetails._id) {
      navigate(`/orders/${orderDetails._id}`);
    } else {
      navigate('/orders');
    }
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6">
        {status === 'processing' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-blue-500">
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-700 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              Your payment has been successfully processed. Your order is now confirmed.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={handleGoToOrder}>View Order</Button>
              <Button variant="outline" onClick={handleGoToHome}>Go to Home</Button>
            </div>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-700 mb-2">Payment Failed</h2>
            <Alert variant="destructive" className="mb-4">
              {error || 'There was an error processing your payment. Please try again.'}
            </Alert>
            <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={handleTryAgain}>Try Again</Button>
              <Button variant="outline" onClick={handleGoToHome}>Go to Home</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PaymentVerificationPage; 