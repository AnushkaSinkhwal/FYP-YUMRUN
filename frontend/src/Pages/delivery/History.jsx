import { useState, useEffect } from 'react';
import { Card, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Spinner } from '../../components/ui';
import { FaSearch, FaFilter, FaStar, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { deliveryAPI } from '../../utils/api';

const DeliveryHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch delivery history
  useEffect(() => {
    const fetchDeliveryHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await deliveryAPI.getDeliveryHistory();
        
        if (response.data && response.data.success) {
          console.log('Delivery history:', response.data);
          const formattedDeliveries = response.data.deliveries.map(delivery => ({
            id: delivery._id,
            orderNumber: delivery.orderNumber || delivery._id.toString().substring(0, 6),
            restaurant: delivery.restaurantId?.name || 'Unknown Restaurant',
            customer: delivery.userId?.fullName || 'Customer',
            date: delivery.createdAt || new Date().toISOString(),
            status: delivery.status.toLowerCase(),
            rating: delivery.rating || 0,
            earnings: delivery.deliveryFee || 5.00,
            distance: delivery.distance || '3 km',
            duration: delivery.deliveryDuration || '30 mins',
            pickupAddress: delivery.restaurantId?.address || 'Restaurant Address',
            deliveryAddress: delivery.deliveryAddress || 'Delivery Address',
            items: delivery.items.map(item => ({
              name: item.itemName || 'Food item',
              quantity: item.quantity || 1
            })),
            totalAmount: delivery.totalAmount || 0
          }));
          
          setDeliveries(formattedDeliveries);
        } else {
          setError('Failed to fetch delivery history');
        }
      } catch (err) {
        console.error('Error fetching delivery history:', err);
        setError('Failed to load delivery history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryHistory();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300';
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = 
      delivery.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.restaurant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.customer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || delivery.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const sortedDeliveries = [...filteredDeliveries].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date) - new Date(a.date);
      case 'earnings':
        return b.earnings - a.earnings;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Delivery History</h1>
        <Button variant="outline" className="gap-2">
          <FaFilter className="h-4 w-4" />
          Export History
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by order number, restaurant, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="earnings">Earnings</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[40vh]">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center text-red-500">
          <p>{error}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedDeliveries.length > 0 ? (
            sortedDeliveries.map(delivery => (
              <Card key={delivery.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Order #{delivery.orderNumber}</h3>
                      <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(delivery.status)}`}>
                        {delivery.status}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {delivery.restaurant} • {delivery.customer}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <FaStar className="h-4 w-4 text-yellow-400" />
                      <span>{delivery.rating}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${delivery.earnings.toFixed(2)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(delivery.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <FaMapMarkerAlt className="h-4 w-4" />
                      <span>Pickup: {delivery.pickupAddress}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <FaMapMarkerAlt className="h-4 w-4" />
                      <span>Delivery: {delivery.deliveryAddress}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <FaClock className="h-4 w-4" />
                      <span>{delivery.distance} • {delivery.duration}</span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-300">
                      Items: {delivery.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No delivery history found
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryHistory; 