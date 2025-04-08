import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiCheck, FiShoppingBag, FiHome } from 'react-icons/fi';
import { RiTimerLine, RiMapPinLine } from 'react-icons/ri';
import { 
  Container, 
  Card, 
  Button, 
  Spinner 
} from '../../components/ui';
// import { getPaymentStatus } from '../../utils/payment';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState({
    status: 'confirmed', // Default status
    paymentStatus: 'completed', // Default payment status
    message: '',
  });

  useEffect(() => {
    const checkOrderStatus = async () => {
      setIsLoading(true);
      try {
        // For a real implementation, we would check the order status from the backend
        // const response = await getPaymentStatus(orderId);
        
        // Simulate an API call
        setTimeout(() => {
          setOrderStatus({
            status: 'confirmed',
            paymentStatus: 'completed',
            message: 'Your order has been confirmed and is being processed.',
          });
          setIsLoading(false);
        }, 1500);
      } catch (error) {
        console.error('Failed to fetch order status:', error);
        setOrderStatus({
          status: 'error',
          paymentStatus: 'unknown',
          message: 'Could not retrieve order status.',
        });
        setIsLoading(false);
      }
    };

    checkOrderStatus();
  }, [orderId]);

  const renderStatus = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <Spinner size="lg" className="mb-4" />
          <p className="text-gray-600">Checking your order status...</p>
        </div>
      );
    }

    if (orderStatus.status === 'error') {
      return (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Order Status Unavailable</h2>
          <p className="text-gray-600 mb-6">{orderStatus.message}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link to="/">Return to Home</Link>
            </Button>
            <Button asChild>
              <Link to="/profile/orders">View My Orders</Link>
            </Button>
          </div>
        </Card>
      );
    }

    return (
      <Card className="overflow-hidden">
        <div className="bg-green-50 p-8 text-center border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <FiCheck className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Order Confirmed</h2>
          <p className="text-gray-600">Thank you for your order!</p>
          
          <div className="bg-white rounded-lg p-4 mt-6 inline-block">
            <p className="text-gray-500 text-sm">Order Reference</p>
            <p className="font-mono font-medium">{orderId}</p>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-medium text-lg mb-3">Order Details</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3 mt-1">
                  <FiShoppingBag className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium">Order Status</p>
                  <p className="text-gray-600">{orderStatus.message}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3 mt-1">
                  <RiTimerLine className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium">Estimated Delivery Time</p>
                  <p className="text-gray-600">30-45 minutes</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3 mt-1">
                  <RiMapPinLine className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium">Delivery Address</p>
                  <p className="text-gray-600">Your address will be displayed here</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline">
                <Link to="/" className="flex items-center justify-center">
                  <FiHome className="mr-2" />
                  Return to Home
                </Link>
              </Button>
              <Button asChild>
                <Link to="/profile/orders">View My Orders</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <section className="py-10">
      <Container>
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-center">Order Confirmation</h1>
        </div>
        {renderStatus()}
      </Container>
    </section>
  );
};

export default OrderConfirmation; 