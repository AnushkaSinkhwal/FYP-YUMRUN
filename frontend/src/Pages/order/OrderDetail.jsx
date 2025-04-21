import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userAPI } from '../../utils/api';
import { Alert, Spinner, Badge, Card } from '../../components/ui';
import { FaMapMarkerAlt, FaReceipt } from 'react-icons/fa';

// Helper function to format currency (reuse from admin)
const formatCurrency = (amount) => {
  return `$${parseFloat(amount || 0).toFixed(2)}`;
};

// Helper function to format date (reuse from admin)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString(undefined, { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: 'numeric', minute: '2-digit' 
    });
  } catch {
    return 'Invalid Date';
  }
};

// Status badge variant logic (reuse from admin)
const getStatusBadgeVariant = (status) => {
  switch (status) {
    case 'DELIVERED': return 'success';
    case 'PROCESSING': case 'PREPARING': case 'READY': case 'OUT_FOR_DELIVERY': case 'CONFIRMED': return 'info';
    case 'PENDING': return 'warning';
    case 'CANCELLED': return 'danger';
    default: return 'default';
  }
};

const OrderDetail = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log(`OrderDetail: Fetching order ${orderId} using userAPI.getOrder`);
        const response = await userAPI.getOrder(orderId);
        console.log('OrderDetail: API Response:', response);

        if (response.data && response.data.success) {
          // The data is already formatted by the backend route GET /orders/:id
          setOrder(response.data.data);
          console.log('OrderDetail: Order data set:', response.data.data);
        } else {
          throw new Error(response.data?.message || 'Failed to fetch order details');
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError(err.response?.data?.message || err.message || 'Could not load order details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8"><Alert variant="error">{error}</Alert></div>;
  }

  if (!order) {
    return <div className="container mx-auto px-4 py-8 text-center text-gray-500">Order not found.</div>;
  }

  // Safely access nested data
  const restaurantName = order.restaurant?.name || 'Restaurant';
  // deliveryAddress might be string or object
  const addressString = typeof order.deliveryAddress === 'string' 
    ? order.deliveryAddress 
    : order.deliveryAddress 
      ? `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.city || ''}, ${order.deliveryAddress.state || ''}`.replace(/, , /, ', ').trim().replace(/^,|,$/g, '')
      : 'No address specified';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Order Details</h1>
      <p className="text-gray-600 mb-6">Order ID: {order.orderNumber || order._id}</p>

      {/* Order Status & Summary Card */}
      <Card className="mb-6 p-6">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">{restaurantName}</h2>
            <p className="text-sm text-gray-500">Placed on: {formatDate(order.createdAt)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500 mr-2">Status:</span>
            <Badge variant={getStatusBadgeVariant(order.status)} size="lg">{order.status}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap justify-between items-center gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <FaMapMarkerAlt className="mr-2" />
            <span>{addressString}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <FaReceipt className="mr-2" />
            <span>Payment: {order.paymentMethod} ({order.paymentStatus})</span>
          </div>
        </div>
      </Card>

      {/* Order Items Card */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold p-4 border-b">Items Ordered</h2>
        <ul className="divide-y">
          {order.items && order.items.map((item, index) => (
            <li key={item.productId || index} className="flex justify-between items-center p-4">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
      </Card>

      {/* Financial Summary Card */}
      <Card className="mb-6 p-4">
        <h2 className="text-lg font-semibold mb-3">Summary</h2>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span>{formatCurrency(order.totalPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Fee:</span>
            <span>{formatCurrency(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax:</span>
            <span>{formatCurrency(order.tax)}</span>
          </div>
          {order.tip > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Tip:</span>
              <span>{formatCurrency(order.tip)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 mt-2 border-t font-bold text-base">
            <span>Total:</span>
            <span>{formatCurrency(order.grandTotal)}</span>
          </div>
        </div>
      </Card>

      {/* Status History Card */}
      {order.statusUpdates && order.statusUpdates.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold p-4 border-b">Order History</h2>
          <ul className="divide-y">
            {order.statusUpdates.slice().reverse().map((update, index) => (
              <li key={index} className="p-4 text-sm">
                <div className="flex justify-between items-center mb-1">
                  <Badge variant={getStatusBadgeVariant(update.status)} size="sm">{update.status}</Badge>
                  <span className="text-gray-500">{formatDate(update.timestamp)}</span>
                </div>
                {update.updatedBy && (
                  <p className="text-xs text-gray-500">Updated by: {update.updatedBy.name || 'System'}</p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Back to Orders Link */}
      <div className="text-center mt-8">
        <Link to="/profile/orders" className="text-blue-600 hover:underline">
          &larr; Back to My Orders
        </Link>
      </div>
    </div>
  );
};

export default OrderDetail; 