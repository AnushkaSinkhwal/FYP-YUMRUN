import { useState, useEffect } from 'react';
import { userAPI } from '../../utils/api';
import { Alert, Card, Spinner } from '../ui';

/**
 * Component to display pending profile changes for restaurant owners
 */
const PendingChanges = () => {
  const [pendingChanges, setPendingChanges] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPendingChanges = async () => {
      try {
        setIsLoading(true);
        const response = await userAPI.getProfileChangeStatus();
        
        if (response.data.success) {
          setPendingChanges(response.data.pendingChanges);
        }
      } catch (error) {
        console.error('Error fetching pending changes:', error);
        setError('Failed to load pending changes');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPendingChanges();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size="md" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="error" className="mb-6">
        {error}
      </Alert>
    );
  }
  
  if (!pendingChanges || Object.keys(pendingChanges).length === 0) {
    return null;
  }
  
  return (
    <Card className="mb-6 border-orange-400 border">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-orange-600">
          Pending Profile Changes
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Your profile changes are awaiting admin approval. Here&apos;s what you&apos;ve requested to change:
        </p>
        
        <div className="space-y-2">
          {pendingChanges.name && (
            <div className="flex">
              <span className="font-medium w-32">Name:</span>
              <span>{pendingChanges.name}</span>
            </div>
          )}
          
          {pendingChanges.email && (
            <div className="flex">
              <span className="font-medium w-32">Email:</span>
              <span>{pendingChanges.email}</span>
            </div>
          )}
          
          {pendingChanges.phone && (
            <div className="flex">
              <span className="font-medium w-32">Phone:</span>
              <span>{pendingChanges.phone}</span>
            </div>
          )}
          
          {pendingChanges.restaurantDetails && (
            <>
              {pendingChanges.restaurantDetails.name && (
                <div className="flex">
                  <span className="font-medium w-32">Restaurant Name:</span>
                  <span>{pendingChanges.restaurantDetails.name}</span>
                </div>
              )}
              
              {pendingChanges.restaurantDetails.address && (
                <div className="flex">
                  <span className="font-medium w-32">Address:</span>
                  <span>{pendingChanges.restaurantDetails.address}</span>
                </div>
              )}
              
              {pendingChanges.restaurantDetails.description && (
                <div className="flex">
                  <span className="font-medium w-32">Description:</span>
                  <span>{pendingChanges.restaurantDetails.description}</span>
                </div>
              )}
              
              {pendingChanges.restaurantDetails.cuisineType && (
                <div className="flex">
                  <span className="font-medium w-32">Cuisine Type:</span>
                  <span>{pendingChanges.restaurantDetails.cuisineType}</span>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Changes will be applied after admin approval. You&apos;ll be notified once processed.
        </div>
      </div>
    </Card>
  );
};

export default PendingChanges; 