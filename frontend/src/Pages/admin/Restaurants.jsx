import { useState, useEffect } from 'react';
import { FaEdit, FaTrashAlt, FaPlus, FaSearch, FaFilter, FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import { adminAPI } from '../../utils/api';
import { Card, Badge, Button, Alert, Spinner, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState(null);
  const itemsPerPage = 8;

  // Fetch restaurants from API
  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real application, replace with actual API call
      // const response = await adminAPI.getRestaurants();
      
      // For demo, we'll use mockup data
      const mockRestaurants = [
        { 
          id: 1, 
          name: 'Fresh Bites', 
          owner: 'Mike Johnson', 
          email: 'mike@freshbites.com', 
          address: '123 Main St, New York, NY',
          phone: '(555) 123-4567',
          status: 'Approved',
          createdAt: '2023-01-12',
          rating: 4.7,
          category: 'Healthy Food'
        },
        { 
          id: 2, 
          name: 'Spice Bazaar', 
          owner: 'Priya Patel', 
          email: 'priya@spicebazaar.com', 
          address: '456 Oak Ave, San Francisco, CA',
          phone: '(555) 234-5678',
          status: 'Approved',
          createdAt: '2023-02-18',
          rating: 4.5,
          category: 'Indian'
        },
        { 
          id: 3, 
          name: 'Green Leaf Cafe', 
          owner: 'Sarah Johnson', 
          email: 'sarah@greenleaf.com', 
          address: '789 Pine St, Seattle, WA',
          phone: '(555) 345-6789',
          status: 'Pending',
          createdAt: '2023-03-25',
          rating: 0,
          category: 'Vegan'
        },
        { 
          id: 4, 
          name: 'Burger House', 
          owner: 'Tom Wilson', 
          email: 'tom@burgerhouse.com', 
          address: '321 Cedar Rd, Chicago, IL',
          phone: '(555) 456-7890',
          status: 'Approved',
          createdAt: '2022-11-10',
          rating: 4.3,
          category: 'Fast Food'
        },
        { 
          id: 5, 
          name: 'Pasta Palace', 
          owner: 'Marco Rossi', 
          email: 'marco@pastapalace.com', 
          address: '654 Maple Dr, Boston, MA',
          phone: '(555) 567-8901',
          status: 'Suspended',
          createdAt: '2022-12-05',
          rating: 3.9,
          category: 'Italian'
        },
        { 
          id: 6, 
          name: 'Sushi Spot', 
          owner: 'Kenji Tanaka', 
          email: 'kenji@sushispot.com', 
          address: '987 Birch Ln, Los Angeles, CA',
          phone: '(555) 678-9012',
          status: 'Approved',
          createdAt: '2023-01-30',
          rating: 4.8,
          category: 'Japanese'
        },
        { 
          id: 7, 
          name: 'Taco Truck', 
          owner: 'Carlos Mendez', 
          email: 'carlos@tacotruck.com', 
          address: '159 Elm St, Austin, TX',
          phone: '(555) 789-0123',
          status: 'Pending',
          createdAt: '2023-04-15',
          rating: 0,
          category: 'Mexican'
        },
        { 
          id: 8, 
          name: 'Pho House', 
          owner: 'Linh Nguyen', 
          email: 'linh@phohouse.com', 
          address: '753 Aspen Ave, Denver, CO',
          phone: '(555) 890-1234',
          status: 'Approved',
          createdAt: '2023-02-08',
          rating: 4.6,
          category: 'Vietnamese'
        },
        { 
          id: 9, 
          name: 'Mediterranean Delight', 
          owner: 'Nikos Papadopoulos', 
          email: 'nikos@meddelight.com', 
          address: '852 Walnut St, Miami, FL',
          phone: '(555) 901-2345',
          status: 'Approved',
          createdAt: '2023-03-12',
          rating: 4.4,
          category: 'Mediterranean'
        },
        { 
          id: 10, 
          name: 'The Steakhouse', 
          owner: 'Robert Smith', 
          email: 'robert@steakhouse.com', 
          address: '369 Oak St, Dallas, TX',
          phone: '(555) 012-3456',
          status: 'Rejected',
          createdAt: '2023-02-25',
          rating: 0,
          category: 'Steakhouse'
        }
      ];
      
      setTimeout(() => {
        setRestaurants(mockRestaurants);
        setIsLoading(false);
      }, 600);
      
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      setError("Failed to load restaurants. Please try again.");
      setIsLoading(false);
    }
  };

  // Filter restaurants based on search query, status and active tab
  const filteredRestaurants = restaurants.filter(restaurant => {
    // Filter by search query
    const matchesSearch = 
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      restaurant.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by status
    const matchesStatus = filterStatus === 'all' || restaurant.status === filterStatus;
    
    // Filter by tab
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'pending' && restaurant.status === 'Pending') ||
      (activeTab === 'approved' && restaurant.status === 'Approved') ||
      (activeTab === 'rejected' && (restaurant.status === 'Rejected' || restaurant.status === 'Suspended'));
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRestaurants.length / itemsPerPage);
  const paginatedRestaurants = filteredRestaurants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle restaurant actions
  const handleEditRestaurant = (restaurant) => {
    console.log('Edit restaurant:', restaurant);
    // Implement edit functionality
  };

  const confirmDeleteRestaurant = (restaurant) => {
    setRestaurantToDelete(restaurant);
    setShowDeleteModal(true);
  };

  const handleDeleteRestaurant = async () => {
    try {
      // In real app: await adminAPI.deleteRestaurant(restaurantToDelete.id);
      setRestaurants(restaurants.filter(r => r.id !== restaurantToDelete.id));
      setShowDeleteModal(false);
      setRestaurantToDelete(null);
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      // Show error notification
    }
  };

  const handleApproveRestaurant = async (restaurant) => {
    try {
      // In real app: await adminAPI.approveRestaurant(restaurant.id);
      setRestaurants(
        restaurants.map(r => 
          r.id === restaurant.id ? { ...r, status: 'Approved' } : r
        )
      );
    } catch (error) {
      console.error("Error approving restaurant:", error);
      // Show error notification
    }
  };

  const handleRejectRestaurant = async (restaurant) => {
    try {
      // In real app: await adminAPI.rejectRestaurant(restaurant.id);
      setRestaurants(
        restaurants.map(r => 
          r.id === restaurant.id ? { ...r, status: 'Rejected' } : r
        )
      );
    } catch (error) {
      console.error("Error rejecting restaurant:", error);
      // Show error notification
    }
  };

  const getBadgeVariant = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'danger';
      case 'Suspended': return 'info';
      default: return 'default';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Restaurant Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          View and manage restaurant listings
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
          <TabsTrigger value="all">All Restaurants</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected/Suspended</TabsTrigger>
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
              placeholder="Search restaurants..."
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
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Add restaurant button */}
        <Button className="flex items-center">
          <FaPlus className="mr-2" />
          Add Restaurant
        </Button>
      </div>

      {/* Restaurants list */}
      <div>
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Spinner size="lg" color="primary" />
          </div>
        ) : paginatedRestaurants.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            No restaurants found matching your search criteria
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedRestaurants.map((restaurant) => (
              <Card key={restaurant.id} className="overflow-hidden dark:bg-gray-800 h-full flex flex-col">
                <div className="p-4 flex-grow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{restaurant.name}</h3>
                    <Badge variant={getBadgeVariant(restaurant.status)}>
                      {restaurant.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <strong>Owner:</strong> {restaurant.owner}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <strong>Email:</strong> {restaurant.email}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <strong>Phone:</strong> {restaurant.phone}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <strong>Category:</strong> {restaurant.category}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <strong>Added:</strong> {restaurant.createdAt}
                  </p>
                  
                  {restaurant.rating > 0 && (
                    <div className="mt-2 flex items-center">
                      <div className="text-amber-400 flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg 
                            key={i} 
                            className={`w-4 h-4 ${i < Math.floor(restaurant.rating) ? 'text-amber-400 fill-current' : 'text-gray-300 dark:text-gray-600 fill-current'}`} 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-1 text-sm font-medium text-gray-600 dark:text-gray-400">{restaurant.rating}</span>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="text-blue-600" asChild>
                        <a href={`/admin/restaurant/${restaurant.id}`} target="_blank">
                          <FaEye className="mr-1" /> View
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditRestaurant(restaurant)}>
                        <FaEdit className="mr-1" /> Edit
                      </Button>
                    </div>
                    
                    {restaurant.status === 'Pending' && (
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          onClick={() => handleApproveRestaurant(restaurant)}
                        >
                          <FaCheck className="mr-1" /> Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleRejectRestaurant(restaurant)}
                        >
                          <FaTimes className="mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                    
                    {restaurant.status !== 'Pending' && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => confirmDeleteRestaurant(restaurant)}
                      >
                        <FaTrashAlt className="mr-1" /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-between items-center mt-8">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, filteredRestaurants.length)}
            </span>{" "}
            of <span className="font-medium">{filteredRestaurants.length}</span> restaurants
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

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Card className="max-w-md mx-auto dark:bg-gray-800 p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete the restaurant &quot;{restaurantToDelete?.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteRestaurant}
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Restaurants; 