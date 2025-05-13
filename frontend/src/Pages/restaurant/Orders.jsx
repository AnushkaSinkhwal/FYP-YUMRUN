import { useState, useEffect } from 'react';
import React from 'react';
import {
  FaSearch,
  FaEye,
  FaDownload,
  FaTimesCircle,
  FaEdit,
  FaSync,
  FaMotorcycle
} from 'react-icons/fa';
import { Card, CardHeader, CardContent, CardFooter, Badge, Button, Alert, Spinner, Tabs, TabsList, TabsTrigger, Select } from '../../components/ui';
import { restaurantAPI } from '../../utils/api';

// Helper to humanize status codes
const humanizeStatus = (status) => status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

// Define available order statuses (matching backend enum)
const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

// Allowed status transitions for restaurant owner (UI layer)
const ALLOWED_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: [],
  OUT_FOR_DELIVERY: [],
  DELIVERED: [],
  CANCELLED: []
};

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

  // State for manual status update
  const [newStatus, setNewStatus] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  // State for delivery staff and assignment
  const [deliveryStaff, setDeliveryStaff] = useState([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState('');
  const [isAssigningDelivery, setIsAssigningDelivery] = useState(false);
  const [assignError, setAssignError] = useState(null);

  // Fetch orders from API
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Use restaurantAPI to get orders for the specific restaurant
      const response = await restaurantAPI.getOrders();

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const formattedOrders = response.data.data.map(order => ({
          id: order.orderNumber || order._id,
          originalId: order._id,
          customer: order.userId?.fullName || 'Unknown User',
          email: order.userId?.email || 'No email',
          phone: order.userId?.phone || 'No phone',
          // Restaurant name is not needed here as it's the restaurant's own view
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
          // Delivery person details might still be relevant if admin assigned
          deliveryPersonId: order.assignedRider?._id || null,
          deliveryPerson: order.assignedRider?.fullName || order.assignedRider?.name || 'Unassigned',
        }));
        setOrders(formattedOrders);
      } else {
        console.error('API returned success but data is missing or malformed:', response.data);
        setError('Failed to load orders: Invalid data received from server.');
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      let errorMessage = "Failed to load orders. Please try again.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = `Failed to load orders: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Failed to load orders: ${error.message}`;
      }
      setError(errorMessage);
        setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeliveryStaff = async () => {
    // TODO: Implement fetching delivery staff using restaurantAPI.getAvailableRiders
    console.log("Fetching delivery staff...");
    setIsLoadingDrivers(true);
    try {
      const response = await restaurantAPI.getAvailableRiders();
      console.log('Available riders response:', response.data);
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const drivers = response.data.data.map(rider => ({
          id: rider._id,
          name: rider.fullName || `${rider.firstName || ''} ${rider.lastName || ''}`.trim(),
          status: 'available', // All approved riders are available
        }));
        setDeliveryStaff(drivers);
      } else {
        setDeliveryStaff([]);
        console.warn("Could not fetch delivery staff or empty list returned:", response.data);
      }
    } catch (err) {
      console.error("Error fetching delivery staff:", err);
      setDeliveryStaff([]);
      setAssignError("Could not load delivery staff.");
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  // Filter orders based on search query, status and active tab
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      (order.id?.toString().toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.customer?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;

    const matchesTab = activeTab === 'all' ||
      (activeTab === 'pending' && order.status === 'PENDING') ||
      (activeTab === 'processing' && ['CONFIRMED','PREPARING','READY'].includes(order.status)) || // Removed OUT_FOR_DELIVERY for restaurant view until rider assignment
      (activeTab === 'ready_for_pickup' && order.status === 'READY') || // More specific for restaurants
      (activeTab === 'delivered' && order.status === 'DELIVERED') || // Or picked up by customer / rider
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
    setAssignError(null);
    setSelectedDeliveryPerson('');
    setShowOrderDetails(true);
    // Fetch drivers if order is ready or out for delivery
    if (['READY', 'OUT_FOR_DELIVERY'].includes(order.status)) {
      fetchDeliveryStaff();
    }
  };

  // Manually update order status
  const handleUpdateStatus = async (originalId) => {
    setUpdateError(null);
    if (!newStatus) {
      setUpdateError('Please select a status');
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const response = await restaurantAPI.updateOrderStatus(originalId, newStatus);
      if (!response.data?.success) throw new Error(response.data?.message || 'Failed to update status');

      // Optimistically update local state
      const updatedOrders = orders.map(order =>
        order.originalId === originalId
              ? {
                  ...order,
              status: newStatus,
                  statusUpdates: [
                    ...(order.statusUpdates || []),
                { status: newStatus, timestamp: new Date().toISOString(), updatedBy: { name: 'Restaurant' } }
              ]
                }
              : order
      );
      setOrders(updatedOrders);

      if (selectedOrder?.originalId === originalId) {
        setSelectedOrder(prev => ({
          ...prev,
          status: newStatus,
          statusUpdates: [
            ...(prev.statusUpdates || []),
            { status: newStatus, timestamp: new Date().toISOString(), updatedBy: { name: 'Restaurant' } }
          ]
        }));
      }
      // If status changed to READY, fetch drivers for assignment
      if (newStatus === 'READY') {
        fetchDeliveryStaff();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update status';
      setUpdateError(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignDelivery = async (orderIdToAssign, riderIdToAssign) => {
    // TODO: Implement assigning delivery staff
    console.log(`Assigning rider ${riderIdToAssign} to order ${orderIdToAssign}`);
    setAssignError(null);
    if (!riderIdToAssign) {
      setAssignError("Please select a delivery person.");
      return;
    }
    setIsAssigningDelivery(true);
    try {
      const response = await restaurantAPI.assignRider(orderIdToAssign, riderIdToAssign);
      if (response.data && response.data.success) {
        const updatedOrderData = response.data.data; // Assuming API returns updated order
        // Optimistically update local state
        const updatedOrders = orders.map(o =>
          o.originalId === orderIdToAssign
            ? { ...updatedOrderData, 
                id: updatedOrderData.orderNumber || updatedOrderData._id,
                customer: updatedOrderData.userId?.fullName || 'Unknown User',
                email: updatedOrderData.userId?.email || 'No email',
                phone: updatedOrderData.userId?.phone || 'No phone',
                total: updatedOrderData.grandTotal || 0,
                totalPrice: updatedOrderData.totalPrice || 0,
                items: updatedOrderData.items || [],
                status: (updatedOrderData.status || 'PENDING').toUpperCase(),
                paymentStatus: (updatedOrderData.paymentStatus || 'PENDING').toUpperCase(),
                statusUpdates: updatedOrderData.statusUpdates || [],
                actualDeliveryTime: updatedOrderData.actualDeliveryTime || null,
                date: updatedOrderData.createdAt ? new Date(updatedOrderData.createdAt).toLocaleString() : 'Unknown date',
                deliveryAddress: updatedOrderData.deliveryAddress || 'No address provided',
                specialInstructions: updatedOrderData.specialInstructions || '',
                paymentMethod: updatedOrderData.paymentMethod,
                deliveryFee: updatedOrderData.deliveryFee || 0,
                tax: updatedOrderData.tax || 0,
                tip: updatedOrderData.tip || 0,
                deliveryPersonId: updatedOrderData.assignedRider?._id || updatedOrderData.deliveryPersonId || null,
                deliveryPerson: updatedOrderData.assignedRider?.fullName || updatedOrderData.assignedRider?.name || 'Unassigned'
              }
            : o
        );
        setOrders(updatedOrders);

        if (selectedOrder?.originalId === orderIdToAssign) {
          setSelectedOrder(prev => ({ 
            ...prev, 
            ...updatedOrderData, // Apply all updates from backend
             status: (updatedOrderData.status || 'PENDING').toUpperCase(), // Ensure status is in uppercase
             deliveryPersonId: updatedOrderData.assignedRider?._id || updatedOrderData.deliveryPersonId || null,
             deliveryPerson: updatedOrderData.assignedRider?.fullName || updatedOrderData.assignedRider?.name || 'Unassigned'
            }));
        }
        setSelectedDeliveryPerson(''); // Clear selection
      } else {
        throw new Error(response.data?.message || "Failed to assign rider.");
      }
    } catch (err) {
      console.error("Error assigning rider:", err);
      setAssignError(err.response?.data?.message || err.message || "Failed to assign rider.");
    } finally {
      setIsAssigningDelivery(false);
    }
  };

  // Status badge variant based on backend codes
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'CONFIRMED': return 'info';
      case 'PREPARING': return 'info';
      case 'READY': return 'primary'; // Or 'success' if it implies ready for pickup
      case 'OUT_FOR_DELIVERY': return 'primary';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'danger';
      default: return 'default';
    }
  };

  const getPaymentStatusBadgeVariant = (status) => {
    switch (status) {
      case 'PAID': return 'success'; // Assuming 'PAID'
      case 'PENDING': return 'warning'; // Assuming 'PENDING'
      case 'FAILED': return 'danger';
      case 'REFUNDED': return 'info';
      default: return 'default';
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    setCurrentPage(1); // Reset to first page on tab change
  };

  // Export data (basic CSV example)
  const exportData = () => {
    const csvRows = [];
    const headers = ['Order ID', 'Customer', 'Email', 'Phone', 'Total', 'Status', 'Payment Status', 'Date', 'Items'];
    csvRows.push(headers.join(','));

    for (const order of filteredOrders) {
      const itemsString = order.items.map(item => `${item.name} (x${item.quantity})`).join('; ');
      const values = [
        order.id,
        order.customer,
        order.email,
        order.phone,
        order.total,
        order.status,
        order.paymentStatus,
        formatDate(order.date), // Use formatDate
        `"${itemsString}"` // Enclose in quotes if it contains commas or semicolons
      ].join(',');
      csvRows.push(values);
    }
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'restaurant_orders.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen"><Spinner size="large" /></div>;
  if (error) return <div className="container p-4 mx-auto"><Alert variant="destructive" title="Error">{error}</Alert></div>;

  return (
    <div className="container p-4 mx-auto">
      <h1 className="mb-6 text-2xl font-bold">My Restaurant Orders</h1>

      {/* Controls: Search, Filter, Refresh, Export */}
      <Card className="mb-6 !overflow-visible" style={{ overflow: 'visible' }}>
        <CardContent className="p-4">
          <div className="grid items-end grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="md:col-span-2 lg:col-span-1">
              <label htmlFor="search" className="block mb-1 text-sm font-medium text-gray-700">Search Orders</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FaSearch className="text-gray-400" />
        </div>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by ID, customer, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
      </div>
          </div>
            <div>
              <label htmlFor="statusFilter" className="block mb-1 text-sm font-medium text-gray-700">Filter by Status</label>
              <Select
                id="statusFilter"
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  ...ORDER_STATUSES.map(s => ({ value: s, label: humanizeStatus(s) }))
                ]}
                className="w-full"
                placeholder="All Statuses"
              />
            </div>
            <div className="flex space-x-2">
                <Button onClick={fetchOrders} variant="outline" className="w-full md:w-auto">
            <FaSync className="mr-2" /> Refresh
          </Button>
                <Button onClick={exportData} variant="outline" className="w-full md:w-auto">
                  <FaDownload className="mr-2" /> Export
          </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

      {/* Tabs for Order Status */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="ready_for_pickup">Ready for Pickup/Delivery</TabsTrigger>
          <TabsTrigger value="delivered">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>
      </Tabs>

      {/* Orders Grid / Table */}
      {paginatedOrders.length === 0 && !isLoading ? (
        <Alert>No orders found matching your criteria.</Alert>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedOrders.map(order => (
                <tr key={order.originalId}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    <div>{order.customer}</div>
                    <div className="text-xs text-gray-400">{order.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatCurrency(order.total)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(order.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusBadgeVariant(order.status)}>{humanizeStatus(order.status)}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)}>{humanizeStatus(order.paymentStatus)}</Badge>
                  </td>
                  <td className="px-6 py-4 space-x-2 text-sm font-medium whitespace-nowrap">
                    <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                      <FaEye className="mr-1" /> View
                    </Button>
                    {['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(order.status) && (
                       <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)} className="text-blue-600 hover:text-blue-800">
                        <FaEdit className="mr-1" /> Update Status
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
                                </div>
                              )}
                              
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            Next
          </Button>
                                </div>
                              )}
                              
      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center min-h-full p-4 overflow-y-auto bg-black bg-opacity-50">
            <Card className="w-full max-w-3xl !overflow-visible bg-white rounded-lg shadow-xl" style={{ overflow: 'visible' }}>
              <CardHeader className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b">
                <div>
                  <h2 className="text-xl font-semibold">Order Details: {selectedOrder.id}</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Placed on: {formatDate(selectedOrder.date)} 
                  </p>
                                </div>
              <Button variant="ghost" size="icon" onClick={() => setShowOrderDetails(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimesCircle size={24} />
              </Button>
            </CardHeader>
            <CardContent className="p-6 pb-20 space-y-6">
              {updateError && <Alert variant="destructive" title="Update Error" className="mb-4">{updateError}</Alert>}
              {assignError && <Alert variant="destructive" title="Assignment Error" className="mb-4">{assignError}</Alert>}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="space-y-6 md:col-span-1">
                  <div className="p-4 border rounded-lg shadow-sm">
                    <h4 className="mb-3 text-lg font-semibold text-gray-800">Customer</h4>
                    <p className="mb-1 text-sm"><strong>Name:</strong> {selectedOrder.customer}</p>
                    <p className="mb-1 text-sm"><strong>Email:</strong> {selectedOrder.email}</p>
                    <p className="text-sm"><strong>Phone:</strong> {selectedOrder.phone}</p>
                                </div>

                  <div className="p-4 border rounded-lg shadow-sm">
                    <h4 className="mb-3 text-lg font-semibold text-gray-800">Delivery Address</h4>
                    {typeof selectedOrder.deliveryAddress === 'string' ? (
                      <p className="text-sm text-gray-700">{selectedOrder.deliveryAddress}</p>
                    ) : selectedOrder.deliveryAddress ? (
                      <div className="space-y-1 text-sm">
                        {selectedOrder.deliveryAddress.fullName && <p><strong>Name:</strong> {selectedOrder.deliveryAddress.fullName}</p>}
                        {selectedOrder.deliveryAddress.phone && <p><strong>Phone:</strong> {selectedOrder.deliveryAddress.phone}</p>}
                        {selectedOrder.deliveryAddress.email && <p><strong>Email:</strong> {selectedOrder.deliveryAddress.email}</p>}
                        <p><strong>Address:</strong> {selectedOrder.deliveryAddress.address || 'N/A'}</p>
                        {selectedOrder.deliveryAddress.additionalInfo && <p><strong>Notes:</strong> {selectedOrder.deliveryAddress.additionalInfo}</p>}
                                </div>
                    ) : (
                      <p className="text-sm text-gray-500">Not specified</p>
                              )}
                                </div>
                            </div>

                <div className="space-y-6 md:col-span-2">
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg shadow-sm">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Payment Method</p>
                      <p className="text-base font-semibold">{selectedOrder.paymentMethod || 'N/A'}</p>
                            </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Payment Status</p>
                      <p className="flex items-center text-base font-semibold">
                        <Badge variant={getPaymentStatusBadgeVariant(selectedOrder.paymentStatus)} size="md">{humanizeStatus(selectedOrder.paymentStatus)}</Badge>
                      </p>
                  </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-500">Order Status</p>
                      <p className="text-base font-semibold"><Badge variant={getStatusBadgeVariant(selectedOrder.status)} size="lg">{humanizeStatus(selectedOrder.status)}</Badge></p>
                          </div>
                          </div>

                  <div className="p-4 border rounded-lg shadow-sm">
                    <h4 className="mb-3 text-lg font-semibold text-gray-800">Financials</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>Subtotal:</span> <span>{formatCurrency(selectedOrder.totalPrice)}</span></div>
                      <div className="flex justify-between"><span>Delivery Fee:</span> <span>{formatCurrency(selectedOrder.deliveryFee)}</span></div>
                      <div className="flex justify-between"><span>Tax:</span> <span>{formatCurrency(selectedOrder.tax)}</span></div>
                      {selectedOrder.tip > 0 && <div className="flex justify-between"><span>Tip:</span> <span>{formatCurrency(selectedOrder.tip)}</span></div>}
                      <div className="flex justify-between pt-2 mt-2 text-base font-bold border-t"><span>Grand Total:</span> <span>{formatCurrency(selectedOrder.total)}</span></div>
                          </div>
                          </div>
                          </div>
                        </div>
              
              {selectedOrder.specialInstructions && (
                <div className="p-4 mt-6 border rounded-lg shadow-sm bg-yellow-50">
                  <h4 className="mb-2 text-lg font-semibold text-yellow-800">Special Instructions (Overall Order)</h4>
                  <p className="text-sm text-yellow-700">{selectedOrder.specialInstructions}</p>
                      </div>
              )}

              <div className="mt-6">
                <h4 className="mb-3 text-lg font-semibold text-gray-800">Order Items</h4>
                <div className="overflow-x-auto border rounded-lg shadow-sm">
                  <table className="min-w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-2">Item</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items && selectedOrder.items.map((item, index) => (
                        <React.Fragment key={item.productId || item.name || index}>
                          <tr className="border-b last:border-b-0">
                            <td className="px-4 py-3 font-medium">{item.name}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(item.priceAtOrder || item.price)}</td>
                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 font-medium text-right">{formatCurrency((item.priceAtOrder || item.price) * item.quantity)}</td>
                          </tr>
                          {(item.selectedAddOns && item.selectedAddOns.length > 0 || item.customization?.addedIngredients?.length > 0) && (
                            item.selectedAddOns?.map((addon, idx) => (
                              <tr key={`addon-${index}-${idx}`} className="bg-gray-50">
                                <td className="py-1 pl-8 pr-4 text-xs italic text-gray-600" colSpan="1"> + {addon.name}</td>
                                <td className="px-4 py-1 text-xs text-right text-gray-600">{formatCurrency(addon.price)}</td>
                                <td className="px-4 py-1 text-xs text-center text-gray-600"></td>
                                <td className="px-4 py-1 text-xs text-right text-gray-600">{formatCurrency(addon.price * item.quantity)}</td>
                              </tr>
                            )) ||
                            item.customization?.addedIngredients?.map((ing, idx) => (
                              <tr key={`custom-ing-${index}-${idx}`} className="bg-gray-50">
                                <td className="py-1 pl-8 pr-4 text-xs italic text-gray-600" colSpan="1"> + {ing.name}</td>
                                <td className="px-4 py-1 text-xs text-right text-gray-600">{formatCurrency(ing.price)}</td>
                                <td className="px-4 py-1 text-xs text-center text-gray-600"></td>
                                <td className="px-4 py-1 text-xs text-right text-gray-600">{formatCurrency(ing.price * item.quantity)}</td>
                              </tr>
                            ))
                          )}
                          {item.selectedVariant && (
                             <tr className="bg-gray-50">
                                <td className="py-1 pl-8 pr-4 text-xs italic text-gray-600" colSpan="4">Variant: {item.selectedVariant.name}</td>
                              </tr>
                          )}
                          {item.customization?.specialInstructions && (
                            <tr className="bg-gray-50">
                              <td colSpan="4" className="px-4 py-1 text-xs text-gray-600"><em>Note: {item.customization.specialInstructions}</em></td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                    </div>
                      </div>
                      
              <div className="grid grid-cols-1 gap-6 pt-6 border-t md:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-lg font-semibold">Update Order Status</h4>
                  {updateError && <Alert variant="destructive" title="Status Update Error" className="mb-2">{updateError}</Alert>}
                  {/* Show status update only if transitions are allowed from current status */}
                  {ALLOWED_TRANSITIONS[selectedOrder.status] && ALLOWED_TRANSITIONS[selectedOrder.status].length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Select
                        value={newStatus}
                        onChange={e => setNewStatus(e.target.value)}
                        options={ALLOWED_TRANSITIONS[selectedOrder.status].map(s => ({ value: s, label: humanizeStatus(s) }))}
                        className="flex-grow"
                        placeholder="Select new status"
                        disabled={isUpdatingStatus}
                      />
                      <Button
                        onClick={() => handleUpdateStatus(selectedOrder.originalId)}
                        disabled={!newStatus || isUpdatingStatus}
                        variant="secondary"
                        className="flex items-center whitespace-nowrap"
                      >
                        {isUpdatingStatus ? <Spinner size="sm" className="mr-2" /> : <FaEdit className="mr-1" />}Update Status
                      </Button>
                    </div>
                  )}
                   { (selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'CANCELLED') && <p className="text-sm text-gray-500">Order is {humanizeStatus(selectedOrder.status)}.</p>}
                  </div>
                  
                        <div>
                  <h4 className="mb-3 text-lg font-semibold">Assign Delivery Rider</h4>
                  {assignError && <Alert variant="destructive" title="Assignment Error" className="mb-2">{assignError}</Alert>}
                  {(selectedOrder.status === 'READY' || selectedOrder.status === 'OUT_FOR_DELIVERY') && !selectedOrder.deliveryPersonId && (
                    isLoadingDrivers ? (
                      <div className="flex items-center"><Spinner /></div>
                    ) : (
                      deliveryStaff.filter(staff => staff.status === 'available').length === 0 ? (
                        <Alert variant="warning" size="sm">No delivery staff currently available for assignment.</Alert>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Select
                            value={selectedDeliveryPerson}
                            onChange={e => setSelectedDeliveryPerson(e.target.value)}
                            options={deliveryStaff
                              .filter(staff => staff.status === 'available')
                              .map(staff => ({ value: staff.id, label: staff.name }))}
                            className="flex-grow"
                            placeholder="Select delivery staff..."
                            disabled={isAssigningDelivery}
                          />
                      <Button
                            onClick={() => handleAssignDelivery(selectedOrder.originalId, selectedDeliveryPerson)}
                            disabled={!selectedDeliveryPerson || isAssigningDelivery}
                            variant="secondary"
                            className="flex items-center whitespace-nowrap"
                          >
                            {isAssigningDelivery ? <Spinner size="sm" className="mr-2" /> : <FaMotorcycle className="mr-1" />}Assign Driver
                      </Button>
                    </div>
                      )
                    )
                  )}
                  {selectedOrder.deliveryPersonId && (selectedOrder.status === 'READY' || selectedOrder.status === 'OUT_FOR_DELIVERY') && (
                     <div className="flex items-center gap-3 p-3 text-green-700 rounded-md bg-green-50">
                        <FaMotorcycle size={20} />
                        <div>
                          <p className="text-xs">Assigned To</p>
                          <p className="font-medium">{selectedOrder.deliveryPerson || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                  {selectedOrder.status !== 'READY' && selectedOrder.status !== 'OUT_FOR_DELIVERY' && (
                     <p className="text-sm text-gray-500">Order must be &apos;Ready&apos; or &apos;Out for Delivery&apos; to manage rider assignment.</p>
                  )}
                  {selectedOrder.status === 'OUT_FOR_DELIVERY' && !selectedOrder.deliveryPersonId && (
                    <p className="text-sm text-orange-600">Order is Out for Delivery but no rider is currently assigned.</p>
                    )}
                  </div>
                </div>
            
              {selectedOrder.statusUpdates && selectedOrder.statusUpdates.length > 0 && (
                <div className="pt-6 mt-6 border-t">
                  <h4 className="mb-3 text-lg font-semibold">Order History</h4>
                  <ul className="space-y-2 text-sm">
                    {selectedOrder.statusUpdates.slice().reverse().map((update, index) => (
                      <li key={index} className="flex justify-between p-2 rounded even:bg-gray-50">
                        <span>
                          <strong>{humanizeStatus(update.status)}</strong>
                          {update.updatedBy?.name && ` (by ${update.updatedBy.name})`}
                        </span>
                        <span className="text-gray-500">{formatDate(update.timestamp)}</span>
                    </li>
                  ))}
                </ul>
                </div>
              )}
            </CardContent>
            <CardFooter className="sticky bottom-0 z-10 p-4 bg-white border-t">
              <Button variant="outline" onClick={() => setShowOrderDetails(false)}>Close</Button>
            </CardFooter>
          </Card>
            </div>
      )}
    </div>
  );
};

export default Orders;


