import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaEye, FaLocationArrow, FaRoute, FaMotorcycle } from 'react-icons/fa';
import { Card, Badge, Button, Alert, Spinner, Tabs, TabsList, TabsTrigger } from '../../components/ui';
import { adminAPI } from '../../utils/api';

// Helper to humanize status codes
const humanizeStatus = (status) => status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const itemsPerPage = 10;

  // Fetch deliveries from API
  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching deliveries from API...');
      const response = await adminAPI.getDeliveries();
      if (response.data?.success) {
        const formattedDeliveries = response.data.deliveries.map(delivery => ({
          id: delivery._id,
          orderId: delivery._id,
          customer: delivery.userId?.name || 'Unknown',
          driver: delivery.assignedRider?.name || 'Unassigned',
          restaurant: delivery.restaurantId?.name || 'Unknown',
          status: delivery.status,
          pickupTime: delivery.estimatedDeliveryTime || null,
          deliveryTime: delivery.actualDeliveryTime || null,
          address: typeof delivery.deliveryAddress === 'string'
            ? delivery.deliveryAddress
            : delivery.deliveryAddress?.full || 'No address',
          distance: delivery.distance || 'Unknown',
          earnings: delivery.driverEarnings ? `$${delivery.driverEarnings.toFixed(2)}` : 'Unknown'
        }));
        setDeliveries(formattedDeliveries);
      } else {
        throw new Error(response.data.message || 'Failed to load deliveries');
      }
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setError(err.message);
      setDeliveries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (deliveryId, newStatus) => {
    try {
      // Attempt to call real API
      try {
        const response = await adminAPI.updateDeliveryStatus(deliveryId, newStatus);
        if (response.data?.success) {
          // Update was successful
          console.log('Successfully updated delivery status', response.data);
        }
      } catch (err) {
        console.log('Update API endpoint not available:', err.message);
        // Continue with local state update
      }
      
      // Update local state regardless of API result for demo purposes
      setDeliveries(prevDeliveries => 
        prevDeliveries.map(delivery => 
          delivery.id === deliveryId 
            ? { ...delivery, status: newStatus } 
            : delivery
        )
      );
      
      // If we're updating the currently selected delivery
      if (selectedDelivery && selectedDelivery.id === deliveryId) {
        setSelectedDelivery(prev => ({ ...prev, status: newStatus }));
      }
      
    } catch (error) {
      console.error("Error updating delivery status:", error);
      setError("Failed to update delivery status. Please try again.");
    }
  };

  // Filter deliveries based on search query, status and active tab
  const filteredDeliveries = deliveries.filter(delivery => {
    // Filter by search query
    const matchesSearch = 
      delivery.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      delivery.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.restaurant.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by status
    const matchesStatus = filterStatus === 'all' || delivery.status === filterStatus;
    
    // Filter by tab
    const matchesTab = activeTab === 'all' || delivery.status === activeTab;
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);
  const paginatedDeliveries = filteredDeliveries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // View delivery details
  const handleViewDelivery = (delivery) => {
    setSelectedDelivery(delivery);
    setShowDeliveryDetails(true);
  };

  // Status badge variant based on code
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'DELIVERED': return 'success';
      case 'PREPARING': return 'info';
      case 'READY': return 'primary';
      case 'OUT_FOR_DELIVERY': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Delivery Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Track and manage food deliveries
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
          <TabsTrigger value="all">All Deliveries</TabsTrigger>
          <TabsTrigger value="PREPARING">Preparing</TabsTrigger>
          <TabsTrigger value="READY">Ready</TabsTrigger>
          <TabsTrigger value="OUT_FOR_DELIVERY">Out for Delivery</TabsTrigger>
          <TabsTrigger value="DELIVERED">Delivered</TabsTrigger>
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
              placeholder="Search deliveries..."
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
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Picked Up">Picked Up</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deliveries cards */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Spinner size="lg" />
        </div>
      ) : paginatedDeliveries.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          No deliveries found matching your search criteria
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedDeliveries.map((delivery) => (
            <Card 
              key={delivery.id} 
              className="overflow-hidden dark:bg-gray-800 h-full flex flex-col"
            >
              <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{delivery.id}</h3>
                  <Badge variant={getStatusBadgeVariant(delivery.status)}>
                    {humanizeStatus(delivery.status)}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-start">
                    <FaMotorcycle className="text-gray-500 dark:text-gray-400 mt-1 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{delivery.driver}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Driver</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaRoute className="text-gray-500 dark:text-gray-400 mt-1 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{delivery.restaurant}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Restaurant</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaLocationArrow className="text-gray-500 dark:text-gray-400 mt-1 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{delivery.address.split(',')[0]}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{delivery.distance}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Pickup</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300">{delivery.pickupTime || 'Waiting'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Delivery</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300">{delivery.deliveryTime || 'In Progress'}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Earnings</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{delivery.earnings}</p>
                </div>
                
                <Button variant="outline" size="sm" onClick={() => handleViewDelivery(delivery)}>
                  <FaEye className="mr-1" /> View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-3 mt-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, filteredDeliveries.length)}
            </span>{" "}
            of <span className="font-medium">{filteredDeliveries.length}</span> deliveries
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

      {/* Delivery details modal */}
      {showDeliveryDetails && selectedDelivery && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Card className="max-w-xl mx-auto dark:bg-gray-800 p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Delivery Details</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedDelivery.id}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowDeliveryDetails(false)}>
                Close
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">Order Information</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  <span className="font-medium">Order ID:</span> {selectedDelivery.orderId}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  <span className="font-medium">Customer:</span> {selectedDelivery.customer}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  <span className="font-medium">Restaurant:</span> {selectedDelivery.restaurant}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">Delivery Information</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  <span className="font-medium">Driver:</span> {selectedDelivery.driver}
                </p>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  <Badge variant={getStatusBadgeVariant(selectedDelivery.status)}>
                    {humanizeStatus(selectedDelivery.status)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  <span className="font-medium">Earnings:</span> {selectedDelivery.earnings}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">Delivery Address</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                {selectedDelivery.address}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                <span className="font-medium">Distance:</span> {selectedDelivery.distance}
              </p>
            </div>
            
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">Timeline</h4>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigned</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pickup</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{selectedDelivery.pickupTime || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Delivery</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{selectedDelivery.deliveryTime || '-'}</span>
                </div>
              </div>
            </div>
            
            {/* Status Update */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">Update Status</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={selectedDelivery.status === "Assigned" ? "brand" : "outline"} 
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedDelivery.id, "Assigned")}
                  disabled={selectedDelivery.status === "Assigned"}
                >
                  Assigned
                </Button>
                <Button 
                  variant={selectedDelivery.status === "In Progress" ? "brand" : "outline"} 
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedDelivery.id, "In Progress")}
                  disabled={selectedDelivery.status === "In Progress"}
                >
                  In Progress
                </Button>
                <Button 
                  variant={selectedDelivery.status === "Picked Up" ? "brand" : "outline"} 
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedDelivery.id, "Picked Up")}
                  disabled={selectedDelivery.status === "Picked Up"}
                >
                  Picked Up
                </Button>
                <Button 
                  variant={selectedDelivery.status === "Delivered" ? "brand" : "outline"} 
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedDelivery.id, "Delivered")}
                  disabled={selectedDelivery.status === "Delivered"}
                >
                  Delivered
                </Button>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-wrap justify-end gap-3">
              <Button 
                variant="outline"
              >
                Contact Driver
              </Button>
              <Button 
                variant="outline"
              >
                Track Delivery
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Deliveries; 