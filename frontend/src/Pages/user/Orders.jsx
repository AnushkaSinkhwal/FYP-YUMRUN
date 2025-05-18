import { useState, useEffect } from 'react';
import { 
  Card, Button, Input, Select, Spinner, Alert, Badge,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription 
} from '../../components/ui';
import { 
  FaSearch, FaStar, FaMapMarkerAlt, FaClock, FaUtensils, FaExternalLinkAlt, FaShoppingBag, FaSync,
  FaReceipt, FaTimes, FaCalendarAlt
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const UserOrders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tempRatings, setTempRatings] = useState({});
  const [ratingInProgress, setRatingInProgress] = useState(null);
  // State for rider ratings
  const [tempRiderRatings, setTempRiderRatings] = useState({});
  const [riderRatingInProgress, setRiderRatingInProgress] = useState(null);
  
  // State for order detail modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  // State for canceling orders
  const [cancelingOrderId, setCancelingOrderId] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
      const response = await userAPI.getOrders();
      console.log('Orders response:', response);
      
      if (response.data && response.data.success) {
        if (Array.isArray(response.data.data)) {
          console.log('Orders data:', response.data.data);
          
          // Check if we actually have any orders
          if (response.data.data.length === 0) {
            console.log('No orders found for this user');
            setOrders([]);
          } else {
            setOrders(response.data.data);
            console.log('Orders set:', response.data.data);
          }
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
        toast.error('Server error occurred. The team has been notified.');
      } else if (err.message.includes('Network Error')) {
        setError('Network connection issue. Please check your internet connection.');
        toast.error('Network connection issue. Please check your internet connection.');
      } else {
        setError('Failed to load orders. Please try again later.');
        toast.error('Failed to load orders. Please try again later.');
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

  // Temp state for rider rating
  const setTempRiderRating = (orderId, rating) => {
    setTempRiderRatings(prev => ({ ...prev, [orderId]: rating }));
  };

  // Function to submit rating for an order
  const submitRating = async (orderId, rating) => {
    if (!rating) {
      rating = tempRatings[orderId] || 5;
    }
    
    // Determine menuItemId for this order (use first item in items array)
    const orderToRate = orders.find(o => String(getId(o)) === orderId);
    const firstItem = orderToRate?.items?.[0];
    const menuItemId = firstItem?.productId || firstItem?.id || firstItem?._id;
    if (!menuItemId) {
      setError('Unable to submit rating: No item found in order');
      toast.error('Unable to submit rating: No item found in order');
      return;
    }

    try {
      setRatingInProgress(orderId);
      
      const response = await userAPI.submitReview({
        orderId,
        menuItemId,
        rating,
        comment: ''
      });

      if (response.data && response.data.success) {
        // Update local state to reflect the new rating
        setOrders(prevOrders =>
          prevOrders.map(o =>
            String(getId(o)) === orderId ? { ...o, rating, isRated: true } : o
          )
        );
        
        // Clear temp rating
        setTempRatings(prev => {
          const newState = { ...prev };
          delete newState[orderId];
          return newState;
        });
        
        toast.success('Rating submitted successfully');
      } else {
        throw new Error(response.data?.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError('Failed to submit rating. Please try again.');
      toast.error('Failed to submit rating. Please try again.');
    } finally {
      setRatingInProgress(null);
    }
  };

  // Function to submit rating for the delivery rider
  const submitRiderRating = async (orderId) => {
    const ratingValue = tempRiderRatings[orderId] || 5;
    try {
      setRiderRatingInProgress(orderId);
      const response = await userAPI.submitRiderReview({ orderId, rating: ratingValue, comment: '' });
      if (response.data && response.data.success) {
        // Mark this order as rated in local orders state
        setOrders(prevOrders =>
          prevOrders.map(o =>
            String(getId(o)) === orderId ? { ...o, isRiderRated: true, riderRating: ratingValue } : o
          )
        );
        setTempRiderRatings(prev => { const s = { ...prev }; delete s[orderId]; return s; });
        toast.success('Rider rating submitted successfully');
      } else {
        throw new Error(response.data?.message || 'Failed to submit rider review');
      }
    } catch (err) {
      // Log detailed error from server or network
      console.error('Error submitting rider rating:', err.response || err);
      // Extract meaningful message from response or fallback
      const errorMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to submit rider rating. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setRiderRatingInProgress(null);
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
    } catch {
      return dateString;
    }
  };

  const getRestaurantName = (order) => {
    // Check nested structure first
    if (order?.restaurantId?.restaurantDetails?.name) {
      return order.restaurantId.restaurantDetails.name;
    }
    // Check direct property on restaurantId object
    if (order?.restaurantId?.name) {
      return order.restaurantId.name;
    }
    // Handle case where restaurantId is a direct object with id and name
    if (order?.restaurantId && typeof order.restaurantId === 'object' && order.restaurantId.id && order.restaurantId.name) {
      return order.restaurantId.name;
    }
    // Check for direct restaurant object
    if (order?.restaurant && typeof order.restaurant === 'object' && order.restaurant.name) {
      return order.restaurant.name;
    }
    // Fallback to potential direct restaurant name string or default
    return typeof order?.restaurant === 'string' ? order.restaurant : 'Restaurant';
  };

  const getId = (order) => {
    return order.id || order._id;
  };

  // Function to handle viewing order details
  const handleViewDetails = async (orderId) => {
    console.log('Viewing details for order ID:', orderId);
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setSelectedOrderDetails(null); // Clear previous details

    try {
      const response = await userAPI.getOrder(orderId);
      console.log('Order detail response:', response);

      if (response.data && response.data.success && response.data.data) {
        setSelectedOrderDetails(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch order details');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setDetailError('Unable to load order details. Please try again later.');
      toast.error('Unable to load order details. Please try again later.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Function to cancel an order by the user
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelError(null);
    setCancelingOrderId(orderId);
    try {
      const response = await userAPI.cancelOrder(orderId);
      if (response.data && response.data.success) {
        toast.success('Order cancelled successfully');
        setOrders(prevOrders =>
          prevOrders.map(o =>
            String(getId(o)) === orderId ? { ...o, status: 'CANCELLED' } : o
          )
        );
      } else {
        throw new Error(response.data?.message || 'Failed to cancel order');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel order';
      setCancelError(msg);
      toast.error(msg);
    } finally {
      setCancelingOrderId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!order) return false;
    
    // Handle search
    const orderNumber = order.orderNumber || '';
    const restaurant = getRestaurantName(order);
    const itemsText = order.items?.map(item => item.name || item.productName || '').join(' ') || '';
    
    const matchesSearch = searchQuery === '' || 
      orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      itemsText.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Handle status filter
    let orderStatus = order.status || '';
    if (typeof orderStatus === 'string') {
      orderStatus = orderStatus.toLowerCase();
    }
    
    // Normalize both status strings to match
    const normalizedOrderStatus = orderStatus.replace(/_/g, '').toLowerCase();
    const normalizedFilterStatus = filterStatus.replace(/_/g, '').toLowerCase();
    
    const matchesStatus = filterStatus === 'all' || normalizedOrderStatus === normalizedFilterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'date': {
        const dateA = a.createdAt || a.date || '0';
        const dateB = b.createdAt || b.date || '0';
        // Handle invalid dates
        const timeA = new Date(dateA).getTime() || 0;
        const timeB = new Date(dateB).getTime() || 0;
        return timeB - timeA;
      }
      case 'amount': {
        const amountA = a.grandTotal || a.totalAmount || a.total || 0;
        const amountB = b.grandTotal || b.totalAmount || b.total || 0;
        return amountB - amountA;
      }
      case 'rating': {
        const ratingA = a.rating || a.averageRating || 0;
        const ratingB = b.rating || b.averageRating || 0;
        return ratingB - ratingA;
      }
      default:
        return 0;
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
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      {cancelError && (
        <Alert variant="destructive" className="mb-4">
          {cancelError}
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

        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-[180px]"
          placeholder="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="delivered">Delivered</option>
          <option value="preparing">Preparing</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="ready">Ready</option>
          <option value="out_for_delivery">Out For Delivery</option>
          <option value="cancelled">Cancelled</option>
        </Select>

        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-[180px]"
          placeholder="Sort by"
        >
          <option value="date">Date</option>
          <option value="amount">Amount</option>
          <option value="rating">Rating</option>
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
                      <p className="font-semibold">Rs {(order.grandTotal || order.totalAmount || 0).toFixed(2)}</p>
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
                      <span className="truncate">Delivery: { 
                        // Safely access address properties
                        typeof order.deliveryAddress === 'object' && order.deliveryAddress !== null 
                          ? `${order.deliveryAddress.street || ''}${order.deliveryAddress.street && order.deliveryAddress.city ? ', ' : ''}${order.deliveryAddress.city || ''}` 
                          : order.deliveryAddress || 'N/A' 
                      }</span>
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
                        <span>Rs. {(order.totalPrice || order.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>Rs. {(order.deliveryFee || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>Rs. {(order.tax || 0).toFixed(2)}</span>
                      </div>
                      {order.tip > 0 && (
                        <div className="flex justify-between">
                          <span>Tip</span>
                          <span>Rs. {(order.tip || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 font-semibold border-t">
                        <span>Total</span>
                        <span>Rs. {(order.grandTotal || order.total || order.totalAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => handleViewDetails(orderId)}
                    className="flex items-center gap-1.5"
                    disabled={detailLoading && selectedOrderDetails?._id === orderId}
                  >
                    {detailLoading && selectedOrderDetails?._id === orderId ? 
                      <Spinner size="sm" className="mr-1"/> : 
                      <FaExternalLinkAlt className="w-3 h-3" />
                    }
                    View Details
                  </Button>
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
                        disabled={ratingInProgress === orderId}
                      >
                        {ratingInProgress === orderId ? <Spinner size="sm" className="mr-2" /> : null}
                        Rate Order
                      </Button>
                    </div>
                  )}
                  {/* Rider Rating UI */}
                  {isDelivered && !order.isRiderRated && (
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Button
                          key={star}
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => setTempRiderRating(orderId, star)}
                        >
                          <FaStar className={`h-5 w-5 ${
                            star <= (tempRiderRatings[orderId] || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`} />
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        onClick={() => submitRiderRating(orderId)}
                        disabled={riderRatingInProgress === orderId}
                      >
                        {riderRatingInProgress === orderId ? (
                          <Spinner size="sm" className="mr-2" />
                        ) : null}
                        Rate Rider
                      </Button>
                    </div>
                  )}
                  {order.status === 'PENDING' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelOrder(orderId)}
                      disabled={cancelingOrderId === orderId}
                      className="gap-1"
                    >
                      {cancelingOrderId === orderId ? <Spinner size="sm" className="mr-1" /> : <FaTimes className="w-3 h-3 mr-1" />}
                      Cancel Order
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center p-8 mt-8 text-center bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <FaShoppingBag className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">No orders yet</h3>
            <p className="max-w-md mb-6 text-gray-500 dark:text-gray-400">
              It looks like you haven&apos;t placed any orders yet. Browse our restaurants and place your first order!
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={() => navigate('/restaurants')}
                className="gap-2"
              >
                <FaUtensils className="w-4 h-4" />
                Browse Restaurants
              </Button>
              <Button 
                variant="outline"
                onClick={fetchOrders}
                className="gap-2"
              >
                <FaSync className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                Refresh Orders
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {filteredOrders.length > 0 && filteredOrders.length < orders.length && (
        <div className="text-center">
          <Badge variant="outline" className="px-3 py-1">
            Showing {filteredOrders.length} of {orders.length} orders
          </Badge>
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription className="sr-only">
              Detailed information about your order including items, costs, and delivery details.
            </DialogDescription>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="absolute top-4 right-4">
                <FaTimes className="w-4 h-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          
          {detailLoading && (
            <div className="flex items-center justify-center py-10">
              <Spinner size="lg" />
            </div>
          )}
          
          {detailError && !detailLoading && (
            <Alert variant="destructive">{detailError}</Alert>
          )}

          {selectedOrderDetails && !detailLoading && !detailError && (
            <div className="py-4 space-y-4">
              {/* Simplified Order Detail Content - Reuse structure from OrderDetail.jsx if needed */}
              <div className="flex items-center justify-between pb-4 border-b">
                <h3 className="font-semibold">Order #{selectedOrderDetails.orderNumber}</h3>
                <Badge className={`px-3 py-1 text-sm ${getStatusColor(selectedOrderDetails.status)}`}>
                  {formatStatus(selectedOrderDetails.status)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2 text-gray-500" />
                  <span>Ordered: {formatDate(selectedOrderDetails.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <FaReceipt className="mr-2 text-gray-500" />
                  <span>Payment: {selectedOrderDetails.paymentMethod} ({selectedOrderDetails.paymentStatus})</span>
                </div>
                <div className="flex items-center col-span-1 sm:col-span-2">
                  <FaUtensils className="mr-2 text-gray-500" />
                  <span>Restaurant: {getRestaurantName(selectedOrderDetails)}</span>
                </div>
                <div className="flex items-start col-span-1 sm:col-span-2">
                  <FaMapMarkerAlt className="flex-shrink-0 mr-2 text-gray-500 mt-0.5" />
                  <span>Delivery: {
                    typeof selectedOrderDetails.deliveryAddress === 'object' ? 
                      (selectedOrderDetails.deliveryAddress?.street || 
                       selectedOrderDetails.deliveryAddress?.address || 
                       JSON.stringify(selectedOrderDetails.deliveryAddress).replace(/[{}"]/g, '')) : 
                      (selectedOrderDetails.deliveryAddress || 'N/A')
                  }</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="mb-2 font-medium">Items</h4>
                <div className="space-y-3 text-sm">
                  {selectedOrderDetails.items?.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between">
                        <span>{item.quantity || 1}x {item.name || 'Item'}</span>
                        <span>Rs. {((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                      </div>
                      
                      {/* Display customization details */}
                      {item.customization && (
                        <div className="pl-4 text-xs text-gray-500">
                          {/* Added ingredients */}
                          {item.customization.addedIngredients && item.customization.addedIngredients.length > 0 && (
                            <div>
                              <span className="font-medium">Add-ons: </span>
                              {item.customization.addedIngredients.map((ingredient, idx) => (
                                <div key={idx} className="pl-2">
                                  • {ingredient.name} (+Rs. {(ingredient.price || 0).toFixed(2)})
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Display serving size if available */}
                          {item.customization.servingSize && (
                            <div className="mt-1">
                              <span className="font-medium">Size: </span>
                              {item.customization.servingSize}
                            </div>
                          )}
                          
                          {/* Display cooking method if available */}
                          {item.customization.cookingMethod && (
                            <div className="mt-1">
                              <span className="font-medium">Method: </span>
                              {item.customization.cookingMethod}
                            </div>
                          )}
                          
                          {/* Display special instructions if available */}
                          {item.customization.specialInstructions && (
                            <div className="mt-1">
                              <span className="font-medium">Instructions: </span>
                              {item.customization.specialInstructions}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Check for selectedAddOns in legacy format */}
                      {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                        <div className="pl-4 text-xs text-gray-500">
                          <span className="font-medium">Add-ons: </span>
                          {item.selectedAddOns.map((addOn, idx) => (
                            <div key={idx} className="pl-2">
                              • {addOn.name} (+Rs. {(addOn.price || 0).toFixed(2)})
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Check for customizationDetails in legacy format */}
                      {item.customizationDetails && (
                        <div className="pl-4 text-xs text-gray-500">
                          {item.customizationDetails.servingSize && (
                            <div className="mt-1">
                              <span className="font-medium">Size: </span>
                              {item.customizationDetails.servingSize}
                            </div>
                          )}
                          {item.customizationDetails.cookingMethod && (
                            <div className="mt-1">
                              <span className="font-medium">Method: </span>
                              {item.customizationDetails.cookingMethod}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 space-y-1 text-sm border-t">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rs. {(selectedOrderDetails.totalPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>Rs. {(selectedOrderDetails.deliveryFee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>Rs. {(selectedOrderDetails.tax || 0).toFixed(2)}</span>
                </div>
                {selectedOrderDetails.tip > 0 && (
                  <div className="flex justify-between">
                    <span>Tip:</span>
                    <span>Rs. {(selectedOrderDetails.tip || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>Rs. {(selectedOrderDetails.grandTotal || selectedOrderDetails.total || 0).toFixed(2)}</span>
                </div>
              </div>
              
              {selectedOrderDetails.specialInstructions && (
                <div className="pt-4 border-t">
                  <h4 className="mb-1 font-medium">Special Instructions</h4>
                  <p className="text-sm text-gray-600">{selectedOrderDetails.specialInstructions}</p>
                </div>
              )}

              {/* Status History */}
              {selectedOrderDetails.statusUpdates?.length > 0 && (
                <div className="pt-4">
                  <h4 className="mb-2 text-base font-medium">Status History</h4>
                  <ul className="text-sm divide-y">
                    {selectedOrderDetails.statusUpdates.slice().reverse().map((update, idx) => (
                      <li key={idx} className="py-2">
                        <div className="flex justify-between">
                          <span>{formatStatus(update.status)}</span>
                          <span>{formatDate(update.timestamp)}</span>
                        </div>
                        {update.updatedBy && (
                          <div className="text-xs text-gray-500">Updated by: {update.updatedBy.name || 'System'}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserOrders; 