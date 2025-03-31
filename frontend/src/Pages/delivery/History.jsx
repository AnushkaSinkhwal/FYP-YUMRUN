import { useState } from 'react';
import { Card, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui';
import { FaSearch, FaFilter, FaStar, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

const DeliveryHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Sample history data
  const deliveries = [
    {
      id: 1,
      orderNumber: "ORD-123",
      restaurant: "Burger Palace",
      customer: "John Doe",
      date: "2024-03-20T10:30:00",
      status: "completed",
      rating: 5,
      earnings: 8.50,
      distance: "2.5 km",
      duration: "25 mins",
      pickupAddress: "123 Restaurant St",
      deliveryAddress: "456 Customer Ave",
      items: [
        { name: "Classic Burger", quantity: 2 },
        { name: "French Fries", quantity: 1 }
      ],
      totalAmount: 25.99
    },
    {
      id: 2,
      orderNumber: "ORD-124",
      restaurant: "Pizza Express",
      customer: "Jane Smith",
      date: "2024-03-20T09:15:00",
      status: "completed",
      rating: 4,
      earnings: 10.00,
      distance: "3.2 km",
      duration: "30 mins",
      pickupAddress: "789 Restaurant Ave",
      deliveryAddress: "321 Customer St",
      items: [
        { name: "Margherita Pizza", quantity: 1 },
        { name: "Coke", quantity: 2 }
      ],
      totalAmount: 32.99
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
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
            <SelectItem value="completed">Completed</SelectItem>
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

      <div className="space-y-4">
        {sortedDeliveries.map(delivery => (
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
        ))}

        {sortedDeliveries.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No delivery history found
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DeliveryHistory; 