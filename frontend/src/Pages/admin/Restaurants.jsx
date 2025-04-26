import { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrashAlt, FaPlus, FaSearch, FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import { adminAPI } from '../../utils/api';
import { Card, Badge, Button, Alert, Spinner, Tabs, TabsList, TabsTrigger, Input } from '../../components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getFullImageUrl, PLACEHOLDERS } from '../../utils/imageUtils';
import RestaurantViewModal from '../../components/admin/RestaurantViewModal';
import RestaurantEditModal from '../../components/admin/RestaurantEditModal';

const ITEMS_PER_PAGE = 8;

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddRestaurantModal, setShowAddRestaurantModal] = useState(false);
  
  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      console.log('Fetching restaurants data...');
      const response = await adminAPI.getRestaurants();
      if (response.data?.success) {
        console.log(`Found ${response.data.restaurants.length} restaurants`);
        setRestaurants(response.data.restaurants || []);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch restaurants');
      }
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      setError(err.message || "Failed to load restaurants. Please try again.");
      setRestaurants([]); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const filteredRestaurants = restaurants.filter(restaurant => {
    const lowerSearch = searchQuery.toLowerCase();
    const matchesSearch = 
      (restaurant.name || '').toLowerCase().includes(lowerSearch) || 
      (restaurant.ownerName || '').toLowerCase().includes(lowerSearch) ||
      (restaurant.email || '').toLowerCase().includes(lowerSearch) ||
      (restaurant.cuisine || '').toLowerCase().includes(lowerSearch);
    
    const backendStatus = restaurant.status;
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'pending_approval' && backendStatus === 'pending_approval') ||
      (activeTab === 'approved' && backendStatus === 'approved') ||
      (activeTab === 'rejected' && backendStatus === 'rejected') ||
      (activeTab === 'deleted' && backendStatus === 'deleted');
    
    return matchesSearch && matchesTab;
  });

  const totalPages = Math.ceil(filteredRestaurants.length / ITEMS_PER_PAGE);
  const paginatedRestaurants = filteredRestaurants.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAction = useCallback(async (action, restaurantId, data = {}) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    let successMessage = '';
    try {
      switch (action) {
        case 'delete':
          await adminAPI.updateRestaurantStatus(restaurantId, { status: 'deleted', reason: data.reason || 'Deleted by admin' });
          successMessage = 'Restaurant successfully marked as deleted.';
          break;
        case 'approve':
          await adminAPI.updateRestaurantStatus(restaurantId, { status: 'approved' });
          successMessage = 'Restaurant successfully approved.';
          break;
        case 'reject':
          await adminAPI.updateRestaurantStatus(restaurantId, { status: 'rejected', reason: data.reason || 'Rejected by admin' });
          successMessage = 'Restaurant successfully rejected.';
          break;
        default:
          throw new Error('Invalid action');
      }
      setSuccess(successMessage);
      fetchRestaurants();
    } catch (err) {
      console.error(`Error performing action ${action}:`, err);
      setError(err.response?.data?.message || err.message || `Failed to ${action} restaurant.`);
    } finally {
      setIsProcessing(false);
      setShowDeleteModal(false);
      setSelectedRestaurant(null);
    }
  }, [fetchRestaurants]);

  const confirmDeleteRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedRestaurant) {
      handleAction('delete', selectedRestaurant.id);
    }
  };
  
  const handleApproveRestaurant = (restaurant) => {
    handleAction('approve', restaurant.id);
  };

  const handleRejectRestaurant = (restaurant) => {
    handleAction('reject', restaurant.id, { reason: 'Rejected via admin panel' });
  };

  const openViewModal = (restaurant) => {
    console.log('Opening View Modal for:', restaurant?.id, restaurant?.name);
    if (!restaurant) {
      console.error("Cannot open View Modal: restaurant data is missing.");
      setError("Could not load details for the selected restaurant.");
      return;
    }
    setSelectedRestaurant(restaurant);
    setShowViewModal(true);
    console.log('showViewModal state should now be true');
  };

  const openEditModal = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowEditModal(true);
  };

  const openAddRestaurantModal = () => {
    setSelectedRestaurant(null);
    setShowAddRestaurantModal(true);
  };

  const handleModalClose = () => {
    console.log('Closing modals, resetting selectedRestaurant');
    setShowViewModal(false);
    setShowEditModal(false);
    setShowAddRestaurantModal(false);
    setSelectedRestaurant(null);
  };

  const handleSave = () => {
    handleModalClose();
    setSuccess('Restaurant details saved successfully.');
    fetchRestaurants();
  };

  const getBadgeVariant = (status) => {
    const statusLower = status;
    if (statusLower === 'approved') return 'success';
    if (statusLower === 'pending_approval') return 'warning';
    if (statusLower === 'rejected') return 'destructive';
    if (statusLower === 'deleted') return 'outline';
    return 'secondary';
  };

  const formatStatusDisplay = (status) => {
    if (!status) return 'N/A';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="container p-4 mx-auto md:p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">Restaurant Management</h1>

      {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}
      {success && <Alert variant="success" className="mb-4">{success}</Alert>}

      <div className="flex flex-col items-center justify-between gap-4 mb-6 md:flex-row">
        <div className="relative w-full md:w-1/3">
          <Input 
            type="text"
            placeholder="Search by name, owner, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
        </div>
        
        <Button onClick={openAddRestaurantModal} className="w-full md:w-auto">
          <FaPlus className="mr-2" /> Add Restaurant
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {setActiveTab(value); setCurrentPage(1);}} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="pending_approval">Pending Approval</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="deleted">Deleted</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="large" />
        </div>
      ) : paginatedRestaurants.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">No restaurants found matching your criteria.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
          {paginatedRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="overflow-hidden transition-shadow duration-300 shadow-lg hover:shadow-xl">
              <img 
                src={
                  restaurant.coverImage 
                    ? getFullImageUrl(restaurant.coverImage, PLACEHOLDERS.RESTAURANT)
                    : getFullImageUrl(restaurant.logo, PLACEHOLDERS.RESTAURANT)
                } 
                alt={`${restaurant.name}`} 
                className="object-cover w-full h-40" 
              />
              <div className="p-4">
                <h3 className="mb-1 text-lg font-semibold truncate">{restaurant.name}</h3>
                <p className="mb-1 text-sm text-gray-600 truncate">Owner: {restaurant.ownerName}</p>
                <p className="mb-2 text-sm text-gray-600 truncate">Email: {restaurant.email}</p>
                <div className="flex items-center mb-3 space-x-2">
                  <Badge variant={getBadgeVariant(restaurant.status)}>
                    {formatStatusDisplay(restaurant.status)}
                  </Badge>
                  {restaurant.status === 'approved' && restaurant.hasPendingUpdate && (
                    <Badge variant="warning" title="This restaurant has submitted changes that require your review.">
                      Pending Changes
                    </Badge>
                  )}
                </div>
                
                <div className="flex justify-end mt-2 space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openViewModal(restaurant)} aria-label="View" disabled={isProcessing}>
                    <FaEye />
                  </Button>
                  {restaurant.status !== 'deleted' && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => openEditModal(restaurant)} aria-label="Edit" disabled={isProcessing}>
                        <FaEdit />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => confirmDeleteRestaurant(restaurant)} aria-label="Delete" disabled={isProcessing}>
                        <FaTrashAlt />
                      </Button>
                    </>
                  )}
                  {restaurant.status === 'deleted' && (
                     <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleApproveRestaurant(restaurant)}
                        disabled={isProcessing}
                        aria-label="Restore"
                      > 
                        {isProcessing ? <Spinner size="small" className="mr-1" /> : <FaCheck className="mr-1 text-green-600" />} Restore
                      </Button>
                  )}
                </div>
                
                {restaurant.status === 'pending_approval' && (
                    <div className="flex justify-end pt-2 mt-2 space-x-2 border-t">
                         <Button 
                            variant="success" 
                            size="sm" 
                            onClick={() => handleApproveRestaurant(restaurant)}
                            disabled={isProcessing}
                        > 
                             {isProcessing ? <Spinner size="small" className="mr-1" /> : <FaCheck className="mr-1" />} Approve
                         </Button>
                         <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleRejectRestaurant(restaurant)} 
                            disabled={isProcessing}
                        >
                             {isProcessing ? <Spinner size="small" className="mr-1" /> : <FaTimes className="mr-1" />} Reject
                         </Button>
                    </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
         <div className="flex justify-center mt-8">
           <Button 
             variant="outline" 
             onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
             disabled={currentPage === 1}
             className="mr-2"
           >
             Previous
           </Button>
           <span className="px-4 py-2">Page {currentPage} of {totalPages}</span>
           <Button 
             variant="outline" 
             onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
             disabled={currentPage === totalPages}
             className="ml-2"
           >
             Next
           </Button>
         </div>
      )}

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Confirm Deletion</DialogTitle>
             <DialogDescription>
               Are you sure you want to delete the restaurant &quot;{selectedRestaurant?.name}&quot;? This action will mark the restaurant as deleted and prevent the owner from logging in. This cannot be easily undone.
             </DialogDescription>
           </DialogHeader>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
             <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isProcessing}>
               {isProcessing ? <Spinner size="small" className="mr-2" /> : null} Delete
             </Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>

      {showViewModal && selectedRestaurant && (
        <RestaurantViewModal 
          restaurantId={selectedRestaurant.id} 
          isOpen={showViewModal} 
          onClose={handleModalClose}
        />
      )}

      {showEditModal && selectedRestaurant && (
         <RestaurantEditModal 
           restaurantId={selectedRestaurant.id}
           isOpen={showEditModal}
           onClose={handleModalClose}
           onSave={handleSave}
         />
      )}
      
      {showAddRestaurantModal && (
         <RestaurantEditModal 
           restaurantId={null} 
           isOpen={showAddRestaurantModal}
           onClose={handleModalClose}
           onSave={handleSave}
         />
      )}

    </div>
  );
};

export default Restaurants; 