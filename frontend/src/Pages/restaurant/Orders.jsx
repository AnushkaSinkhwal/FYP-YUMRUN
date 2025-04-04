import { useState, useEffect } from 'react';
import { restaurantAPI } from '../../utils/api';
import { 
  Card, 
  CardHeader,
  CardContent,
  CardFooter,
  Button, 
  Badge, 
  Alert, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  Separator 
} from '../../components/ui';
import { FaEye, FaCheckCircle, FaTimesCircle, FaTruck, FaHourglassHalf, FaCalendarAlt, FaUser, FaDollarSign } from 'react-icons/fa';
import { format } from 'date-fns';

const ORDER_STATUS = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED'
];

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-indigo-100 text-indigo-800',
  READY: 'bg-purple-100 text-purple-800',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

const STATUS_ICONS = {
  PENDING: <FaHourglassHalf className="inline mr-1" />,
  CONFIRMED: <FaCheckCircle className="inline mr-1" />,
  PREPARING: <FaHourglassHalf className="inline mr-1" />,
  READY: <FaCheckCircle className="inline mr-1" />,
  OUT_FOR_DELIVERY: <FaTruck className="inline mr-1" />,
  DELIVERED: <FaCheckCircle className="inline mr-1 text-green-500" />,
  CANCELLED: <FaTimesCircle className="inline mr-1 text-red-500" />
};

const RestaurantOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await restaurantAPI.getOrders();
      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openDetailsDialog = (order) => {
    setSelectedOrder(order);
    setIsDetailsDialogOpen(true);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setIsUpdatingStatus(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await restaurantAPI.updateOrderStatus(orderId, newStatus);
      if (response.data.success) {
        setSuccess('Order status updated successfully!');
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId ? { ...order, status: newStatus, statusUpdates: [...order.statusUpdates, { status: newStatus, timestamp: new Date() }] } : order
          )
        );
      } else {
        setError(response.data.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err.response?.data?.message || 'Failed to update order status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getNextStatus = (currentStatus) => {
    const currentIndex = ORDER_STATUS.indexOf(currentStatus);
    // Define the flow: PENDING -> CONFIRMED -> PREPARING -> READY -> OUT_FOR_DELIVERY -> DELIVERED
    const flow = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    if (currentIndex >= 0 && currentIndex < flow.length - 1) {
      return flow[currentIndex + 1];
    }
    return null; // No next status if already DELIVERED or CANCELLED
  };

  const renderActionButton = (order) => {
    const nextStatus = getNextStatus(order.status);
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return <Badge className={`${STATUS_COLORS[order.status]} px-2 py-1`}>{STATUS_ICONS[order.status]}{order.status}</Badge>;
    }
    
    if (nextStatus) {
        return (
            <Button 
                size="sm" 
                onClick={() => handleStatusUpdate(order._id, nextStatus)}
                disabled={isUpdatingStatus}
            >
                {isUpdatingStatus ? 'Updating...' : `Mark as ${nextStatus}`}
            </Button>
        );
    }

    // Fallback for unexpected cases or if logic needs adjustment
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-yumrun-orange"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800 dark:text-gray-100">Order Management</h1>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-4" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {orders.length === 0 ? (
        <div className="p-6 text-center border rounded-md">
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <Card key={order._id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div>
                  <h3 className="font-semibold">{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">{format(new Date(order.createdAt), 'PPP p')}</p>
                </div>
                <Badge className={`${STATUS_COLORS[order.status]} px-2 py-1`}>
                  {STATUS_ICONS[order.status]}{order.status}
                </Badge>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <FaUser className="mr-2 text-gray-400" /> 
                    <span>{order.userId?.fullName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <FaDollarSign className="mr-2 text-gray-400" /> 
                    <span>${order.grandTotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-2 text-gray-400" /> 
                    <span>{order.items?.length || 0} items</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openDetailsDialog(order)}
                >
                  <FaEye className="mr-1" /> Details
                </Button>
                {renderActionButton(order)}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Detailed view of the order.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-1 font-semibold">Customer Information</h4>
                  <p><strong>Name:</strong> {selectedOrder.userId?.fullName || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedOrder.userId?.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedOrder.userId?.phone || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold">Delivery Address</h4>
                  <p>{selectedOrder.deliveryAddress?.street}</p>
                  <p>{selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} {selectedOrder.deliveryAddress?.zipCode}</p>
                  <p>{selectedOrder.deliveryAddress?.country}</p>
                </div>
              </div>
              
              <div>
                <h4 className="mb-2 font-semibold">Order Items</h4>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <div className="min-w-full">
                        <div className="grid grid-cols-4 gap-4 p-3 font-semibold text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300">
                          <div>Item</div>
                          <div className="text-center">Quantity</div>
                          <div className="text-center">Price</div>
                          <div className="text-right">Subtotal</div>
                        </div>
                        <Separator />
                        {selectedOrder.items.map((item, index) => (
                          <div key={index} className="grid grid-cols-4 gap-4 p-3 text-sm border-b last:border-0">
                            <div>{item.name}</div>
                            <div className="text-center">{item.quantity}</div>
                            <div className="text-center">${item.price?.toFixed(2) || '0.00'}</div>
                            <div className="text-right">${(item.price * item.quantity)?.toFixed(2) || '0.00'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                 <div>
                    <h4 className="mb-1 font-semibold">Payment Details</h4>
                    <p><strong>Method:</strong> {selectedOrder.paymentMethod}</p>
                    <p><strong>Status:</strong> {selectedOrder.paymentStatus}</p>
                    <p><strong>Subtotal:</strong> ${selectedOrder.totalPrice?.toFixed(2) || '0.00'}</p>
                    <p><strong>Delivery Fee:</strong> ${selectedOrder.deliveryFee?.toFixed(2) || '0.00'}</p>
                    <p><strong>Tax:</strong> ${selectedOrder.tax?.toFixed(2) || '0.00'}</p>
                    <p><strong>Tip:</strong> ${selectedOrder.tip?.toFixed(2) || '0.00'}</p>
                    <p className="font-bold"><strong>Grand Total:</strong> ${selectedOrder.grandTotal?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                    <h4 className="mb-1 font-semibold">Status History</h4>
                    <ul className="space-y-1 text-sm">
                      {(selectedOrder.statusUpdates || []).map((update, index) => (
                        <li key={index}>
                          <Badge className={`${STATUS_COLORS[update.status]} mr-2`}>{update.status}</Badge> 
                          {format(new Date(update.timestamp), 'Pp')}
                        </li>
                      ))}
                    </ul>
                </div>
              </div>
              {selectedOrder.specialInstructions && (
                 <div>
                    <h4 className="mb-1 font-semibold">Special Instructions</h4>
                    <p className="p-2 border rounded bg-gray-50 dark:bg-gray-800">{selectedOrder.specialInstructions}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantOrders; 