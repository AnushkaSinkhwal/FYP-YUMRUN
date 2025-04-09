import { useState, useEffect } from 'react';
import { Card, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Spinner, Alert, Badge } from '../../components/ui';
import { FaSearch, FaFilter, FaStar, FaMapMarkerAlt, FaClock, FaUtensils, FaReceipt, FaExternalLinkAlt, FaShoppingBag, FaSync } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const UserOrders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tempRatings, setTempRatings] = useState({});
  const [ratingInProgress, setRatingInProgress] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching orders...');
      const response = await api.get('/orders/user');
      console.log('Orders response:', response);
      
      if (response.data && response.data.success) {
        if (Array.isArray(response.data.data)) {
          setOrders(response.data.data);
          console.log('Orders set:', response.data.data);
        } else {
          console.error('Invalid data format, expected array:', response.data);
          setOrders([]);
          setError('Error loading orders: Invalid data format');
        }
      } else {
        throw new Error(response.data?.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      
      // Show more specific error message based on error type
      if (err.response && err.response.status === 500) {
        setError('Server error occurred. The team has been notified and is working on it.');
        console.error('Server error details:', err.response.data);
      } else if (err.message.includes('Network Error')) {
        setError('Network connection issue. Please check your internet connection.');
      } else {
        setError('Failed to load orders. Please try again later.');
      }
      
      // Set empty orders array to prevent showing stale data
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const setTempRating = (orderId, rating) => {
    setTempRatings(prev => ({
      ...prev,
      [orderId]: rating
    }));
  };

  // Function to submit rating for an order
  const submitRating = async (orderId, rating) => {
    if (!rating) {
      rating = tempRatings[orderId] || 5;
    }
    
    try {
      setRatingInProgress(orderId);
      
      const response = await api.post('/reviews', {
        orderId,
        rating,
        comment: ''
      });

      if (response.data && response.data.success) {
        // Update local state to reflect the new rating
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId || order._id === orderId
              ? { ...order, rating, isRated: true } 
              : order
          )
        );
        
        // Clear temp rating
        setTempRatings(prev => {
          const newState = { ...prev };
          delete newState[orderId];
          return newState;
        });
      } else {
        throw new Error(response.data?.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError('Failed to submit rating. Please try again.');
    } finally {
      setRatingInProgress(null);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300';
    
    const normalizedStatus = status.toUpperCase();
    
    switch (normalizedStatus) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800/30 dark:text-yellow-300';
      case 'CONFIRMED':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-800/30 dark:text-indigo-300';
      case 'OUT_FOR_DELIVERY':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-300';
      case 'READY':
        return 'bg-teal-100 text-teal-700 dark:bg-teal-800/30 dark:text-teal-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300';
    }
  };

  const formatStatus = (status) => {
    if (!status) return '';
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return dateString;
    }
  };

  const getRestaurantName = (order) => {
    if (order.restaurantId && typeof order.restaurantId === 'object') {
      return order.restaurantId.name || order.restaurantId.restaurantDetails?.name || 'Restaurant';
    }
    return order.restaurant || 'Restaurant';
  };

  const getId = (order) => {
    return order.id || order._id;
  };

  const filteredOrders = orders.filter(order => {
    if (!order) return false;
    
    // Handle search
    const orderNumber = order.orderNumber || '';
    const restaurant = getRestaurantName(order);
    
    const matchesSearch = 
      orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Handle status filter
    let orderStatus = order.status || '';
    if (typeof orderStatus === 'string') {
      orderStatus = orderStatus.toLowerCase();
    }
    
    const matchesStatus = filterStatus === 'all' || orderStatus === filterStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = a.createdAt || a.date || 0;
    const dateB = b.createdAt || b.date || 0;
    
    switch (sortBy) {
      case 'date':
        return new Date(dateB) - new Date(dateA);
      case 'amount':
        return (b.grandTotal || b.totalAmount || 0) - (a.grandTotal || a.totalAmount || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return new Date(dateB) - new Date(dateA);
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-gray-500">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Button variant="outline" className="gap-2">
          <FaFilter className="w-4 h-4" />
          Export Orders
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="out_for_delivery">Out For Delivery</SelectItem>
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
        {sortedOrders.length > 0 ? (
          sortedOrders.map(order => {
            if (!order) return null;
            
            const orderId = getId(order);
            const isDelivered = order.status === 'DELIVERED' || order.status === 'delivered';
            const canRate = isDelivered && !order.rating && !order.isRated;
            
            return (
              <Card key={orderId} className="p-6 transition-shadow duration-200 hover:shadow-md">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                      <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {getRestaurantName(order)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {order.rating && (
                      <div className="flex items-center gap-1">
                        <FaStar className="w-4 h-4 text-yellow-400" />
                        <span>{order.rating}</span>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="font-semibold">${(order.grandTotal || order.totalAmount || 0).toFixed(2)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(order.createdAt || order.date)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <FaMapMarkerAlt className="flex-shrink-0 w-4 h-4" />
                      <span className="truncate">Delivery: {order.deliveryAddress?.street || order.deliveryAddress || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <FaClock className="flex-shrink-0 w-4 h-4" />
                      <span>Ordered: {formatDate(order.createdAt || order.date)}</span>
                    </div>
                    {order.estimatedDeliveryTime && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <FaClock className="flex-shrink-0 w-4 h-4" />
                        <span>Estimated delivery: {formatDate(order.estimatedDeliveryTime)}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                      <FaUtensils className="flex-shrink-0 w-4 h-4 mt-1" />
                      <span className="line-clamp-2">
                        Items: {order.items?.map(item => 
                          `${item.quantity}x ${item.name || item.productName || 'Item'}`
                        ).join(', ')}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>${(order.totalPrice || order.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>${(order.deliveryFee || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>${(order.tax || 0).toFixed(2)}</span>
                      </div>
                      {order.tip > 0 && (
                        <div className="flex justify-between">
                          <span>Tip</span>
                          <span>${(order.tip || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 font-semibold border-t">
                        <span>Total</span>
                        <span>${(order.grandTotal || order.total || order.totalAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 mt-4">
                  <Link to={`/order/${orderId}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <FaReceipt className="w-4 h-4" />
                      Details
                    </Button>
                  </Link>
                  
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-1">
                        <FaExternalLinkAlt className="w-4 h-4" />
                        Track
                      </Button>
                    </a>
                  )}
                  
                  {canRate && (
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Button 
                            key={star} 
                            variant="ghost" 
                            size="sm"
                            className="p-1"
                            onClick={() => setTempRating(orderId, star)}
                          >
                            <FaStar className={`h-5 w-5 ${star <= (tempRatings[orderId] || 0) ? 'text-yellow-400' : 'text-gray-300'}`} />
                          </Button>
                        ))}
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => submitRating(orderId)}
                        disabled={ratingInProgress === orderId || !tempRatings[orderId]}
                      >
                        {ratingInProgress === orderId ? <Spinner size="sm" className="mr-2" /> : null}
                        Rate Order
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center">
            {searchQuery || filterStatus !== 'all' ? (
              <>
                <p className="mb-4 text-gray-600 dark:text-gray-400">
                  No orders match your search criteria
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              </>
            ) : (
              <div className="py-8">
                <FaShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-xl font-semibold">No orders yet</h3>
                <p className="max-w-md mx-auto mb-6 text-gray-600 dark:text-gray-400">
                  It looks like you haven't placed any orders yet. Browse our restaurants and place your first order!
                </p>
                <Button asChild>
                  <Link to="/">Browse Restaurants</Link>
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
      
      {filteredOrders.length > 0 && filteredOrders.length < orders.length && (
        <div className="text-center">
          <Badge variant="outline" className="px-3 py-1">
            Showing {filteredOrders.length} of {orders.length} orders
          </Badge>
        </div>
      )}
      
      <div className="flex justify-center mt-4">
        <Button variant="outline" onClick={fetchOrders} className="gap-2">
          <FaSync className="w-4 h-4" />
          Refresh Orders
        </Button>
      </div>
    </div>
  );
};

export default UserOrders; 