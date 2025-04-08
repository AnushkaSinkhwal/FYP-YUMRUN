import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaClock, FaDollarSign, FaCheck, FaTimes, FaMotorcycle, FaInfoCircle, FaPhoneAlt, FaCheckCircle } from 'react-icons/fa';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Spinner, Alert, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

const DeliveryOrders = () => {
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  
  const { currentUser } = useAuth();

  // Sample orders data - In production, this would come from an API
  const sampleOrders = [
    {
      id: 'ORD001',
      restaurant: 'Pizza Palace',
      customer: 'John Doe',
      items: [
        { name: 'Margherita Pizza', quantity: 1, price: 15.99 },
        { name: 'Coke', quantity: 2, price: 5.00 }
      ],
      totalPrice: 25.99,
      status: 'available',
      createdAt: '2024-03-20T10:30:00',
      pickupAddress: '123 Restaurant St, City',
      deliveryAddress: '456 Customer Ave, City',
      estimatedDistance: '2.5 km',
      estimatedEarnings: 8.00,
      customerPhone: '+1234567890'
    },
    {
      id: 'ORD002',
      restaurant: 'Burger King',
      customer: 'Jane Smith',
      items: [
        { name: 'Whopper', quantity: 2, price: 12.99 },
        { name: 'French Fries', quantity: 1, price: 4.99 }
      ],
      totalPrice: 30.97,
      status: 'active',
      createdAt: '2024-03-20T10:15:00',
      pickupAddress: '789 Burger Ave, City',
      deliveryAddress: '321 Smith St, City',
      estimatedDistance: '3.2 km',
      estimatedEarnings: 9.50,
      customerPhone: '+1234567891'
    },
    {
      id: 'ORD003',
      restaurant: 'Sushi Express',
      customer: 'Mike Johnson',
      items: [
        { name: 'California Roll', quantity: 2, price: 16.99 },
        { name: 'Miso Soup', quantity: 1, price: 3.99 }
      ],
      totalPrice: 37.97,
      status: 'completed',
      createdAt: '2024-03-20T09:30:00',
      pickupAddress: '567 Sushi Lane, City',
      deliveryAddress: '890 Johnson Rd, City',
      estimatedDistance: '1.8 km',
      estimatedEarnings: 7.50,
      customerPhone: '+1234567892'
    }
  ];

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        // In production, this would be API calls:
        // GET /api/delivery/available - for available orders
        // GET /api/delivery/active - for orders assigned to current delivery person
        // GET /api/delivery/history - for completed orders by this delivery person
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setOrders(sampleOrders);
      } catch (err) {
        setError('Failed to fetch orders. Please try again.');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [refreshKey]);

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
    setLoading(true);
    setError(null); // Clear any previous errors
    try {
      // In production, this would be a POST request to /api/delivery/accept/:orderId
      // Example: await deliveryAPI.acceptOrder(orderId);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update order status locally
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'active', assignedTo: currentUser?.id }
            : order
        )
      );
      
      setShowSuccessMessage('Order accepted successfully! You can now pick it up.');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to accept order. Please try again.';
      setError(errorMessage);
      console.error('Error accepting order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    setError(null); // Clear any previous errors
    try {
      // In production, this would be a POST request to /api/delivery/update-status/:orderId with
      // uppercase status for backend compatibility
      
      // Simulate API call, passing the uppercase status that the backend expects
      console.log(`Would send status ${newStatus.toUpperCase()} to backend API`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update order status locally
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
      
      // If we're updating the currently selected order, update that too
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus
        });
      }
      
      setShowSuccessMessage(`Order marked as ${newStatus}!`);
      setTimeout(() => setShowSuccessMessage(''), 3000);
      
      // Close the modal if order is completed
      if (newStatus === 'completed') {
        setShowDetailModal(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || `Failed to update order status to ${newStatus}. Please try again.`;
      setError(errorMessage);
      console.error('Error updating order status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
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
                      {formatDateTime(order.createdAt)}
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>Order #{selectedOrder.id}</span>
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {getStatusIcon(selectedOrder.status)}
                  <span className="ml-1">{selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}</span>
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">Restaurant</h3>
                  <p className="text-gray-800 dark:text-gray-200">{selectedOrder.restaurant}</p>
                  <p className="text-gray-600 dark:text-gray-400">{selectedOrder.pickupAddress}</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">Customer</h3>
                  <p className="text-gray-800 dark:text-gray-200">{selectedOrder.customer}</p>
                  <p className="text-gray-600 dark:text-gray-400">{selectedOrder.deliveryAddress}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-1"
                    onClick={() => window.open(`tel:${selectedOrder.customerPhone}`, '_blank')}
                  >
                    <FaPhoneAlt className="mr-1.5" />
                    Call Customer
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Order Items</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700 last:border-0">
                      <div>
                        <span className="font-medium">{item.quantity}x</span> {item.name}
                      </div>
                      <div className="font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 font-semibold">
                    <div>Total</div>
                    <div>${selectedOrder.totalPrice.toFixed(2)}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Delivery Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Distance:</span> {selectedOrder.estimatedDistance}
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Earnings:</span> ${selectedOrder.estimatedEarnings.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Order Time:</span> {formatDateTime(selectedOrder.createdAt)}
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex justify-end space-x-2">
                {selectedOrder.status === 'active' && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => setShowDetailModal(false)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="brand"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? <Spinner size="sm" className="mr-1.5" /> : <FaCheck className="mr-1.5" />}
                      Mark as Delivered
                    </Button>
                  </>
                )}
                {selectedOrder.status !== 'active' && (
                  <Button 
                    variant="outline"
                    onClick={() => setShowDetailModal(false)}
                  >
                    Close
                  </Button>
                )}
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DeliveryOrders; 