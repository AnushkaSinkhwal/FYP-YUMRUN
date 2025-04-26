import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, 
  DialogFooter, DialogClose 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { adminAPI } from '../../utils/api';

// Helper to safely get nested properties
const getNested = (obj, path, defaultValue = '') => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) ?? defaultValue;
};

// --- Initial Form Data Structure (Aligned with Restaurant Profile) ---
const getInitialFormData = (data = {}) => ({
  // Restaurant Info
  name: getNested(data, 'name'), 
  description: getNested(data, 'description'),
  // Address: Use a single string for simplicity in admin edit for now
  // If backend expects object, we'll convert on submit
  address: getNested(data, 'address.street') || getNested(data, 'address.full') || getNested(data, 'address.formatted') || '', 
  phone: getNested(data, 'contactInfo.phone'), // Assuming this is the restaurant's contact phone

  // Business Settings
  isOpen: getNested(data, 'isOpen', true), // Default to true
  deliveryRadius: getNested(data, 'deliveryRadius', 5), // Default to 5
  minimumOrder: getNested(data, 'minimumOrder', 0), // Default to 0
  deliveryFee: getNested(data, 'deliveryFee', 0), // Default to 0

  // Opening Hours (Basic structure, can be enhanced later)
  openingHours: getNested(data, 'openingHours', {
      monday: { open: '09:00', close: '22:00' },
      tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' },
      thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '22:00' },
      saturday: { open: '10:00', close: '23:00' },
      sunday: { open: '10:00', close: '22:00' }
  }),
  
  // Other fields potentially needed or viewable
  cuisine: Array.isArray(data.cuisine) ? data.cuisine.join(', ') : (getNested(data, 'cuisine') || ''), 
  priceRange: getNested(data, 'priceRange', '$$'),
  panNumber: getNested(data, 'panNumber'), // Non-editable usually
  status: getNested(data, 'status'), // Non-editable usually
  website: getNested(data, 'contactInfo.website'), // Add website field
  
  // Owner fields (Only for Add Mode, not typically edited)
  firstName: '', 
  lastName: '',
  ownerEmail: '', // Owner email for Add mode
  password: '',
  ownerPhone: '', // Owner phone for Add mode
});


const RestaurantEditModal = ({ isOpen, onClose, restaurantId, onSave }) => {
  const isEditMode = !!restaurantId;
  const [formData, setFormData] = useState(getInitialFormData()); 
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // --- State for Review Mode --- 
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [pendingNotification, setPendingNotification] = useState(null);

  // --- Fetch Data for Edit/Review Mode --- 
  const fetchData = useCallback(async () => {
    if (!isEditMode || !isOpen || !restaurantId) return;
    
    console.log(`RestaurantEditModal: Fetching data for restaurant ID: ${restaurantId}`);
    setIsLoading(true);
    setError(null);
    setIsReviewMode(false); // Reset review mode on fetch
    setPendingNotification(null);

    try {
      // Fetch data - might include pendingNotification
      const response = await adminAPI.getRestaurantById(restaurantId);
      console.log("Admin Get Restaurant By ID Response:", response.data);
      
      if (response.data?.success) {
        const restaurantData = response.data.restaurant;
        const fetchedPendingNotification = response.data.pendingNotification; // Might be null

        if (fetchedPendingNotification && fetchedPendingNotification.data?.submittedData) {
            console.log("Entering REVIEW mode. Populating with submittedData:", fetchedPendingNotification.data.submittedData);
            // REVIEW MODE: Populate with pending data
            setIsReviewMode(true);
            setPendingNotification(fetchedPendingNotification);
            // Use submittedData which should contain all fields in the correct format
            const submitted = fetchedPendingNotification.data.submittedData;
            setFormData({
                // Map submitted data to form fields
                name: submitted.name || restaurantData.name || '',
                description: submitted.description || restaurantData.description || '',
                address: submitted.addressStreet || getNested(restaurantData, 'address.street') || '', // Map addressStreet from submitted
                phone: submitted.phone || getNested(restaurantData, 'contactInfo.phone') || '', // Assuming submitted phone is contact phone
                isOpen: submitted.isOpen !== undefined ? submitted.isOpen : getNested(restaurantData, 'isOpen', true),
                deliveryRadius: submitted.deliveryRadius ?? getNested(restaurantData, 'deliveryRadius', 5),
                minimumOrder: submitted.minimumOrder ?? getNested(restaurantData, 'minimumOrder', 0),
                deliveryFee: submitted.deliveryFee ?? getNested(restaurantData, 'deliveryFee', 0),
                openingHours: submitted.openingHours || getNested(restaurantData, 'openingHours'),
                cuisine: Array.isArray(submitted.cuisine) ? submitted.cuisine.join(', ') : (submitted.cuisine || restaurantData.cuisine?.join(', ') || ''),
                // Include other fields if they are part of submittedData
                priceRange: submitted.priceRange || getNested(restaurantData, 'priceRange', '$$'),
                website: submitted.website || getNested(restaurantData, 'contactInfo.website'),
                // Non-editable fields shown for context
                panNumber: restaurantData.panNumber, 
                status: restaurantData.status,
            });
        } else {
            console.log("Entering EDIT mode. Populating with current restaurant data:", restaurantData);
            // EDIT MODE: Populate with current data
            setIsReviewMode(false);
            setFormData(getInitialFormData(restaurantData)); 
        }
      } else {
        throw new Error(response.data?.message || 'Failed to fetch restaurant details');
      }
    } catch (err) {
      console.error('Error fetching restaurant data:', err);
      setError(err.message || 'Could not load restaurant data.');
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, isOpen, isEditMode]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        fetchData(); // Use the combined fetch function
      } else {
        // Add Mode: Reset form
        setFormData(getInitialFormData()); 
        setError(null); 
        setIsLoading(false);
        setIsReviewMode(false);
        setPendingNotification(null);
      }
    } else {
      // Clear form when modal closes
      setFormData(getInitialFormData()); 
      setError(null);
      setIsReviewMode(false);
      setPendingNotification(null);
    }
  }, [isOpen, isEditMode, fetchData]);

  // --- Form Handling (aligned with new structure) --- 
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Simple update for flat structure
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name, checked) => {
      setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleOpeningHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          [field]: value
        }
      }
    }));
  };

  // --- Submit Logic (Handles Edit, Add, and Review Approve/Reject) --- 
  const handleSubmitOrApprove = async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (isReviewMode && pendingNotification) {
        // --- APPROVE PENDING CHANGES --- 
        console.log("Approving changes for notification:", pendingNotification._id);
        const response = await adminAPI.processNotification(pendingNotification._id, 'approve');
         if (response.data?.success) {
           onSave(); 
           onClose(); 
         } else {
           throw new Error(response.data?.message || 'Failed to approve changes');
         }
      } else if (isEditMode) {
        // --- UPDATE EXISTING RESTAURANT --- 
        const updatePayload = {
          name: formData.name,
          description: formData.description,
          // Send address as simple string or structure based on backend needs
          // Assuming PATCH /details expects structure matching the model
          address: { street: formData.address, city: '', state: '', zipCode: '', country: '' }, // Adjust as needed
          contactInfo: {
            phone: formData.phone, // Map form phone to contactInfo.phone
            email: formData.ownerEmail, // Assuming this is the restaurant contact email? Needs clarification
            website: formData.website
          },
          isOpen: formData.isOpen,
          deliveryRadius: parseFloat(formData.deliveryRadius) || 0,
          minimumOrder: parseFloat(formData.minimumOrder) || 0,
          deliveryFee: parseFloat(formData.deliveryFee) || 0,
          cuisine: typeof formData.cuisine === 'string' ? formData.cuisine.split(',').map(c => c.trim()).filter(Boolean) : [],
          priceRange: formData.priceRange,
          openingHours: formData.openingHours
        };
        console.log('Updating restaurant details:', restaurantId, updatePayload);
        const response = await adminAPI.updateRestaurantDetails(restaurantId, updatePayload);
        if (response.data?.success) {
          onSave();
          onClose();
        } else {
          throw new Error(response.data?.message || 'Failed to save changes');
        }
      } else {
        // --- CREATE NEW RESTAURANT --- 
         const createPayload = { 
           firstName: formData.firstName, 
           lastName: formData.lastName,
           email: formData.ownerEmail, // Use ownerEmail
           password: formData.password,
           phone: formData.ownerPhone, // Use ownerPhone
           restaurantName: formData.name, // Use name field for restaurant name
           restaurantAddress: formData.address, // Use address field 
           restaurantDescription: formData.description,
           panNumber: formData.panNumber,
           cuisine: typeof formData.cuisine === 'string' ? formData.cuisine.split(',').map(c => c.trim()).filter(Boolean) : [],
           priceRange: formData.priceRange,
           isApproved: true, 
           isActive: true, 
         }; 
         console.log('Creating new restaurant with owner:', createPayload);
         const response = await adminAPI.createRestaurantAndOwner(createPayload);
         if (response.data?.success) {
           onSave(); 
           onClose(); 
         } else {
           throw new Error(response.data?.message || 'Failed to create restaurant');
         }
      }
    } catch (err) {
      console.error(`Error during ${isReviewMode ? 'approval' : (isEditMode ? 'update' : 'creation')}:`, err);
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // --- Handle Rejection --- 
  const handleReject = async () => {
      if (!isReviewMode || !pendingNotification) return;
      
      const reason = prompt("Please provide a reason for rejecting these changes (optional):");
      // User clicked cancel on the prompt
      if (reason === null) return; 
      
      setIsSaving(true); // Use isSaving state for reject button too
      setError(null);
      
      try {
          console.log("Rejecting changes for notification:", pendingNotification._id, "Reason:", reason);
          const response = await adminAPI.processNotification(pendingNotification._id, 'reject', { reason: reason || 'Rejected by admin' });
           if (response.data?.success) {
             onSave(); // Refresh the list on the parent page
             onClose(); // Close modal
           } else {
             throw new Error(response.data?.message || 'Failed to reject changes');
           }
      } catch (err) {
          console.error('Error rejecting changes:', err);
          setError(err.response?.data?.message || err.message || 'Failed to reject changes.');
      } finally {
          setIsSaving(false);
      }
  };

  // --- Modal Title and Description --- 
  let modalTitle = 'Add New Restaurant';
  let modalDescription = 'Enter details for the new restaurant and its owner.';
  if (isReviewMode) {
      modalTitle = `Review Pending Changes: ${formData.name || 'Loading...'}`;
      modalDescription = 'Approve or reject the changes submitted by the restaurant owner.';
  } else if (isEditMode) {
      modalTitle = `Edit Restaurant: ${formData.name || 'Loading...'}`;
      modalDescription = 'Modify the details below. Click save when finished.';
  }

  // --- Render Logic --- 
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[900px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 pb-2 border-b">
          <DialogTitle className="text-xl font-bold break-words">{modalTitle}</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 break-words">{modalDescription}</DialogDescription>
        </DialogHeader>
        
        {/* Loading State */}
        {isLoading && (
           <div className="flex items-center justify-center flex-grow"><Spinner size="large"/></div>
        )}
        
        {/* Error Alert */}
        {error && <Alert variant="destructive" className="flex-shrink-0 my-2">{error}</Alert>}
        
        {/* Form Content (Scrollable) */}
        {!isLoading && (
          <ScrollArea className="flex-grow py-4 pr-6 -mr-6 overflow-y-auto"> 
            <form onSubmit={(e) => e.preventDefault()}> {/* Prevent default form submission */}
              {/* Review Mode Indicator */}
              {isReviewMode && (
                  <Alert variant="warning" className="mb-4">
                      You are reviewing pending changes. Approve or Reject below.
                  </Alert>
              )}
              
              {/* Basic Information Section - Aligned with Restaurant Profile */}
              <div className="p-4 mb-4 border rounded-md">
                <h3 className="mb-3 text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Restaurant Name*</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isReviewMode} />
                    </div>
                    <div>
                      <Label htmlFor="phone">Restaurant Contact Phone</Label>
                      <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} disabled={isReviewMode} />
                    </div>
                </div>
                 <div className="mt-4">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} disabled={isReviewMode} />
                 </div>
                 <div className="mt-4">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" value={formData.address} onChange={handleChange} disabled={isReviewMode} />
                 </div>
                 {/* Show non-editable info for context in edit/review mode */}
                 {isEditMode && (
                     <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
                        <div><Label>Status:</Label> <Badge variant={formData.status === 'approved' ? 'success' : 'warning'}>{formData.status}</Badge></div>
                        <div><Label>PAN:</Label> <span className="text-sm font-mono">{formData.panNumber || 'N/A'}</span></div>
                     </div>
                 )}
              </div>

              {/* Business Settings Section - Aligned with Restaurant Profile */}
              <div className="p-4 mb-4 border rounded-md">
                  <h3 className="mb-3 text-lg font-semibold">Business Settings</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
                      <Input id="deliveryRadius" name="deliveryRadius" type="number" min="0" step="0.1" value={formData.deliveryRadius} onChange={handleChange} disabled={isReviewMode} />
                    </div>
                    <div>
                      <Label htmlFor="minimumOrder">Minimum Order ($)</Label>
                      <Input id="minimumOrder" name="minimumOrder" type="number" min="0" step="0.01" value={formData.minimumOrder} onChange={handleChange} disabled={isReviewMode} />
                    </div>
                    <div>
                      <Label htmlFor="deliveryFee">Delivery Fee ($)</Label>
                      <Input id="deliveryFee" name="deliveryFee" type="number" min="0" step="0.01" value={formData.deliveryFee} onChange={handleChange} disabled={isReviewMode} />
                    </div>
                  </div>
                   <div className="flex items-center mt-4">
                      <Switch
                        id="isOpen"
                        checked={formData.isOpen}
                        onCheckedChange={(checked) => handleSwitchChange('isOpen', checked)}
                        disabled={isReviewMode}
                      />
                      <Label htmlFor="isOpen" className="ml-2">Restaurant is currently open</Label>
                   </div>
              </div>

              {/* Opening Hours Section - Aligned with Restaurant Profile */}
              <div className="p-4 mb-4 border rounded-md">
                  <h3 className="mb-3 text-lg font-semibold">Opening Hours</h3>
                  <div className="space-y-3">
                    {Object.entries(formData.openingHours || {}).map(([day, hours]) => (
                      <div key={day} className="grid grid-cols-[100px_1fr_auto_1fr] gap-2 items-center">
                        <Label className="font-medium capitalize text-right">{day}</Label>
                        <Input
                          type="time"
                          value={hours.open || ''}
                          onChange={(e) => handleOpeningHoursChange(day, 'open', e.target.value)}
                          className="w-full"
                          disabled={isReviewMode}
                        />
                        <span className="text-center">to</span>
                        <Input
                          type="time"
                          value={hours.close || ''}
                          onChange={(e) => handleOpeningHoursChange(day, 'close', e.target.value)}
                          className="w-full"
                          disabled={isReviewMode}
                        />
                      </div>
                    ))}
                  </div>
              </div>
              
              {/* Other Details Section */}
              <div className="p-4 mb-4 border rounded-md">
                <h3 className="mb-3 text-lg font-semibold">Other Details</h3>
                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="cuisine">Cuisine Types (comma-separated)</Label>
                        <Input id="cuisine" name="cuisine" value={formData.cuisine} onChange={handleChange} disabled={isReviewMode} />
                    </div>
                    <div>
                        <Label htmlFor="priceRange">Price Range</Label>
                        {/* Use Select if predefined options exist, otherwise Input */}
                        <Input id="priceRange" name="priceRange" value={formData.priceRange} onChange={handleChange} disabled={isReviewMode} />
                    </div>
                     <div>
                         <Label htmlFor="website">Website</Label>
                         <Input id="website" name="website" type="url" value={formData.website} onChange={handleChange} disabled={isReviewMode} />
                     </div>
                 </div>
              </div>

              {/* Owner Information Section (ADD MODE ONLY) */}
              {!isEditMode && (
                <div className="p-4 border rounded-md">
                  <h3 className="mb-3 text-lg font-semibold">Owner Information</h3>
                   <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="firstName">First Name*</Label>
                        <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name*</Label>
                        <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
                      </div>
                      <div>
                        <Label htmlFor="ownerEmail">Owner Email*</Label>
                        <Input id="ownerEmail" name="ownerEmail" type="email" value={formData.ownerEmail} onChange={handleChange} required />
                      </div>
                      <div>
                        <Label htmlFor="password">Password*</Label>
                        <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                      </div>
                       <div>
                         <Label htmlFor="ownerPhone">Owner Phone*</Label>
                         <Input id="ownerPhone" name="ownerPhone" type="tel" value={formData.ownerPhone} onChange={handleChange} required />
                       </div>
                   </div>
                    {/* Add PAN Number input for Add mode */}
                    <div className="mt-4">
                       <Label htmlFor="panNumber">PAN Number* (9 digits)</Label>
                       <Input id="panNumber" name="panNumber" value={formData.panNumber} onChange={handleChange} required pattern="\d{9}" title="PAN must be 9 digits" />
                    </div>
                </div>
              )}
            </form>
          </ScrollArea>
        )}

        {/* Footer Actions */}
        {!isLoading && (
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </DialogClose>
            
            {/* Show Reject button only in Review Mode */}
            {isReviewMode && (
                 <Button variant="destructive" onClick={handleReject} disabled={isSaving}>
                    {isSaving ? <Spinner size="sm" className="mr-2" /> : null}
                    Reject Changes
                 </Button>
            )}
            
            {/* Save/Approve Button */}
            <Button 
                variant={isReviewMode ? "success" : "default"} // Green button for approval
                onClick={handleSubmitOrApprove} 
                disabled={isSaving}
            >
              {isSaving ? <Spinner size="sm" className="mr-2" /> : null}
              {isReviewMode ? 'Approve Changes' : (isEditMode ? 'Save Changes' : 'Create Restaurant')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

RestaurantEditModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  restaurantId: PropTypes.string, // Can be null for Add mode
  onSave: PropTypes.func.isRequired, // Callback after save/create/approve/reject
};

export default RestaurantEditModal; 