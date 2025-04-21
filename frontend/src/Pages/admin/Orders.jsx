import { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaDownload, 
  FaCheckCircle, 
  FaTimesCircle,
  FaMotorcycle,
  FaUserPlus
} from 'react-icons/fa';
import { Card, Badge, Button, Alert, Spinner, Tabs, TabsList, TabsTrigger, Select } from '../../components/ui';
import { adminAPI } from '../../utils/api';

// Define available order statuses (matching backend enum)
const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

// Helper function to format currency
const formatCurrency = (amount) => {
  return `$${parseFloat(amount || 0).toFixed(2)}`;
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

  // State for status update in modal
  const [newStatus, setNewStatus] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  // Add state for delivery staff
  const [deliveryStaff, setDeliveryStaff] = useState([]);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState('');
  const [isAssigningDelivery, setIsAssigningDelivery] = useState(false);

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
          id: order.orderNumber || order._id, // Use orderNumber if available, fallback to _id
          originalId: order._id, // ** ALWAYS store the original MongoDB _id **
          customer: order.userId?.name || 'Unknown User',
          email: order.userId?.email || 'No email',
          phone: order.userId?.phone || 'No phone',
          restaurant: order.restaurantId?.name || 'Unknown Restaurant',
          total: order.grandTotal || 0, // Use grandTotal from backend
          totalPrice: order.totalPrice || 0,
          items: order.items || [],
          status: order.status || 'PENDING',
          paymentStatus: order.paymentStatus || 'PENDING',
          date: order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown date',
          deliveryAddress: order.deliveryAddress || 'No address provided',
          specialInstructions: order.specialInstructions || '',
          paymentMethod: order.paymentMethod,
          deliveryFee: order.deliveryFee || 0,
          tax: order.tax || 0,
          tip: order.tip || 0,
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
    try {
      try {
        const response = await adminAPI.getAvailableDrivers();
        if (response.data && response.data.success) {
          setDeliveryStaff(response.data.drivers || []);
          return;
        }
      } catch (err) {
        console.log('Drivers API endpoint not available:', err.message);
      }
      
      // Fallback data if API is not available
      const sampleDrivers = [
        { id: "DS001", name: "Mike Johnson", vehicleType: "motorcycle", status: "available" },
        { id: "DS002", name: "Sarah Williams", vehicleType: "scooter", status: "available" }
      ];
      setDeliveryStaff(sampleDrivers);
    } catch (error) {
      console.error("Error fetching delivery staff:", error);
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
    
    // Filter by status
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    // Filter by tab
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'pending' && order.status === 'Pending') ||
      (activeTab === 'processing' && (order.status === 'Processing' || order.status === 'Out for Delivery')) ||
      (activeTab === 'delivered' && order.status === 'Delivered') ||
      (activeTab === 'cancelled' && order.status === 'Cancelled');
    
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
    setNewStatus(order.status); // Initialize modal status with current status
    setUpdateError(null); // Clear previous update errors
    setShowOrderDetails(true);
  };

  // Status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Delivered': return 'success';
      case 'Processing': return 'info';
      case 'Pending': return 'warning';
      case 'Out for Delivery': return 'primary';
      case 'Cancelled': return 'danger';
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
  const handleAssignDelivery = async (orderId, staffId) => {
    try {
      if (!staffId || staffId.trim() === '') {
        setError("Please select a delivery staff member");
        return;
      }
      
      setIsAssigningDelivery(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Find original ID for state update
      const orderToUpdate = orders.find(o => o.id === selectedOrder.id);
      if (!orderToUpdate) return; // Should not happen
      const originalOrderId = orderToUpdate.originalId;

      // Update the order in our local state to reflect the assignment
      const updatedOrders = orders.map(order => {
        // Match using originalId now for consistency
        if (order.originalId === originalOrderId) {
          const assignedStaff = deliveryStaff.find(staff => staff.id === staffId);
          return {
            ...order,
            deliveryPerson: assignedStaff?.name || 'Unknown Driver', // Handle case where staff not found
            deliveryPersonId: assignedStaff?.id, // Use optional chaining
            status: 'OUT_FOR_DELIVERY' // Use correct status enum value
          };
        }
        return order;
      });
      
      setOrders(updatedOrders);
      
      // Update selectedOrder to reflect changes
      if (selectedOrder && selectedOrder.id === orderId) {
        const assignedStaff = deliveryStaff.find(staff => staff.id === staffId);
        setSelectedOrder({
          ...selectedOrder,
          deliveryPerson: assignedStaff?.name || 'Unknown Driver',
          deliveryPersonId: assignedStaff?.id,
          status: 'OUT_FOR_DELIVERY'
        });
      }
      
      // Show success message
      setError(null);
      
      setIsAssigningDelivery(false);
      setSelectedDeliveryPerson('');
    } catch (error) {
      console.error("Error assigning delivery staff:", error);
      setError("Failed to assign delivery staff. Please try again.");
      setIsAssigningDelivery(false);
    }
  };

  // Handle Order Status Update
  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus || newStatus === selectedOrder.status) {
      setUpdateError('Please select a new status.');
      return;
    }

    setIsUpdatingStatus(true);
    setUpdateError(null);

    try {
      // Extract original ID (_id) using the reliably stored field
      const originalOrderId = selectedOrder.originalId;
      if (!originalOrderId) {
         console.error("Original ID missing from selected order object:", selectedOrder);
         throw new Error('Cannot determine original order ID for update.');
      }
      
      console.log(`Updating status for order ${originalOrderId} to ${newStatus}`);
      const response = await adminAPI.updateOrderStatus(originalOrderId, newStatus);

      if (response.data && response.data.success) {
        const updatedOrderData = response.data.order;
        
        // Create the formatted version of the updated order
        const formattedUpdatedOrder = {
           id: updatedOrderData.orderNumber || updatedOrderData._id,
           originalId: updatedOrderData._id, // Store original ID
           customer: updatedOrderData.userId?.name || 'Unknown User',
           email: updatedOrderData.userId?.email || 'No email',
           phone: updatedOrderData.userId?.phone || 'No phone',
           restaurant: updatedOrderData.restaurantId?.name || 'Unknown Restaurant',
           total: updatedOrderData.grandTotal || 0,
           totalPrice: updatedOrderData.totalPrice || 0,
           items: updatedOrderData.items || [],
           status: updatedOrderData.status,
           paymentStatus: updatedOrderData.paymentStatus,
           date: updatedOrderData.createdAt ? new Date(updatedOrderData.createdAt).toLocaleString() : 'Unknown date',
           deliveryAddress: updatedOrderData.deliveryAddress,
           specialInstructions: updatedOrderData.specialInstructions,
           paymentMethod: updatedOrderData.paymentMethod,
           deliveryFee: updatedOrderData.deliveryFee || 0,
           tax: updatedOrderData.tax || 0,
           tip: updatedOrderData.tip || 0,
           // Ensure all fields used in the modal/table are included
           statusUpdates: updatedOrderData.statusUpdates,
           actualDeliveryTime: updatedOrderData.actualDeliveryTime
        };

        // Update the main orders list
        setOrders(prevOrders => 
          prevOrders.map(o => (o.id === selectedOrder.id ? formattedUpdatedOrder : o))
        );
        
        // Update the selected order in the modal
        setSelectedOrder(formattedUpdatedOrder);
        setNewStatus(formattedUpdatedOrder.status); // Reflect the new status in the dropdown

        // Optionally show a success message or close modal
        console.log('Order status updated successfully');
        // setShowOrderDetails(false); // Uncomment to close modal on success
      } else {
        throw new Error(response.data?.message || 'Failed to update status: Invalid response from server');
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      const message = err.response?.data?.message || err.message || "An unknown error occurred.";
      setUpdateError(`Failed to update status: ${message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
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
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFilter className="text-gray-400" />
            </div>
            <select
              className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
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
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" color="primary" />
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No orders found matching your search criteria
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 hidden md:table-cell">Restaurant</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden md:table-cell">Payment</th>
                  <th className="px-4 py-3 hidden md:table-cell">Date</th>
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
                    <td className="px-4 py-3 hidden md:table-cell">
                      {order.restaurant}
                    </td>
                    <td className="px-4 py-3 font-medium">${parseFloat(order.total).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)}>
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">{order.date}</td>
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
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700">
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <Card className="w-full max-w-4xl dark:bg-gray-800 p-6 max-h-[95vh] overflow-y-auto relative">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-600">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Order Details: {selectedOrder.id}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Placed on: {formatDate(selectedOrder.date)} 
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowOrderDetails(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                 <FaTimesCircle size={20} />
              </Button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Left Column: Customer & Delivery */}
              <div className="md:col-span-1 space-y-4">
                {/* Customer Info Card */}
                <div className="border dark:border-gray-600 rounded-md p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Customer</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{selectedOrder.customer}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{selectedOrder.email}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedOrder.phone}</p>
                </div>

                {/* Delivery Address Card */}
                <div className="border dark:border-gray-600 rounded-md p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Delivery Address</h4>
                  {typeof selectedOrder.deliveryAddress === "string" ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedOrder.deliveryAddress}
                    </p>
                  ) : (
                    <> 
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedOrder.deliveryAddress?.street || selectedOrder.deliveryAddress?.fullAddress || "N/A"}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedOrder.deliveryAddress?.city}{selectedOrder.deliveryAddress?.state ? `, ${selectedOrder.deliveryAddress.state}` : ""}{selectedOrder.deliveryAddress?.zipCode ? ` ${selectedOrder.deliveryAddress.zipCode}` : ""}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedOrder.deliveryAddress?.country || ""}
                      </p>
                    </>
                  )}
                   {selectedOrder.specialInstructions && (
                    <div className="mt-3 pt-3 border-t dark:border-gray-600">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Instructions:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{selectedOrder.specialInstructions}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Order Summary & Financials */}
              <div className="md:col-span-2 space-y-4">
                 {/* Order Summary Card */}
                 <div className="border dark:border-gray-600 rounded-md p-4 grid grid-cols-2 gap-4">
                    <div>
                       <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Restaurant</p>
                       <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{selectedOrder.restaurant}</p>
                    </div>
                     <div>
                       <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment</p>
                       <p className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                          {selectedOrder.paymentMethod} <Badge variant={getPaymentStatusBadgeVariant(selectedOrder.paymentStatus)} className="ml-2">{selectedOrder.paymentStatus}</Badge>
                       </p>
                    </div>
                     <div className="col-span-2">
                       <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Status</p>
                       <p className="text-base font-semibold text-gray-800 dark:text-gray-100"><Badge variant={getStatusBadgeVariant(selectedOrder.status)} size="lg">{selectedOrder.status}</Badge></p>
                    </div>
                 </div>

                {/* Price Breakdown Card */}
                <div className="border dark:border-gray-600 rounded-md p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Financials</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Subtotal:</span>
                      <span className="text-gray-800 dark:text-gray-200">{formatCurrency(selectedOrder.totalPrice)}</span>
                    </div>
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
                    <div className="flex justify-between pt-2 border-t dark:border-gray-600 font-bold text-base">
                      <span className="text-gray-800 dark:text-gray-100">Grand Total:</span>
                      <span className="text-gray-800 dark:text-gray-100">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Order Items</h4>
              <div className="overflow-x-auto border dark:border-gray-600 rounded-md">
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
                      <tr key={item.productId || index} className="border-b dark:border-gray-700 last:border-b-0"> 
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{item.name}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800 dark:text-gray-100">{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status Update Section */}
            <div className="mb-6 p-4 border rounded-md dark:border-gray-600">
              <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-3">Update Order Status</h4>
              {updateError && (
                <Alert variant="error" className="mb-3">
                  {updateError}
                </Alert>
              )}
              <div className="flex items-center gap-3">
                <Select
                  value={newStatus}
                  onChange={(value) => setNewStatus(value)}
                  options={ORDER_STATUSES.map(status => ({ value: status, label: status }))}
                  className="flex-grow"
                  disabled={isUpdatingStatus}
                />
                <Button 
                  variant="primary"
                  onClick={handleStatusUpdate}
                  disabled={isUpdatingStatus || newStatus === selectedOrder.status}
                  className="flex items-center whitespace-nowrap"
                >
                  {isUpdatingStatus ? <Spinner size="sm" className="mr-2" /> : <FaCheckCircle className="mr-1" />}
                  Update Status
                </Button>
              </div>
            </div>

            {/* Delivery Staff Section - ** Show ONLY when status is CONFIRMED ** */}
            {selectedOrder.status === 'CONFIRMED' && (
              <div className="mb-6 p-4 border rounded-md dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-3">Delivery Assignment</h4>
                {selectedOrder.deliveryPersonId ? (
                  // Show assigned driver info
                  <div className="flex items-center gap-3">
                     <div className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 p-3">
                        <FaMotorcycle size={20} />
                     </div>
                     <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Assigned To</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{selectedOrder.deliveryPerson || 'N/A'}</p>
                     </div>
                     {/* Optionally add button to unassign/reassign */} 
                  </div>
                ) : (
                  // Show assignment controls
                  deliveryStaff.filter(staff => staff.status === 'available').length === 0 ? (
                    <Alert variant="warning" size="sm">
                      No delivery staff currently available for assignment.
                    </Alert>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Select
                        value={selectedDeliveryPerson}
                        onChange={(value) => setSelectedDeliveryPerson(value)}
                        options={deliveryStaff
                          .filter(staff => staff.status === 'available')
                          .map(staff => ({ value: staff.id, label: `${staff.name}` }))} // Simplified label
                        placeholder="Select delivery staff..."
                        className="flex-grow"
                        disabled={isAssigningDelivery}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAssignDelivery(selectedOrder.id, selectedDeliveryPerson)}
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
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Status History</h4>
                <ul className="space-y-3">
                  {selectedOrder.statusUpdates.slice().reverse().map((update, index) => ( // Show newest first
                    <li key={index} className="flex items-center gap-3 text-sm">
                      <Badge variant={getStatusBadgeVariant(update.status)} size="sm">{update.status}</Badge>
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
            {/* <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-600"> ... </div> */}

          </Card>
        </div>
      )}
    </div>
  );
};

export default Orders; 