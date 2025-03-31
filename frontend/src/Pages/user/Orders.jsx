import { useState } from 'react';
import { Card, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui';
import { FaSearch, FaFilter, FaStar, FaMapMarkerAlt, FaClock, FaUtensils } from 'react-icons/fa';

const UserOrders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Sample orders data
  const orders = [
    {
      id: 1,
      orderNumber: "ORD-123",
      restaurant: "Burger Palace",
      date: "2024-03-20T10:30:00",
      status: "delivered",
      rating: 5,
      totalAmount: 25.99,
      deliveryAddress: "456 Customer Ave",
      deliveryTime: "25 mins",
      items: [
        { name: "Classic Burger", quantity: 2, price: 10.99 },
        { name: "French Fries", quantity: 1, price: 4.00 }
      ],
      deliveryFee: 2.99,
      subtotal: 23.00,
      tax: 2.00,
      total: 25.99
    },
    {
      id: 2,
      orderNumber: "ORD-124",
      restaurant: "Pizza Express",
      date: "2024-03-20T09:15:00",
      status: "preparing",
      rating: null,
      totalAmount: 32.99,
      deliveryAddress: "321 Customer St",
      deliveryTime: "30 mins",
      items: [
        { name: "Margherita Pizza", quantity: 1, price: 24.99 },
        { name: "Coke", quantity: 2, price: 2.50 }
      ],
      deliveryFee: 2.99,
      subtotal: 29.99,
      tax: 2.00,
      total: 32.99
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300';
      case 'preparing':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.restaurant.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date) - new Date(a.date);
      case 'amount':
        return b.totalAmount - a.totalAmount;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Button variant="outline" className="gap-2">
          <FaFilter className="h-4 w-4" />
          Export Orders
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by order number or restaurant..."
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
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="amount">Amount</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {sortedOrders.map(order => (
          <Card key={order.id} className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                  <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {order.restaurant}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {order.rating && (
                  <div className="flex items-center gap-1">
                    <FaStar className="h-4 w-4 text-yellow-400" />
                    <span>{order.rating}</span>
                  </div>
                )}
                <div className="text-right">
                  <p className="font-semibold">${order.totalAmount.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(order.date).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <FaMapMarkerAlt className="h-4 w-4" />
                  <span>Delivery: {order.deliveryAddress}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <FaClock className="h-4 w-4" />
                  <span>Estimated: {order.deliveryTime}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <FaUtensils className="h-4 w-4" />
                  <span>Items: {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>${order.deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {order.status === 'delivered' && !order.rating && (
              <div className="mt-4 flex justify-end">
                <Button>Rate Order</Button>
              </div>
            )}
          </Card>
        ))}

        {sortedOrders.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No orders found
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserOrders; 