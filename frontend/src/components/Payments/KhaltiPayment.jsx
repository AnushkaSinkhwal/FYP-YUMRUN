import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Alert } from '../ui';
import { userAPI } from '../../utils/api';

const KhaltiPayment = ({ orderId, amount, onSuccess, onFailure }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [khaltiStatus, setKhaltiStatus] = useState('initial');
  
  // We don't need the paymentDetails state since we're redirecting to Khalti
  // and not using this information locally

  useEffect(() => {
    // Check for Khalti callback in URL if this component is loaded after payment initiation
    const urlParams = new URLSearchParams(window.location.search);
    const pidx = urlParams.get('pidx');
    const status = urlParams.get('status');
    
    if (pidx && orderId) {
      verifyPayment(pidx);
    } else if (status === 'FAILED') {
      setError('Payment failed. Please try again.');
      setKhaltiStatus('failed');
      if (onFailure) onFailure('Payment failed');
    }
  }, [orderId, onFailure]);

  const initiatePayment = async () => {
    if (!orderId || !amount) {
      setError('Order ID and amount are required to proceed with payment');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Call the API to initiate Khalti payment
      const response = await userAPI.initiateKhaltiPayment({
        orderId,
        amount,
        returnUrl: `${window.location.origin}/payment/verify?orderId=${orderId}`
      });
      
      if (response.data.success) {
        setKhaltiStatus('initiated');
        // Store payment URL in local state if we need to access it before redirect
        
        // Redirect to Khalti payment page
        window.location.href = response.data.data.paymentUrl;
      } else {
        setError(response.data.message || 'Failed to initiate payment');
        setKhaltiStatus('failed');
        if (onFailure) onFailure(response.data.message || 'Failed to initiate payment');
      }
    } catch (err) {
      console.error('Error initiating Khalti payment:', err);
      setError('An error occurred while initiating payment');
      setKhaltiStatus('failed');
      if (onFailure) onFailure('An error occurred while initiating payment');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (pidx) => {
    setLoading(true);
    setError(null);
    setKhaltiStatus('verifying');
    
    try {
      // Call the API to verify Khalti payment
      const response = await userAPI.verifyKhaltiPayment({
        orderId,
        pidx
      });
      
      if (response.data.success && response.data.data.status === 'Completed') {
        setKhaltiStatus('success');
        if (onSuccess) onSuccess(response.data.data);
      } else {
        setError(response.data.message || 'Payment verification failed');
        setKhaltiStatus('failed');
        if (onFailure) onFailure(response.data.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Error verifying Khalti payment:', err);
      setError('An error occurred while verifying payment');
      setKhaltiStatus('failed');
      if (onFailure) onFailure('An error occurred while verifying payment');
    } finally {
      setLoading(false);
    }
  };

  const retryPayment = () => {
    setKhaltiStatus('initial');
    setError(null);
  };

  // Render different UI based on payment status
  if (khaltiStatus === 'success') {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 text-white bg-green-500 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mb-2 text-xl font-semibold text-green-600">Payment Successful!</h3>
        <p className="mb-4 text-gray-600">
          Your payment of Rs. {amount} was successfully processed via Khalti.
        </p>
      </div>
    );
  }

  if (khaltiStatus === 'verifying') {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 text-white bg-blue-500 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h3 className="mb-2 text-xl font-semibold">Verifying Payment</h3>
        <p className="mb-4 text-gray-600">
          Please wait while we verify your payment with Khalti...
        </p>
      </div>
    );
  }

  if (khaltiStatus === 'failed') {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="mb-4">
          {error || 'Payment failed. Please try again.'}
        </Alert>
        <Button 
          onClick={retryPayment}
          className="w-full"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Initial or payment initiated state
  return (
    <div className="p-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}
      
      <div className="mb-6">
        <h3 className="mb-2 text-lg font-semibold">Pay with Khalti</h3>
        <p className="text-sm text-gray-600">
          Khalti is a digital wallet and online payment gateway in Nepal. Click the button below to pay securely via Khalti.
        </p>
      </div>
      
      <div className="flex items-center justify-between p-4 mb-4 border rounded-md">
        <div>
          <p className="font-medium">Order Total</p>
          <p className="text-lg font-bold">Rs. {amount}</p>
        </div>
        <img 
          src="https://khalti.com/static/images/khalti-logo.svg" 
          alt="Khalti Logo" 
          className="h-8" 
        />
      </div>
      
      <Button
        onClick={initiatePayment}
        disabled={loading}
        className="w-full bg-[#5C2D91] hover:bg-[#4B2577]"
      >
        {loading ? 'Initiating Payment...' : 'Pay with Khalti'}
      </Button>
    </div>
  );
};

// Add prop validation
KhaltiPayment.propTypes = {
  orderId: PropTypes.string.isRequired,
  amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onSuccess: PropTypes.func,
  onFailure: PropTypes.func
};

export default KhaltiPayment; 