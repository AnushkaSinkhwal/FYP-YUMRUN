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
import api from '../../utils/api';
import { useCart } from '../../context/CartContext';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const { clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [orderStatus, setOrderStatus] = useState({
    status: 'confirmed', // Default status
    paymentStatus: 'completed', // Default payment status
    message: '',
  });

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      try {
        if (!orderId) {
          throw new Error('Order ID not provided');
        }
        
        // Fetch order details from API
        const response = await api.get(`/orders/${orderId}`);
        
        if (response.data && response.data.success) {
          // Handle both possible response formats
          const orderData = response.data.order || response.data.data;
          if (orderData) {
            setOrderData(orderData);
            
            // Set order status based on data
            setOrderStatus({
              status: orderData.status.toLowerCase(),
              paymentStatus: orderData.paymentStatus.toLowerCase(),
              message: `Your order has been ${orderData.status.toLowerCase()} and is being processed.`,
            });
          } else {
            throw new Error('Order data structure is invalid');
          }
        } else {
          throw new Error(response.data?.message || 'Failed to fetch order details');
        }
      } catch (error) {
        console.error('Failed to fetch order details:', error);
        // Fallback to basic confirmation if we can't fetch the details
        setOrderStatus({
          status: 'confirmed',
          paymentStatus: 'completed',
          message: 'Your order has been confirmed and is being processed.',
        });
      } finally {
        setIsLoading(false);
        clearCart();
      }
    };

    fetchOrderDetails();
  }, [orderId, clearCart]);

  const renderStatus = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <Spinner size="lg" className="mb-4" />
          <p className="text-gray-600">Loading your order details...</p>
        </div>
      );
    }

    if (!orderId) {
      return (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Invalid Order</h2>
          <p className="text-gray-600 mb-6">No order ID was provided. Please return to your orders page.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link to="/">Return to Home</Link>
            </Button>
            <Button asChild>
              <Link to="/user/orders">View My Orders</Link>
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
            <p className="font-mono font-medium">{orderData?.orderNumber || orderId}</p>
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
              
              {orderData?.items && (
                <div className="border-t border-b border-gray-100 py-3">
                  <p className="font-medium mb-2">Items</p>
                  {orderData.items.map((item, index) => (
                    <div key={index} className="flex justify-between py-1 text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>Rs. {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between font-medium">
                    <span>Total</span>
                    <span>Rs. {orderData.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}
              
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
                  <p className="text-gray-600">
                    {orderData?.deliveryAddress?.street || "Your delivery address"}
                    {orderData?.deliveryAddress?.city && `, ${orderData.deliveryAddress.city}`}
                  </p>
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
                <Link to="/user/orders">View My Orders</Link>
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