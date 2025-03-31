import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaClock, FaDollarSign, FaCheck, FaTimes, FaMotorcycle } from 'react-icons/fa';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Spinner, Alert } from '../../components/ui';

const DeliveryOrders = () => {
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
        // In production, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        setOrders(sampleOrders);
      } catch (err) {
        setError('Failed to fetch orders. Please try again.');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [refreshKey]); // Refetch when refreshKey changes

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

  const handleAcceptOrder = async (orderId) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update order status locally
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'active' }
            : order
        )
      );
      
      // Show success message or notification here
    } catch (error) {
      setError('Failed to accept order. Please try again.');
      console.error('Error accepting order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async (orderId) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update order status locally
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'completed' }
            : order
        )
      );
      
      // Show success message or notification here
    } catch (error) {
      setError('Failed to mark order as delivered. Please try again.');
      console.error('Error marking order as delivered:', error);
    } finally {
      setLoading(false);
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
            No {activeTab} orders found
          </div>
        ) : (
          filterOrders(activeTab).map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-semibold">{order.restaurant}</CardTitle>
                  <p className="text-sm text-gray-500">Order #{order.id}</p>
                </div>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                </Badge>
              </CardHeader>
              <CardContent>
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

                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Customer:</span> {order.customer}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Phone:</span> {order.customerPhone}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Pickup:</span> {order.pickupAddress}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Delivery:</span> {order.deliveryAddress}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Order Details</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{item.quantity}x {item.name}</span>
                          <span>${(item.quantity * item.price).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>${order.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    {order.status === 'available' && (
                      <Button
                        onClick={() => handleAcceptOrder(order.id)}
                        disabled={loading}
                        className="w-full sm:w-auto"
                      >
                        {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
                        Accept Order
                      </Button>
                    )}
                    {order.status === 'active' && (
                      <Button
                        onClick={() => handleMarkDelivered(order.id)}
                        disabled={loading}
                        className="w-full sm:w-auto"
                      >
                        {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
                        Mark as Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryOrders; 