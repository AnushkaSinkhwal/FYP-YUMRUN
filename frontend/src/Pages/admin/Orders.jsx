import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaDownload, 
  FaTimesCircle,
  FaMotorcycle,
  FaUserPlus,
  FaEdit
} from 'react-icons/fa';
import { Card, Badge, Button, Alert, Spinner, Tabs, TabsList, TabsTrigger, Select } from '../../components/ui';
import { adminAPI } from '../../utils/api';

// Helper to humanize status codes
const humanizeStatus = (status) => status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

// Define available order statuses (matching backend enum)
const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

// Helper function to format currency
const formatCurrency = (amount) => {
  return `Rs. ${parseFloat(amount || 0).toFixed(2)}`;
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString(undefined, { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: 'numeric', minute: '2-digit' 
    });
  } catch {
    return 'Invalid Date';
  }
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const itemsPerPage = 10;

  // Add state for delivery staff
  const [deliveryStaff, setDeliveryStaff] = useState([]);
  // State for manual status update
  const [newStatus, setNewStatus] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState('');
  const [isAssigningDelivery, setIsAssigningDelivery] = useState(false);
  const [assignError, setAssignError] = useState(null);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);

  // Fetch orders from API
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Attempt to fetch orders directly
      const response = await adminAPI.getOrders();
      
      if (response.data && response.data.success && response.data.orders) {
        const formattedOrders = response.data.orders.map(order => ({
          id: order.orderNumber || order._id,                // Use orderNumber or fallback
          originalId: order._id,                              // Always store MongoDB _id
          customer: order.userId?.fullName || 'Unknown User',
          email: order.userId?.email || 'No email',
          phone: order.userId?.phone || 'No phone',
          restaurant: order.restaurantId?.name || 'Unknown Restaurant',
          total: order.grandTotal || 0,
          totalPrice: order.totalPrice || 0,
          items: order.items || [],
          status: (order.status || 'PENDING').toUpperCase(),
          paymentStatus: (order.paymentStatus || 'PENDING').toUpperCase(),
          statusUpdates: order.statusUpdates || [],
          actualDeliveryTime: order.actualDeliveryTime || null,
          date: order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown date',
          deliveryAddress: order.deliveryAddress || 'No address provided',
          specialInstructions: order.specialInstructions || '',
          paymentMethod: order.paymentMethod,
          deliveryFee: order.deliveryFee || 0,
          tax: order.tax || 0,
          tip: order.tip || 0,
          // New: assigned rider from backend
          deliveryPersonId: order.assignedRider?._id || null,
          // Use fullName if available, fallback to name
          deliveryPerson: order.assignedRider?.fullName || order.assignedRider?.name || 'Unassigned',
        }));
        
        console.log('Fetched and formatted orders:', formattedOrders);
        setOrders(formattedOrders);
      } else {
        // Handle cases where the API call succeeded but returned unexpected data
        console.error('API returned success but data is missing or malformed:', response.data);
        setError('Failed to load orders: Invalid data received from server.');
        setOrders([]); // Clear orders
      }
      
    } catch (error) {
      // Handle API call errors (network, server errors, etc.)
      console.error("Error fetching orders:", error);
      let errorMessage = "Failed to load orders. Please try again.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = `Failed to load orders: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Failed to load orders: ${error.message}`;
      }
      setError(errorMessage);
      setOrders([]); // Clear orders on error
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch delivery staff data
  useEffect(() => {
    const fetchDeliveryStaff = async () => {
      setIsLoadingDrivers(true);
      try {
        const response = await adminAPI.getAvailableDrivers();
        if (response.data && response.data.success) {
          const drivers = (response.data.deliveryStaff || []).map(driver => ({
            id: driver._id,
            name: driver.fullName || `${driver.firstName} ${driver.lastName}`,
            status: driver.deliveryRiderDetails?.approved ? 'available' : 'unavailable'
          }));
          setDeliveryStaff(drivers);
        } else {
          setDeliveryStaff([]);
        }
      } catch (err) {
        console.log('Drivers API endpoint not available:', err.message);
        setDeliveryStaff([]);
      } finally {
        setIsLoadingDrivers(false);
      }
    };

    fetchDeliveryStaff();
  }, []);

  // Filter orders based on search query, status and active tab
  const filteredOrders = orders.filter(order => {
    // Filter by search query
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.restaurant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by status dropdown (uses codes)
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    // Filter by tab group
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'pending' && order.status === 'PENDING') ||
      (activeTab === 'processing' && ['CONFIRMED','PREPARING','READY','OUT_FOR_DELIVERY'].includes(order.status)) ||
      (activeTab === 'delivered' && order.status === 'DELIVERED') ||
      (activeTab === 'cancelled' && order.status === 'CANCELLED');
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // View order details
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setUpdateError(null);
    setShowOrderDetails(true);
  };

  // Manually update order status (before delivery assignment)
  const handleUpdateStatus = async (originalId) => {
    setUpdateError(null);
    if (!newStatus) {
      setUpdateError('Please select a status');
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const response = await adminAPI.updateOrderStatus(originalId, newStatus);
      if (!response.data?.success) throw new Error(response.data?.message || 'Failed to update status');
      // Update local state and append to history
      setOrders(prev => prev.map(order =>
        order.originalId === originalId
          ? {
              ...order,
              status: newStatus,
              statusUpdates: order.statusUpdates
                ? [...order.statusUpdates, { status: newStatus, timestamp: new Date().toISOString(), updatedBy: { name: 'System' } }]
                : [{ status: newStatus, timestamp: new Date().toISOString(), updatedBy: { name: 'System' } }]
            }
          : order
      ));
      if (selectedOrder?.originalId === originalId) {
        setSelectedOrder(prev => ({
          ...prev,
          status: newStatus,
          statusUpdates: prev.statusUpdates
            ? [...prev.statusUpdates, { status: newStatus, timestamp: new Date().toISOString(), updatedBy: { name: 'System' } }]
            : [{ status: newStatus, timestamp: new Date().toISOString(), updatedBy: { name: 'System' } }]
        }));
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update status';
      setUpdateError(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Status badge variant based on backend codes
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'CONFIRMED': return 'info';
      case 'PREPARING': return 'info';
      case 'READY': return 'primary';
      case 'OUT_FOR_DELIVERY': return 'primary';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'danger';
      default: return 'default';
    }
  };

  // Payment status badge variant
  const getPaymentStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Pending': return 'warning';
      case 'Refunded': return 'danger';
      default: return 'default';
    }
  };

  // Assign delivery staff to order
  const handleAssignDelivery = async (originalId, staffId) => {
    setAssignError(null);
    try {
      if (!staffId || staffId.trim() === '') {
        setAssignError("Please select a delivery staff member");
        return;
      }
      
      setIsAssigningDelivery(true);
      
      // Call API to assign driver and update status
      const response = await adminAPI.updateOrderStatus(originalId, 'OUT_FOR_DELIVERY', staffId);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to assign driver');
      }

      // Determine driver name for assignment
      const driverName = deliveryStaff.find(s => s.id === staffId)?.name || 'Driver';

      // On success, update local state and status history
      setOrders(prev => prev.map(order =>
        order.originalId === originalId
          ? {
              ...order,
              deliveryPersonId: staffId,
              deliveryPerson: driverName,
              status: 'OUT_FOR_DELIVERY',
              statusUpdates: order.statusUpdates
                ? [...order.statusUpdates, { status: 'OUT_FOR_DELIVERY', timestamp: new Date().toISOString(), updatedBy: { name: driverName } }]
                : [{ status: 'OUT_FOR_DELIVERY', timestamp: new Date().toISOString(), updatedBy: { name: driverName } }]
            }
          : order
      ));

      // Also update modal state and status history
      if (selectedOrder?.originalId === originalId) {
        setSelectedOrder(prev => ({
          ...prev,
          deliveryPersonId: staffId,
          deliveryPerson: driverName,
          status: 'OUT_FOR_DELIVERY',
          statusUpdates: prev.statusUpdates
            ? [...prev.statusUpdates, { status: 'OUT_FOR_DELIVERY', timestamp: new Date().toISOString(), updatedBy: { name: driverName } }]
            : [{ status: 'OUT_FOR_DELIVERY', timestamp: new Date().toISOString(), updatedBy: { name: driverName } }]
        }));
      }
      
      // Clear UI state
      setAssignError(null);
      setIsAssigningDelivery(false);
      setSelectedDeliveryPerson('');
    } catch (error) {
      console.error("Error assigning delivery staff:", error);
      const msg = error.response?.data?.message || error.message || 'Failed to assign delivery staff';
      setAssignError(msg);
      setIsAssigningDelivery(false);
    }
  };

  return (
    <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl dark:text-gray-100">
          Order Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          View and manage customer orders
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Tabs for filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Action bar */}
      <div className="flex flex-col justify-between gap-4 mb-6 sm:flex-row">
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Search bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FaFilter className="text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {ORDER_STATUSES.map(status => (
                <option key={status} value={status}>{humanizeStatus(status)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Export button */}
        <Button variant="outline" className="flex items-center">
          <FaDownload className="mr-2" />
          Export Orders
        </Button>
      </div>

      {/* Orders table */}
      <Card className="shadow-sm dark:bg-gray-800">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" color="primary" />
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No orders found matching your search criteria
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="hidden px-4 py-3 md:table-cell">Restaurant</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 md:table-cell">Payment</th>
                  <th className="hidden px-4 py-3 md:table-cell">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 font-medium">{order.id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">
                          {order.customer}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {order.email}
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {order.restaurant}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {humanizeStatus(order.status)}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)}>
                        {humanizeStatus(order.paymentStatus)}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">{order.date}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                        <FaEye className="mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
              </span>{" "}
              of <span className="font-medium">{filteredOrders.length}</span> orders
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Order details modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <Card className="w-full max-w-4xl dark:bg-gray-800 p-6 max-h-[95vh] overflow-y-auto relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b dark:border-gray-600">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Order Details: {selectedOrder.id}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Placed on: {formatDate(selectedOrder.date)} 
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowOrderDetails(false)}
                className="absolute text-gray-500 top-4 right-4 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                 <FaTimesCircle size={20} />
              </Button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-3">
              {/* Left Column: Customer & Delivery */}
              <div className="space-y-4 md:col-span-1">
                {/* Customer Info Card */}
                <div className="p-4 border rounded-md dark:border-gray-600">
                  <h4 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">Customer</h4>
                  <p className="mb-1 text-sm text-gray-700 dark:text-gray-300">{selectedOrder.customer}</p>
                  <p className="mb-1 text-sm text-gray-700 dark:text-gray-300">{selectedOrder.email}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedOrder.phone}</p>
                </div>

                {/* Delivery Address Card */}
                <div className="p-4 border rounded-md dark:border-gray-600">
                  <h4 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">Delivery Address</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Name: {selectedOrder.deliveryAddress.fullName}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Email: {selectedOrder.deliveryAddress.email}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Phone: {selectedOrder.deliveryAddress.phone}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Address: {selectedOrder.deliveryAddress.address}</p>
                  {selectedOrder.deliveryAddress.additionalInfo && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">Additional Info: {selectedOrder.deliveryAddress.additionalInfo}</p>
                  )}
                </div>
              </div>

              {/* Right Column: Order Summary & Financials */}
              <div className="space-y-4 md:col-span-2">
                 {/* Order Summary Card */}
                 <div className="grid grid-cols-2 gap-4 p-4 border rounded-md dark:border-gray-600">
                    <div>
                       <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Restaurant</p>
                       <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{selectedOrder.restaurant}</p>
                    </div>
                     <div>
                       <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment</p>
                       <p className="flex items-center text-base font-semibold text-gray-800 dark:text-gray-100">
                          {selectedOrder.paymentMethod} <Badge variant={getPaymentStatusBadgeVariant(selectedOrder.paymentStatus)} className="ml-2">{humanizeStatus(selectedOrder.paymentStatus)}</Badge>
                       </p>
                    </div>
                     <div className="col-span-2">
                       <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Status</p>
                       <p className="text-base font-semibold text-gray-800 dark:text-gray-100"><Badge variant={getStatusBadgeVariant(selectedOrder.status)} size="lg">{humanizeStatus(selectedOrder.status)}</Badge></p>
                    </div>
                 </div>

                {/* Price Breakdown Card */}
                <div className="p-4 border rounded-md dark:border-gray-600">
                  <h4 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">Financials</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Delivery Fee:</span>
                      <span className="text-gray-800 dark:text-gray-200">{formatCurrency(selectedOrder.deliveryFee)}</span>
                    </div>
                     <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Tax:</span>
                      <span className="text-gray-800 dark:text-gray-200">{formatCurrency(selectedOrder.tax)}</span>
                    </div>
                    {selectedOrder.tip > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Tip:</span>
                        <span className="text-gray-800 dark:text-gray-200">{formatCurrency(selectedOrder.tip)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 text-base font-bold border-t dark:border-gray-600">
                      <span className="text-gray-800 dark:text-gray-100">Grand Total:</span>
                      <span className="text-gray-800 dark:text-gray-100">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="mb-6">
              <h4 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">Order Items</h4>
              <div className="overflow-x-auto border rounded-md dark:border-gray-600">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2">Item</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-center">Quantity</th>
                      <th className="px-4 py-2 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.map((item, index) => (
                      <React.Fragment key={item.productId || index}>
                        <tr className="border-b dark:border-gray-700 last:border-b-0">
                          <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{item.name}</td>
                          <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{item.quantity}</td>
                          <td className="px-4 py-3 font-medium text-right text-gray-800 dark:text-gray-100">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                        {/* Customizations */}
                        {item.customization?.addedIngredients?.map((ing, idx) => (
                          <tr key={`add-${idx}`} className="border-b dark:border-gray-700 last:border-b-0">
                            <td className="px-4 py-2 italic text-gray-600 dark:text-gray-400">+ {ing.name}</td>
                            <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">{formatCurrency(ing.price)}</td>
                            <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-300">1</td>
                            <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">{formatCurrency(ing.price)}</td>
                          </tr>
                        ))}
                        {item.customization?.specialInstructions && (
                          <tr className="border-b dark:border-gray-700 last:border-b-0">
                            <td colSpan="4" className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Note: {item.customization.specialInstructions}</td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Manual status update before delivery assignment */}
            {selectedOrder.status !== 'READY' && (
              <div className="p-4 mb-6 border rounded-md dark:border-gray-600">
                <h4 className="mb-3 font-medium text-gray-900 dark:text-gray-200">Update Order Status</h4>
                {updateError && (
                  <Alert variant="error" size="sm" className="mb-3">{updateError}</Alert>
                )}
                <div className="flex items-center gap-3">
                  <Select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    options={ORDER_STATUSES.filter(status => status !== 'OUT_FOR_DELIVERY').map(status => ({ value: status, label: humanizeStatus(status) }))}
                    className="flex-grow"
                    disabled={isUpdatingStatus}
                    placeholder="Select status..."
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedOrder.originalId)}
                    disabled={!newStatus || isUpdatingStatus}
                    className="flex items-center whitespace-nowrap"
                  >
                    {isUpdatingStatus ? <Spinner size="sm" className="mr-2" /> : <FaEdit className="mr-1" />}Update Status
                  </Button>
                </div>
              </div>
            )}
            
            {/* Delivery Assignment Section - Show when status is READY or OUT_FOR_DELIVERY */}
            {(selectedOrder.status === 'READY' || selectedOrder.status === 'OUT_FOR_DELIVERY') && (
              <div className="p-4 mb-6 border rounded-md dark:border-gray-600">
                  <h4 className="mb-3 font-medium text-gray-900 dark:text-gray-200">Delivery Assignment</h4>
                  {assignError && (
                    <Alert variant="error" size="sm" className="mb-3">{assignError}</Alert>
                  )}
                {selectedOrder.deliveryPersonId ? (
                  // Show assigned driver info
                  <div className="flex items-center gap-3">
                     <div className="p-3 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        <FaMotorcycle size={20} />
                     </div>
                     <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Assigned To</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{selectedOrder.deliveryPerson || 'N/A'}</p>
                     </div>
                     {/* Optionally add button to unassign/reassign */} 
                  </div>
                ) : (
                  // Show assignment controls with loading state
                  isLoadingDrivers ? (
                    <div className="flex items-center"><Spinner size="sm" /></div>
                  ) : deliveryStaff.filter(staff => staff.status === 'available').length === 0 ? (
                    <Alert variant="warning" size="sm">
                      No delivery staff currently available for assignment.
                    </Alert>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Select
                        value={selectedDeliveryPerson}
                        onChange={(e) => setSelectedDeliveryPerson(e.target.value)}
                        options={deliveryStaff
                          .filter(staff => staff.status === 'available')
                          .map(staff => ({ value: staff.id, label: `${staff.name}` }))}
                        placeholder="Select delivery staff..."
                        className="flex-grow"
                        disabled={isAssigningDelivery}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAssignDelivery(selectedOrder.originalId, selectedDeliveryPerson)}
                        disabled={!selectedDeliveryPerson || isAssigningDelivery}
                        className="flex items-center whitespace-nowrap"
                      >
                        {isAssigningDelivery ? <Spinner size="sm" className="mr-2" /> : <FaUserPlus className="mr-1" />}
                        Assign Driver
                      </Button>
                    </div>
                  )
                )}
              </div>
            )}
            
            {/* Status History */}
            {selectedOrder.statusUpdates && selectedOrder.statusUpdates.length > 0 && (
              <div className="mb-6">
                <h4 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">Status History</h4>
                <ul className="space-y-3">
                  {selectedOrder.statusUpdates.slice().reverse().map((update, index) => ( // Show newest first
                    <li key={index} className="flex items-center gap-3 text-sm">
                      <Badge variant={getStatusBadgeVariant(update.status)} size="sm">{humanizeStatus(update.status)}</Badge>
                      <span className="text-gray-500 dark:text-gray-400">{formatDate(update.timestamp)}</span>
                      {update.updatedBy && (
                        <span className="text-gray-500 dark:text-gray-400">by {update.updatedBy.name || 'System'}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Modal Footer Actions (Optional - Print/Close are moved to header) */}
            {/* <div className="flex justify-end pt-4 space-x-3 border-t dark:border-gray-600"> ... </div> */}

          </Card>
        </div>
      )}
    </div>
  );
};

export default Orders; 