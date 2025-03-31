import { useState } from 'react';
import { FaMapMarkerAlt, FaClock, FaDollarSign, FaCheck, FaTimes } from 'react-icons/fa';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Spinner } from '../../components/ui';

const DeliveryOrders = () => {
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(false);

  // Sample orders data
  const orders = [
    {
      id: 'ORD001',
      restaurant: 'Pizza Palace',
      customer: 'John Doe',
      items: [
        { name: 'Margherita Pizza', quantity: 1 },
        { name: 'Coke', quantity: 2 }
      ],
      totalPrice: 25.99,
      status: 'available',
      createdAt: '2024-03-20T10:30:00',
      pickupAddress: '123 Restaurant St, City',
      deliveryAddress: '456 Customer Ave, City',
      estimatedDistance: '2.5 km',
      estimatedEarnings: 8.00
    },
    // ... other orders
  ];

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
        return <FaCheck className="w-4 h-4" />;
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
      // TODO: Implement order acceptance logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Order accepted:', orderId);
    } catch (error) {
      console.error('Error accepting order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async (orderId) => {
    setLoading(true);
    try {
      // TODO: Implement mark as delivered logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Order marked as delivered:', orderId);
    } catch (error) {
      console.error('Error marking order as delivered:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Orders</h1>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>

      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'available'
              ? 'text-yumrun-primary border-b-2 border-yumrun-primary'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('available')}
        >
          Available Orders
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'active'
              ? 'text-yumrun-primary border-b-2 border-yumrun-primary'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('active')}
        >
          Active Deliveries
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'completed'
              ? 'text-yumrun-primary border-b-2 border-yumrun-primary'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('completed')}
        >
          Completed
        </button>
      </div>

      <div className="space-y-4">
        {filterOrders(activeTab).map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">{order.restaurant}</CardTitle>
              <Badge className={getStatusColor(order.status)}>
                {getStatusIcon(order.status)}
                <span className="ml-1">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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

                <div className="space-y-2">
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
                        <span>${(item.quantity * (order.totalPrice / order.items.length)).toFixed(2)}</span>
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
        ))}
      </div>
    </div>
  );
};

export default DeliveryOrders; 