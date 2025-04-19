import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Badge } from '../../components/ui';
import { userAPI } from '../../utils/api';
import { 
  FaArrowLeft, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaClock, 
  FaReceipt, 
  FaUtensils
} from 'react-icons/fa';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching order details for ID:', id);
        const response = await userAPI.getOrder(id);
        console.log('Order response:', response);
        
        if (response.data && response.data.success) {
          // Handle both possible response formats
          const orderData = response.data.data;
          if (orderData) {
            console.log('Setting order data:', orderData);
            setOrder(orderData);
          } else {
            console.error('Order data structure is invalid:', response.data);
            throw new Error('Order data structure is invalid');
          }
        } else {
          console.error('Failed to fetch order details:', response?.data?.message || 'Unknown error');
          throw new Error(response.data?.message || 'Failed to fetch order details');
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Unable to load order details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    const normalizedStatus = status.toUpperCase();
    
    switch (normalizedStatus) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-indigo-100 text-indigo-800';
      case 'OUT_FOR_DELIVERY':
        return 'bg-purple-100 text-purple-800';
      case 'READY':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    if (!status) return '';
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRestaurantName = () => {
    if (order?.restaurantId && typeof order.restaurantId === 'object') {
      return order.restaurantId.restaurantDetails?.name || 'Restaurant';
    }
    return order?.restaurant || 'Restaurant';
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center p-6 mx-auto">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-6 mx-auto">
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
        <Button onClick={() => navigate(-1)} className="mt-4">
          <FaArrowLeft className="mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container p-6 mx-auto">
        <Alert variant="destructive" className="mb-4">
          Order not found.
        </Alert>
        <Button onClick={() => navigate('/user/orders')} className="mt-4">
          <FaArrowLeft className="mr-2" /> View All Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="container p-6 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-4"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
        </div>
        <Badge className={`px-3 py-1 text-sm ${getStatusColor(order.status)}`}>
          {formatStatus(order.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Order summary */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <FaCalendarAlt className="mr-3 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-medium">{formatDate(order.createdAt)}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <FaReceipt className="mr-3 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium">{order.paymentMethod}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <FaUtensils className="mr-3 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Restaurant</p>
                <p className="font-medium">{getRestaurantName()}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <FaMapMarkerAlt className="mr-3 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Delivery Address</p>
                {typeof order.deliveryAddress === "string" ? (
                  <p className="font-medium">{order.deliveryAddress}</p>
                ) : (
                  <p className="font-medium">
                    {order.deliveryAddress.fullAddress || 
                     [
                       order.deliveryAddress.street,
                       order.deliveryAddress.city,
                       order.deliveryAddress.country
                     ].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>

            {order.specialInstructions && (
              <div className="p-3 border rounded-md bg-gray-50">
                <p className="text-sm font-medium text-gray-500">Special Instructions</p>
                <p>{order.specialInstructions}</p>
              </div>
            )}
          </div>
        </Card>
        
        {/* Order items */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Order Items</h2>
          
          <div className="overflow-hidden border rounded-md">
            <div className="grid grid-cols-3 gap-2 p-3 bg-gray-100">
              <div className="text-sm font-medium text-gray-600">Item</div>
              <div className="text-sm font-medium text-center text-gray-600">Qty</div>
              <div className="text-sm font-medium text-right text-gray-600">Price</div>
            </div>
            
            <div className="divide-y">
              {order.items.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 p-3">
                  <div className="text-sm">{item.name}</div>
                  <div className="text-sm text-center">{item.quantity}</div>
                  <div className="text-sm text-right">${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
            
            <div className="p-3 border-t bg-gray-50">
              <div className="grid grid-cols-2 gap-y-2">
                <div className="text-sm text-gray-600">Subtotal:</div>
                <div className="text-sm text-right">${order.totalPrice?.toFixed(2)}</div>
                
                <div className="text-sm text-gray-600">Delivery Fee:</div>
                <div className="text-sm text-right">${order.deliveryFee?.toFixed(2)}</div>
                
                <div className="text-sm text-gray-600">Tax:</div>
                <div className="text-sm text-right">${order.tax?.toFixed(2)}</div>
                
                <div className="text-base font-semibold">Total:</div>
                <div className="text-base font-semibold text-right">${order.grandTotal?.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Status timeline */}
      {order.statusUpdates && order.statusUpdates.length > 0 && (
        <Card className="p-6 mt-6">
          <h2 className="mb-4 text-lg font-semibold">Order Timeline</h2>
          
          <div className="space-y-4">
            {order.statusUpdates.map((update, index) => (
              <div key={index} className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full ${getStatusColor(update.status)}`}>
                    <FaClock className="w-4 h-4" />
                  </div>
                  {index < order.statusUpdates.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-200"></div>
                  )}
                </div>
                <div>
                  <p className="font-medium">{formatStatus(update.status)}</p>
                  <p className="text-sm text-gray-500">{formatDate(update.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => navigate('/user/orders')}>
          <FaArrowLeft className="mr-2" /> Back to Orders
        </Button>
        {/* Only show for active orders */}
        {['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status?.toUpperCase()) && (
          <Button variant="destructive">
            Cancel Order
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrderDetail; 