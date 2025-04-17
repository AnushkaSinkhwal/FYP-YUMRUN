import { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaDownload, 
  FaPrint, 
  FaShoppingBag, 
  FaMoneyBillWave, 
  FaTruck, 
  FaCheckCircle, 
  FaTimesCircle,
  FaMotorcycle,
  FaUserPlus
} from 'react-icons/fa';
import { Card, Badge, Button, Alert, Spinner, Tabs, TabsList, TabsTrigger, Select } from '../../components/ui';
import { adminAPI } from '../../utils/api';

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
      
      // Attempt to fetch orders from API, but handle missing endpoint gracefully
      try {
        const response = await adminAPI.getOrders();
        
        if (response.data && response.data.success) {
          const formattedOrders = (response.data.orders || []).map(order => ({
            id: order._id || order.orderId || `ORD-${Math.floor(Math.random() * 10000)}`,
            customer: order.user?.name || order.customerName || 'Unknown Customer',
            email: order.user?.email || order.customerEmail || 'No email',
            restaurant: order.restaurant?.name || order.restaurantName || 'Unknown Restaurant',
            total: order.total || order.amount || 0,
            items: order.items || [],
            status: order.status || 'Pending',
            paymentStatus: order.paymentStatus || 'Pending',
            date: order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown date',
            deliveryAddress: order.deliveryAddress || 'No address provided',
            notes: order.notes || ''
          }));
          
          console.log('Fetched orders:', formattedOrders);
          setOrders(formattedOrders);
          return;
        }
      } catch (err) {
        console.log('Order API endpoint not available:', err.message);
        // Don't throw error here, continue to fallback data
      }
      
      // Fallback to sample data if API fails or returns empty results
      console.log('Using sample order data');
      const sampleOrders = [
        {
          id: "ORD-2023-001",
          customer: "John Doe",
          email: "john@example.com",
          restaurant: "Fresh Bites",
          total: 45.99,
          items: [
            { name: "Grilled Chicken Salad", price: 15.99, quantity: 1 },
            { name: "Quinoa Bowl", price: 14.50, quantity: 2 }
          ],
          status: "Delivered",
          paymentStatus: "Paid",
          date: new Date().toLocaleString(),
          deliveryAddress: "123 Main St, Apt 4B, New York, NY 10001",
          notes: "Please leave at the door"
        },
        {
          id: "ORD-2023-002",
          customer: "Jane Smith",
          email: "jane@example.com",
          restaurant: "Burger House",
          total: 32.50,
          items: [
            { name: "Classic Burger", price: 12.99, quantity: 1 },
            { name: "Cheese Fries", price: 6.50, quantity: 1 },
            { name: "Chocolate Shake", price: 5.99, quantity: 2 }
          ],
          status: "Processing",
          paymentStatus: "Paid",
          date: new Date().toLocaleString(),
          deliveryAddress: "456 Oak Ave, Brooklyn, NY 11201",
          notes: ""
        }
      ];
      
      setOrders(sampleOrders);
      
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders. Please try again.");
      
      // If API fails, set empty array to avoid showing stale data
      setOrders([]);
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
      
      // In a real application, replace with actual API call
      // await adminAPI.assignDeliveryStaff(orderId, staffId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update the order in our local state to reflect the assignment
      const updatedOrders = orders.map(order => {
        if (order.id === selectedOrder.id) {
          const assignedStaff = deliveryStaff.find(staff => staff.id === staffId);
          return {
            ...order,
            deliveryPerson: assignedStaff.name,
            deliveryPersonId: assignedStaff.id,
            status: 'Out for Delivery'
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
          deliveryPerson: assignedStaff.name,
          deliveryPersonId: assignedStaff.id,
          status: 'Out for Delivery'
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
                          {order.userId?.fullName || 
                           (order.userId?.firstName && order.userId?.lastName 
                            ? `${order.userId.firstName} ${order.userId.lastName}` 
                            : order.customer || "N/A")}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {order.userId?.email || order.email || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {typeof order.restaurantId === 'object' 
                        ? order.restaurantId?.restaurantDetails?.name || order.restaurant || "N/A"
                        : order.restaurant || "N/A"}
                    </td>
                    <td className="px-4 py-3 font-medium">${parseFloat(order.grandTotal || order.total || 0).toFixed(2)}</td>
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Card className="max-w-3xl mx-auto dark:bg-gray-800 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Order Details</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedOrder.id}</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex items-center">
                  <FaPrint className="mr-1" /> Print
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowOrderDetails(false)}>
                  Close
                </Button>
              </div>
            </div>

            {/* Order info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">Customer Information</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  <span className="font-medium">Name:</span>{" "}
                  {selectedOrder.userId?.fullName || 
                   (selectedOrder.userId?.firstName && selectedOrder.userId?.lastName 
                    ? `${selectedOrder.userId.firstName} ${selectedOrder.userId.lastName}` 
                    : selectedOrder.customer || "N/A")}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  <span className="font-medium">Email:</span>{" "}
                  {selectedOrder.userId?.email || selectedOrder.email || "N/A"}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  <span className="font-medium">Phone:</span>{" "}
                  {selectedOrder.userId?.phone || selectedOrder.phone || "N/A"}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">Delivery Address</h4>
                {typeof selectedOrder.deliveryAddress === "string" ? (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    {selectedOrder.deliveryAddress || "N/A"}
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                      {selectedOrder.deliveryAddress?.street || selectedOrder.deliveryAddress?.fullAddress || "N/A"}
                    </p>
                    {selectedOrder.deliveryAddress?.city && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        {selectedOrder.deliveryAddress.city}
                        {selectedOrder.deliveryAddress.state
                          ? `, ${selectedOrder.deliveryAddress.state}`
                          : ""}
                        {selectedOrder.deliveryAddress.zipCode
                          ? ` ${selectedOrder.deliveryAddress.zipCode}`
                          : ""}
                      </p>
                    )}
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                      {selectedOrder.deliveryAddress?.country || ""}
                    </p>
                  </>
                )}
                {selectedOrder.specialInstructions && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    <span className="font-medium">Notes:</span> {selectedOrder.specialInstructions}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md flex items-center">
                <div className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 p-3 mr-3">
                  <FaShoppingBag size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Order Status</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedOrder.status}</p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md flex items-center">
                <div className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 p-3 mr-3">
                  <FaMoneyBillWave size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Payment Status</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedOrder.paymentStatus}</p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md flex items-center">
                <div className="rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 p-3 mr-3">
                  <FaTruck size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Restaurant</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedOrder.restaurant}</p>
                </div>
              </div>
            </div>

            {/* Order items */}
            <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-3">Order Items</h4>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md overflow-hidden mb-6">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-600">
                  <tr>
                    <th className="px-4 py-2">Item</th>
                    <th className="px-4 py-2 text-right">Price</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items && selectedOrder.items.map((item, index) => (
                    <tr key={index} className="border-b dark:border-gray-600">
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3 text-right">${parseFloat(item.price).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">${(parseFloat(item.price) * parseInt(item.quantity, 10)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="font-medium">
                  <tr className="border-t-2 dark:border-gray-600">
                    <td colSpan="3" className="px-4 py-3 text-right">Subtotal:</td>
                    <td className="px-4 py-3 text-right">${parseFloat(selectedOrder.totalPrice || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right">Delivery Fee:</td>
                    <td className="px-4 py-3 text-right">${parseFloat(selectedOrder.deliveryFee || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right">Tax:</td>
                    <td className="px-4 py-3 text-right">${parseFloat(selectedOrder.tax || 0).toFixed(2)}</td>
                  </tr>
                  <tr className="font-bold">
                    <td colSpan="3" className="px-4 py-3 text-right">Grand Total:</td>
                    <td className="px-4 py-3 text-right">${parseFloat(selectedOrder.grandTotal || selectedOrder.total || 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-end gap-3">
              {/* Assign Delivery Staff Section */}
              {(selectedOrder.status === 'Pending' || selectedOrder.status === 'Processing' || selectedOrder.status === 'Ready') && !selectedOrder.deliveryPersonId && (
                <div className="w-full mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-3">Assign Delivery Staff</h4>
                  
                  {deliveryStaff.filter(staff => staff.status === 'available').length === 0 ? (
                    <Alert variant="warning" className="mb-2">
                      No delivery staff currently available
                    </Alert>
                  ) : (
                    <div className="flex gap-3">
                      <Select
                        value={selectedDeliveryPerson}
                        onChange={(value) => setSelectedDeliveryPerson(value)}
                        options={deliveryStaff
                          .filter(staff => staff.status === 'available')
                          .map(staff => ({
                            value: staff.id,
                            label: `${staff.name} (${staff.vehicleType})`
                          }))}
                        placeholder="Select delivery staff"
                        className="flex-grow"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAssignDelivery(selectedOrder.id, selectedDeliveryPerson)}
                        disabled={!selectedDeliveryPerson || isAssigningDelivery}
                        className="flex items-center"
                      >
                        {isAssigningDelivery ? (
                          <Spinner size="sm" className="mr-2" />
                        ) : (
                          <FaUserPlus className="mr-1" />
                        )}
                        Assign
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Delivery Information (when assigned) */}
              {selectedOrder.deliveryPersonId && (
                <div className="w-full mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">Delivery Information</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md flex items-center mb-4">
                    <div className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 p-3 mr-3">
                      <FaMotorcycle size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Delivery Staff</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{selectedOrder.deliveryPerson}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                disabled={selectedOrder.status === 'Cancelled'}
              >
                <FaTimesCircle className="mr-1" /> Cancel Order
              </Button>
              {selectedOrder.status === 'Pending' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <FaTruck className="mr-1" /> Process Order
                </Button>
              )}
              {(selectedOrder.status === 'Processing' || selectedOrder.status === 'Out for Delivery') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <FaCheckCircle className="mr-1" /> Mark as Delivered
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Orders; 