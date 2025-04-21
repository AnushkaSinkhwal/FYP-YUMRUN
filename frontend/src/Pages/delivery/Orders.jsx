import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaClock, FaDollarSign, FaCheck, FaTimes, FaMotorcycle, FaInfoCircle, FaPhoneAlt, FaCheckCircle } from 'react-icons/fa';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Spinner, Alert, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui';
import { deliveryAPI } from '../../utils/api'; // Import deliveryAPI

// Reusable helper functions (consider moving to a utils file)
const formatCurrency = (amount) => `$${parseFloat(amount || 0).toFixed(2)}`;
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString(undefined, { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: 'numeric', minute: '2-digit' 
    });
  } catch { return 'Invalid Date'; }
};
const getStatusBadgeVariant = (status) => {
  if (!status) return 'default';
  const upperStatus = status.toUpperCase();
  switch (upperStatus) {
    case 'DELIVERED': return 'success';
    case 'PROCESSING': case 'PREPARING': case 'READY': case 'OUT_FOR_DELIVERY': case 'CONFIRMED': return 'info';
    case 'PENDING': return 'warning';
    case 'CANCELLED': return 'danger';
    default: return 'default';
  }
};

const DeliveryOrders = () => {
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(true); // Start loading initially
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  
  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      setOrders([]); // Clear previous orders
      try {
        let response;
        if (activeTab === 'available') {
          response = await deliveryAPI.getAvailableOrders();
          setOrders(response.data?.orders || []);
        } else if (activeTab === 'active') {
          response = await deliveryAPI.getActiveDeliveries();
          // Backend now returns { success: true, deliveries: [...] }
          setOrders(response.data?.deliveries || []); 
        } else if (activeTab === 'completed') {
          response = await deliveryAPI.getDeliveryHistory();
          // Backend returns { success: true, deliveries: [...] }
          setOrders(response.data?.deliveries || []);
        }
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to fetch orders.';
        setError(message);
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [activeTab, refreshKey]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <FaMotorcycle className="w-4 h-4" />;
      case 'active':
        return <FaClock className="w-4 h-4" />;
      case 'completed':
        return <FaCheck className="w-4 h-4" />;
      default:
        return <FaTimes className="w-4 h-4" />;
    }
  };

  const filterOrders = (status) => {
    return orders.filter(order => order.status === status);
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleAcceptOrder = async (orderId) => {
    setLoading(true); // Use main loading state for accepting
    setError(null);
    try {
      // Call the actual API endpoint
      console.log(`Calling deliveryAPI.acceptOrder for order: ${orderId}`);
      const response = await deliveryAPI.acceptOrder(orderId);
      console.log('Accept Order API response:', response.data);

      if (response.data && response.data.success) {
         // Refresh the orders list to reflect the change from available to active
        setRefreshKey(prev => prev + 1); 
        setShowSuccessMessage('Order accepted successfully! Check your Active Orders tab.');
        setTimeout(() => setShowSuccessMessage(''), 4000);
        // Optionally switch tab to active after a short delay
        // setTimeout(() => setActiveTab('active'), 500); 
      } else {
        throw new Error(response.data?.message || 'Failed to accept the order.');
      }

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to accept order. Please try again.';
      setError(errorMessage);
      console.error('Error accepting order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    setError(null);
    try {
      // Call the actual API endpoint
      const upperCaseStatus = newStatus.toUpperCase(); // Ensure status matches backend enum
      console.log(`Calling deliveryAPI.updateOrderStatus for order ${orderId} with status ${upperCaseStatus}`);
      const response = await deliveryAPI.updateOrderStatus(orderId, upperCaseStatus);
      console.log('Update Status API response:', response.data);

      if (response.data && response.data.success) {
         // Refresh the orders list
        setRefreshKey(prev => prev + 1);
        setShowSuccessMessage(`Order status updated to ${upperCaseStatus}!`);
        setTimeout(() => setShowSuccessMessage(''), 3000);

        // Close the modal if order is completed or cancelled
        if (upperCaseStatus === 'DELIVERED' || upperCaseStatus === 'CANCELLED') {
          setShowDetailModal(false);
        }
      } else {
         throw new Error(response.data?.message || 'Failed to update order status.');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || `Failed to update order status to ${newStatus}. Please try again.`;
      setError(errorMessage);
      console.error('Error updating order status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Orders</h1>
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {showSuccessMessage && (
        <Alert variant="success" onClose={() => setShowSuccessMessage('')}>
          {showSuccessMessage}
        </Alert>
      )}

      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        {['available', 'active', 'completed'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab
                ? 'text-yumrun-primary border-b-2 border-yumrun-primary'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} Orders
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800">
              {filterOrders(tab).length}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filterOrders(activeTab).length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {activeTab === 'available' ? (
              <>
                <FaMotorcycle className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                <p>No available orders at the moment</p>
                <p className="text-sm mt-1">Check back soon or refresh to see new orders</p>
              </>
            ) : activeTab === 'active' ? (
              <>
                <FaClock className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                <p>No active deliveries</p>
                <p className="text-sm mt-1">Accept available orders to start delivering</p>
              </>
            ) : (
              <>
                <FaCheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                <p>No completed deliveries yet</p>
                <p className="text-sm mt-1">Completed deliveries will appear here</p>
              </>
            )}
          </div>
        ) : (
          filterOrders(activeTab).map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
                <div>
                  <CardTitle className="text-lg font-semibold">{order.restaurant}</CardTitle>
                  <p className="text-sm text-gray-500">Order #{order.id}</p>
                </div>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                </Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <FaMapMarkerAlt className="w-4 h-4 mr-1" />
                        <span>{order.estimatedDistance}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <FaDollarSign className="w-4 h-4 mr-1" />
                        <span>${order.estimatedEarnings.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Pickup</div>
                      <div className="text-sm text-gray-500">{order.pickupAddress}</div>
                    </div>
                    <div className="space-y-1 md:text-right">
                      <div className="text-sm font-medium">Delivery</div>
                      <div className="text-sm text-gray-500">{order.deliveryAddress}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrderDetails(order)}
                      className="text-gray-700 dark:text-gray-300"
                    >
                      <FaInfoCircle className="mr-1.5" />
                      View Details
                    </Button>
                    
                    {order.status === 'available' && (
                      <Button
                        variant="brand"
                        size="sm"
                        onClick={() => handleAcceptOrder(order.id)}
                        disabled={loading}
                      >
                        {loading ? <Spinner size="sm" className="mr-1.5" /> : <FaMotorcycle className="mr-1.5" />}
                        Accept Delivery
                      </Button>
                    )}
                    
                    {order.status === 'active' && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        disabled={updatingStatus}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {updatingStatus ? <Spinner size="sm" className="mr-1.5" /> : <FaCheck className="mr-1.5" />}
                        Mark Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Order Details Modal */}
      {showDetailModal && selectedOrder && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details: {selectedOrder.orderNumber || selectedOrder._id || selectedOrder.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Restaurant</p>
                  <p>{selectedOrder.restaurantId?.name || 'N/A'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {selectedOrder.restaurantId?.address?.street || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer</p>
                  <p>{selectedOrder.userId?.fullName || 'N/A'}</p>
                  {selectedOrder.userId?.phone && (
                     <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
                        <FaPhoneAlt className="mr-1 h-3 w-3"/> {selectedOrder.userId.phone}
                     </p>
                   )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Delivery Address</p>
                  <p>{selectedOrder.deliveryAddress?.street || 'N/A'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {selectedOrder.deliveryAddress?.city || ''}, {selectedOrder.deliveryAddress?.state || ''}
                  </p>
                </div>
                 <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Placed</p>
                  <p>{formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Items</p>
                <ul className="text-sm border rounded-md divide-y dark:border-gray-700 dark:divide-gray-700">
                  {selectedOrder.items?.map((item, index) => (
                    <li key={index} className="px-3 py-2 flex justify-between">
                      <span>{item.quantity} x {item.name}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </li>
                  ))}
                  <li className="px-3 py-2 flex justify-between font-semibold bg-gray-50 dark:bg-gray-700/50">
                    <span>Total Price</span>
                    <span>{formatCurrency(selectedOrder.totalPrice)}</span>
                  </li>
                </ul>
              </div>

              {/* Status History */} 
              {selectedOrder.statusUpdates && selectedOrder.statusUpdates.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Order History</h4>
                  <ul className="space-y-2 border rounded-md p-3 dark:border-gray-700">
                    {selectedOrder.statusUpdates.slice().reverse().map((update, index) => (
                      <li key={index} className="flex items-center justify-between text-xs">
                        <Badge variant={getStatusBadgeVariant(update.status)} size="sm">{update.status}</Badge>
                        <span className="text-gray-400 dark:text-gray-500">{formatDate(update.timestamp)}</span>
                        {update.updatedBy && (
                          <span className="text-gray-400 dark:text-gray-500">by {update.updatedBy.name || 'System'}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Rider Actions - Conditionally Rendered */}
              {(selectedOrder.status === 'READY' || selectedOrder.status === 'PREPARING' || selectedOrder.status === 'CONFIRMED') && (
                <div className="pt-4 border-t dark:border-gray-700">
                  <Button
                    variant="secondary" // Or appropriate variant
                    className="w-full"
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'OUT_FOR_DELIVERY')} // Use _id for consistency
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? <Spinner size="sm" className="mr-1.5" /> : <FaMotorcycle className="mr-1.5" />}
                    Mark Picked Up (Out for Delivery)
                  </Button>
                </div>
              )}
              {selectedOrder.status === 'OUT_FOR_DELIVERY' && (
                 <div className="pt-4 border-t dark:border-gray-700">
                   <Button
                    variant="success" // Green button for final step
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'DELIVERED')}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? <Spinner size="sm" className="mr-1.5" /> : <FaCheck className="mr-1.5" />}
                    Mark as Delivered
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DeliveryOrders; 