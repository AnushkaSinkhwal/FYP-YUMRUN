import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Legacy PaymentVerify component to maintain backward compatibility
 * Redirects to the new payment verification page
 */
const PaymentVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Extract query parameters
    const searchParams = new URLSearchParams(location.search);
    const pidx = searchParams.get('pidx');
    const orderId = searchParams.get('orderId') || searchParams.get('order_id');
    const method = searchParams.get('method') || 'khalti';
    
    // Construct new URL with parameters
    const newUrl = `/payment/verify?${new URLSearchParams({
      pidx: pidx || '',
      orderId: orderId || '',
      method
    }).toString()}`;
    
    // Redirect to new payment verification page
    navigate(newUrl, { replace: true });
  }, [navigate, location.search]);
  
  // Show loading state while redirecting
  return (
    <div className="p-6 text-center">
      <div className="w-16 h-16 mx-auto mb-4 text-blue-500">
        <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
      <p className="text-gray-600">Please wait while we verify your payment...</p>
    </div>
  );
};

export default PaymentVerify; 