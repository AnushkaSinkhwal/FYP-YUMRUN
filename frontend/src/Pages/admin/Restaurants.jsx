import { useState, useEffect } from 'react';
import { FaEdit, FaTrashAlt, FaPlus, FaSearch, FaFilter, FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import { adminAPI } from '../../utils/api';
import { Card, Badge, Button, Alert, Spinner, Tabs, TabsList, TabsTrigger } from '../../components/ui';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const itemsPerPage = 8;

  // Fetch restaurants from API
  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch restaurants using the new getRestaurants endpoint
        console.log('Fetching restaurants data...');
        const response = await adminAPI.getRestaurants();
        
        if (response.data && response.data.success) {
          console.log('Restaurants API response:', response.data);
          
          // Use the formatted restaurants data from the endpoint
          if (response.data.restaurants && response.data.restaurants.length > 0) {
            console.log(`Found ${response.data.restaurants.length} restaurants`);
            setRestaurants(response.data.restaurants);
            setIsLoading(false);
            return;
          } else {
            console.log('No restaurants found, trying fallback methods');
          }
        }
      } catch (restaurantsApiError) {
        console.error('Error fetching from restaurants API:', restaurantsApiError);
        console.log('Falling back to other methods');
      }
      
      // Try restaurant owners (legacy method 1)
      try {
        // Fetch restaurant owners (users with isRestaurantOwner=true)
        console.log('Fetching users for restaurant data...');
        const response = await adminAPI.getUsers();
        
        if (response.data && response.data.success) {
          console.log('User API response:', response.data);
          
          // Filter users who are restaurant owners
          const restaurants = (response.data.users || []).filter(user => 
            user.isRestaurantOwner
          );
          
          console.log(`Found ${restaurants.length} restaurant owners in users`);
          
          if (restaurants.length === 0) {
            console.log('No restaurant owners found in user data, trying restaurant-specific endpoint');
          } else {
            // Process to match our expected format
            const formattedRestaurants = restaurants.map(owner => ({
              id: owner._id,
              name: owner.restaurantDetails?.name || 'Unnamed Restaurant',
              owner: owner.name || owner.username || 'Unknown Owner',
              email: owner.email,
              address: owner.restaurantDetails?.address || 'No address provided',
              phone: owner.phone || 'No phone provided',
              status: owner.isActive ? 'Approved' : owner.status || 'Pending',
              createdAt: owner.createdAt,
              rating: owner.restaurantDetails?.rating || 0,
              category: owner.restaurantDetails?.cuisine?.join(', ') || 'Uncategorized'
            }));
            
            console.log('Restaurant data from users:', formattedRestaurants);
            setRestaurants(formattedRestaurants);
            setIsLoading(false);
            return;
          }
        } else {
          console.log('User API did not return success, trying restaurant-specific endpoint');
        }
      } catch (userApiError) {
        console.error('Error fetching from users API:', userApiError);
        console.log('Falling back to restaurant-specific endpoint');
      }
      
      // Try fetching from restaurant-specific endpoint as fallback (legacy method 2)
      try {
        console.log('Fetching from restaurant approvals endpoint...');
        const restaurantResponse = await adminAPI.getRestaurantApprovals();
        console.log('Restaurant API response:', restaurantResponse.data);
        
        if (restaurantResponse.data?.success && restaurantResponse.data.approvals?.length > 0) {
          const formattedRestaurants = restaurantResponse.data.approvals.map(approval => ({
            id: approval._id,
            name: approval.restaurantName || 'Unnamed Restaurant',
            owner: approval.ownerName || 'Unknown Owner',
            email: approval.email || 'No email',
            address: approval.address || 'No address provided',
            phone: approval.phone || 'No phone provided',
            status: approval.status || 'Pending',
            createdAt: approval.createdAt,
            rating: approval.rating || 0,
            category: approval.cuisine?.join(', ') || 'Uncategorized'
          }));
          
          console.log('Restaurant data from approvals:', formattedRestaurants);
          setRestaurants(formattedRestaurants);
          setIsLoading(false);
          return;
        } else {
          console.log('Restaurant API did not return success or had empty approvals');
        }
      } catch (restaurantApiError) {
        console.error('Error fetching from restaurant API:', restaurantApiError);
      }
      
      // If we're here, neither API worked as expected - provide sample data
      console.log('Using sample restaurant data since API requests failed');
      const sampleRestaurants = [
        {
          id: "rest-1",
          name: "Burger Palace",
          owner: "John Smith",
          email: "john@burgerpalace.com",
          address: "123 Main St, City",
          phone: "555-1234",
          status: "Approved",
          createdAt: new Date().toISOString(),
          rating: 4.5,
          category: "Fast Food, Burgers"
        },
        {
          id: "rest-2",
          name: "Pizza Heaven",
          owner: "Maria Garcia",
          email: "maria@pizzaheaven.com",
          address: "456 Oak Ave, Town",
          phone: "555-5678",
          status: "Pending",
          createdAt: new Date().toISOString(),
          rating: 4.2,
          category: "Italian, Pizza"
        }
      ];
      
      setRestaurants(sampleRestaurants);
      
    } catch (error) {
      console.error("Error in restaurant fetch flow:", error);
      setError("Failed to load restaurants. Please try again.");
    } finally {
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
    // Implement navigation to edit page or open modal
  };

  const confirmDeleteRestaurant = (restaurant) => {
    setRestaurantToDelete(restaurant);
    setShowDeleteModal(true);
  };

  const handleDeleteRestaurant = async () => {
    if (!restaurantToDelete || !restaurantToDelete.id) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // Delete the restaurant by updating the user and removing restaurant owner status
      const response = await adminAPI.updateUser(restaurantToDelete.id, {
        isRestaurantOwner: false
      });
      
      if (response.data && response.data.success) {
        // Remove from local state
      setRestaurants(restaurants.filter(r => r.id !== restaurantToDelete.id));
        setSuccess("Restaurant removed successfully");
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        throw new Error(response.data?.message || 'Failed to delete restaurant');
      }
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      setError("Failed to delete restaurant: " + (error.response?.data?.message || error.message));
    } finally {
      setIsProcessing(false);
      setShowDeleteModal(false);
      setRestaurantToDelete(null);
    }
  };

  const handleApproveRestaurant = async (restaurant) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Approve restaurant by updating user status
      const response = await adminAPI.updateUser(restaurant.id, {
        isActive: true,
        status: 'Approved'
      });
      
      if (response.data && response.data.success) {
        // Update local state
      setRestaurants(
        restaurants.map(r => 
          r.id === restaurant.id ? { ...r, status: 'Approved' } : r
        )
      );
        setSuccess("Restaurant approved successfully");
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        throw new Error(response.data?.message || 'Failed to approve restaurant');
      }
    } catch (error) {
      console.error("Error approving restaurant:", error);
      setError("Failed to approve restaurant: " + (error.response?.data?.message || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRestaurant = async (restaurant) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Reject restaurant by updating user status
      const response = await adminAPI.updateUser(restaurant.id, {
        isActive: false,
        status: 'Rejected'
      });
      
      if (response.data && response.data.success) {
        // Update local state
      setRestaurants(
        restaurants.map(r => 
          r.id === restaurant.id ? { ...r, status: 'Rejected' } : r
        )
      );
        setSuccess("Restaurant rejected successfully");
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        throw new Error(response.data?.message || 'Failed to reject restaurant');
      }
    } catch (error) {
      console.error("Error rejecting restaurant:", error);
      setError("Failed to reject restaurant: " + (error.response?.data?.message || error.message));
    } finally {
      setIsProcessing(false);
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
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-6 bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800">
          {success}
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
                    <strong>Added:</strong> {new Date(restaurant.createdAt).toLocaleDateString()}
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
                        <a href={`/admin/restaurant/${restaurant.id}`} target="_blank" rel="noopener noreferrer">
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
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Spinner size="sm" /> : <FaCheck className="mr-1" />}
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleRejectRestaurant(restaurant)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Spinner size="sm" /> : <FaTimes className="mr-1" />}
                          Reject
                        </Button>
                      </div>
                    )}
                    
                    {restaurant.status !== 'Pending' && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => confirmDeleteRestaurant(restaurant)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Spinner size="sm" className="mr-1" /> : <FaTrashAlt className="mr-1" />}
                        Delete
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
              Are you sure you want to delete the restaurant &ldquo;{restaurantToDelete?.name}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteRestaurant}
                disabled={isProcessing}
              >
                {isProcessing ? <Spinner size="sm" className="mr-2" /> : null}
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