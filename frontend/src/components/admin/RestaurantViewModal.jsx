import { useState, useEffect, useCallback } from 'react'; // Add hooks
import PropTypes from 'prop-types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogClose 
} from '@/components/ui/dialog'; // Assuming shadcn dialog path
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // For image
import { Spinner } from '@/components/ui/spinner'; // Add Spinner
import { Alert } from '@/components/ui/alert'; // Add Alert
import { adminAPI } from '../../utils/api'; // Add adminAPI
import { getFullImageUrl, PLACEHOLDERS } from '../../utils/imageUtils';

// Helper to safely get nested properties (can be shared)
const getNested = (obj, path, defaultValue = '') => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) ?? defaultValue;
};

const RestaurantViewModal = ({ isOpen, onClose, restaurantId }) => { // Receive ID instead of object
  const [restaurantData, setRestaurantData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRestaurantDetails = useCallback(async () => {
    if (!restaurantId || !isOpen) return;
    console.log(`ViewModal: Fetching details for ${restaurantId}`);
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getRestaurantById(restaurantId);
      if (response.data?.success && response.data.restaurant) {
        setRestaurantData(response.data.restaurant);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch restaurant details');
      }
    } catch (err) {
      console.error("Error fetching restaurant details for view:", err);
      setError(err.message || 'Could not load restaurant details.');
      setRestaurantData(null); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchRestaurantDetails();
    } else {
      // Clear data when modal closes
      setRestaurantData(null);
      setError(null);
    }
  }, [isOpen, fetchRestaurantDetails]);

  // Function to get badge variant based on status
  const getBadgeVariant = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'approved') return 'success';
    if (statusLower === 'pending_approval') return 'warning'; 
    if (statusLower === 'rejected') return 'destructive';
    if (statusLower === 'deleted') return 'outline'; 
    return 'secondary';
  };
  
  // Format status display
  const formatStatusDisplay = (status) => {
    if (!status) return 'N/A';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
  };

  // Prepare display values from fetched data
  const displayData = restaurantData ? {
      name: getNested(restaurantData, 'name', 'N/A'),
      logo: getFullImageUrl(getNested(restaurantData, 'logo'), PLACEHOLDERS.RESTAURANT),
      status: getNested(restaurantData, 'status', 'Unknown'),
      ownerName: getNested(restaurantData, 'owner.name', 'N/A'), // Access populated owner name
      ownerEmail: getNested(restaurantData, 'owner.email', 'N/A'), // Access populated owner email
      email: getNested(restaurantData, 'contactInfo.email', 'N/A'),
      phone: getNested(restaurantData, 'contactInfo.phone', 'N/A'),
      website: getNested(restaurantData, 'contactInfo.website', 'N/A'),
      address: [
          getNested(restaurantData, 'address.street'),
          getNested(restaurantData, 'address.city'),
          getNested(restaurantData, 'address.state'),
          getNested(restaurantData, 'address.zipCode'),
          getNested(restaurantData, 'address.country')
      ].filter(Boolean).join(', ') || 'N/A',
      cuisine: Array.isArray(restaurantData.cuisine) ? restaurantData.cuisine.join(', ') : 'N/A',
      joined: restaurantData.createdAt ? new Date(restaurantData.createdAt).toLocaleDateString() : 'N/A',
      rating: getNested(restaurantData, 'rating') ? Number(restaurantData.rating).toFixed(1) : 'N/A',
      panNumber: getNested(restaurantData, 'panNumber', 'N/A'),
  } : {}; // Empty object if no data

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          {/* Update title based on fetched data */}
          <DialogTitle className="text-xl font-bold">Restaurant Details: {isLoading ? 'Loading...' : (displayData.name || 'N/A')}</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Viewing information for {isLoading ? '...' : (displayData.name || 'the restaurant')}.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Spinner size="large"/></div>
        ) : error ? (
          <Alert variant="destructive" className="my-2">{error}</Alert>
        ) : restaurantData ? (
          <div className="grid gap-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <div className="flex flex-col items-center mb-4">
              <Avatar className="w-24 h-24 mb-2 border-2 border-gray-200 shadow-sm">
                <AvatarImage src={displayData.logo} alt={`${displayData.name} Logo`} />
                <AvatarFallback className="text-2xl font-bold">{displayData.name?.charAt(0) || 'R'}</AvatarFallback> 
              </Avatar>
              <Badge variant={getBadgeVariant(displayData.status)} className="mt-2 px-3 py-1 text-sm">
                {formatStatusDisplay(displayData.status)}
              </Badge>
            </div>
            
            {/* Restaurant Information - Grouped by sections */} 
            <div className="space-y-4">
              {/* Owner Information */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                <h3 className="font-semibold text-md mb-2 border-b pb-1">Owner Information</h3>
                <div className="grid grid-cols-3 gap-y-2">
                  <span className="font-medium text-right text-gray-600 dark:text-gray-300">Name</span>
                  <span className="col-span-2 pl-3">{displayData.ownerName}</span>
                  
                  <span className="font-medium text-right text-gray-600 dark:text-gray-300">Email</span>
                  <span className="col-span-2 pl-3">{displayData.ownerEmail}</span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                <h3 className="font-semibold text-md mb-2 border-b pb-1">Contact Information</h3>
                <div className="grid grid-cols-3 gap-y-2">
                  <span className="font-medium text-right text-gray-600 dark:text-gray-300">Email</span>
                  <span className="col-span-2 pl-3">{displayData.email}</span>

                  <span className="font-medium text-right text-gray-600 dark:text-gray-300">Phone</span>
                  <span className="col-span-2 pl-3">{displayData.phone}</span>
                  
                  <span className="font-medium text-right text-gray-600 dark:text-gray-300">Website</span>
                  <span className="col-span-2 pl-3">
                    {displayData.website ? 
                      <a href={displayData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{displayData.website}</a> 
                      : 'N/A'}
                  </span>

                  <span className="font-medium text-right text-gray-600 dark:text-gray-300">Address</span>
                  <span className="col-span-2 pl-3">{displayData.address}</span>
                </div>
              </div>

              {/* Restaurant Details */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                <h3 className="font-semibold text-md mb-2 border-b pb-1">Restaurant Details</h3>
                <div className="grid grid-cols-3 gap-y-2">
                  <span className="font-medium text-right text-gray-600 dark:text-gray-300">Cuisine</span>
                  <span className="col-span-2 pl-3">{displayData.cuisine}</span>
                  
                  <span className="font-medium text-right text-gray-600 dark:text-gray-300">PAN</span>
                  <span className="col-span-2 pl-3">{displayData.panNumber}</span>

                  <span className="font-medium text-right text-gray-600 dark:text-gray-300">Joined</span>
                  <span className="col-span-2 pl-3">{displayData.joined}</span>

                  <span className="font-medium text-right text-gray-600 dark:text-gray-300">Avg. Rating</span>
                  <span className="col-span-2 pl-3">{displayData.rating}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Alert variant="default">No details found for this restaurant.</Alert> // Fallback if no data and no error
        )}
        
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="w-full sm:w-auto">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

RestaurantViewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  restaurantId: PropTypes.string.isRequired, // Now requires ID
};

export default RestaurantViewModal; 