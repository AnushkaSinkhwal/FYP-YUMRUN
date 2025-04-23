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
import { Select } from '@/components/ui/select';
import { adminAPI } from '../../utils/api';

// Helper to safely get nested properties
const getNested = (obj, path, defaultValue = '') => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) ?? defaultValue;
};

// --- Unified Initial Form Data Structure ---
const getInitialFormData = (data = {}) => ({
  // Owner fields (for Add mode)
  firstName: '', 
  lastName: '',
  email: '', // Owner email for Add mode
  password: '',
  phone: '', // Owner phone for Add mode

  // Restaurant fields (Common + Add/Edit specific)
  name: getNested(data, 'name'), // Used for Edit mode restaurant name
  restaurantName: '', // Used for Add mode restaurant name (can be mapped from/to name)
  description: getNested(data, 'description'),
  panNumber: getNested(data, 'panNumber'), // Required for Add, viewable in Edit?

  // Address fields
  // For Add mode, we'll use a simple string input `restaurantAddress`
  // For Edit mode, we'll use the detailed address object
  restaurantAddress: '', // Simple address input for Add mode
  address: {
    street: getNested(data, 'address.street'),
    city: getNested(data, 'address.city'),
    state: getNested(data, 'address.state'),
    zipCode: getNested(data, 'address.zipCode'),
    country: getNested(data, 'address.country'),
  },

  // ContactInfo fields (primarily for Edit mode)
  contactInfo: {
    phone: getNested(data, 'contactInfo.phone'),
    email: getNested(data, 'contactInfo.email'),
    website: getNested(data, 'contactInfo.website'),
  },
  
  // Other common fields
  cuisine: Array.isArray(data.cuisine) ? data.cuisine.join(', ') : (getNested(data, 'cuisine') || ''), 
  priceRange: getNested(data, 'priceRange', '$$'),
  
  // Status field for Edit mode
  status: getNested(data, 'status', 'pending_approval'),
  
  // Defaults for Add mode (not typically edited directly)
  isApproved: true, 
  isActive: true, 
  
  // openingHours: {}, // TODO: Handle opening hours editing if needed
});


const RestaurantEditModal = ({ isOpen, onClose, restaurantId, onSave }) => {
  const isEditMode = !!restaurantId;
  const [formData, setFormData] = useState(getInitialFormData()); // Initialize with unified structure
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // --- Fetch Data for Edit Mode --- 
  const fetchRestaurantData = useCallback(async () => {
    // This logic remains largely the same, but initializes using getInitialFormData
    if (!isEditMode || !isOpen || !restaurantId) return;
    
    console.log(`RestaurantEditModal: Fetching data for restaurant ID: ${restaurantId}`);
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getRestaurantById(restaurantId);
      if (response.data?.success && response.data.restaurant) {
        // Initialize form with fetched data using the unified function
        setFormData(getInitialFormData(response.data.restaurant)); 
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
        fetchRestaurantData();
      } else {
        // Add Mode: Reset form to empty initial state using the unified function
        setFormData(getInitialFormData()); 
        setError(null); 
        setIsLoading(false);
      }
    } else {
      // Clear form when modal closes
      setFormData(getInitialFormData()); 
      setError(null);
    }
  }, [isOpen, isEditMode, fetchRestaurantData]);

  // --- Form Handling --- 
  const handleChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split('.');

    if (keys.length === 1) {
      // Top-level field
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      // Nested field (e.g., address.street or contactInfo.phone)
      setFormData(prev => {
        let currentLevel = { ...prev };
        let ref = currentLevel;
        for (let i = 0; i < keys.length - 1; i++) {
          // Ensure nested structure exists
          if (ref[keys[i]] === undefined || ref[keys[i]] === null) {
            ref[keys[i]] = {};
          } else {
             // Create a shallow copy to avoid modifying the previous state directly
             ref[keys[i]] = { ...ref[keys[i]] };
          }
          ref = ref[keys[i]];
        }
        ref[keys[keys.length - 1]] = value;
        return currentLevel;
      });
    }
  };

  // Handle select change for status field
  const handleStatusChange = (value) => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);

    try {
      let response;

      if (isEditMode) {
        // --- EDIT MODE PAYLOAD ---
        // Prepare payload for PATCH /admin/restaurants/:restaurantId/details
        const updatePayload = {
          name: formData.name,
          description: formData.description,
          cuisine: typeof formData.cuisine === 'string' 
            ? formData.cuisine.split(',').map(c => c.trim()).filter(Boolean)
            : [],
          priceRange: formData.priceRange,
          contactInfo: { ...formData.contactInfo }, // Ensure it's a copy
          address: { ...formData.address }, // Ensure it's a copy
          // Include openingHours if implemented
        };
        
        // Remove empty/null values from nested objects if needed
        // e.g., if backend doesn't like empty strings for address fields

        console.log('Updating restaurant:', restaurantId, updatePayload);
        response = await adminAPI.updateRestaurantDetails(restaurantId, updatePayload);

        // After updating the restaurant details, also update the status if it has changed
        if (formData.status) {
          console.log('Updating restaurant status to:', formData.status);
          await adminAPI.updateRestaurantStatus(restaurantId, { status: formData.status });
        }
      } else {
        // --- ADD MODE PAYLOAD ---
        // Prepare payload for POST /admin/restaurants
        const createPayload = { 
          // Owner details from form
          firstName: formData.firstName, 
          lastName: formData.lastName,
          email: formData.email, 
          password: formData.password,
          phone: formData.phone, 
          
          // Restaurant details from form
          restaurantName: formData.restaurantName, // Use the specific field for add mode
          restaurantAddress: formData.restaurantAddress, // Use the specific simple address field for add mode
          restaurantDescription: formData.description, // Reuse description field
          panNumber: formData.panNumber,
          cuisine: typeof formData.cuisine === 'string' 
                   ? formData.cuisine.split(',').map(c => c.trim()).filter(Boolean) 
                   : [], 
          priceRange: formData.priceRange,
          
          // Default values (can be overridden if included in form later)
          isApproved: formData.isApproved, 
          isActive: formData.isActive, 
        }; 

        // Add validation checks here before submitting if needed

        console.log('Creating new restaurant with owner:', createPayload);
        response = await adminAPI.createRestaurantAndOwner(createPayload); 
      }
      
      // --- Handle Response ---
      if (response.data?.success) {
        onSave(); // Call the callback provided by the parent
        onClose(); // Close modal on success
      } else {
        throw new Error(response.data?.message || `Failed to ${isEditMode ? 'save changes' : 'create restaurant'}`);
      }
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} restaurant:`, err);
      // Improve error display: Check for specific validation errors if backend provides them
      let errorMessage = 'An unexpected error occurred.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const modalTitle = isEditMode ? `Edit Restaurant: ${formData.name || 'Loading...'}` : 'Add New Restaurant';
  const modalDescription = isEditMode ? 'Modify the details below. Click save when finished.' : 'Enter the details for the new restaurant and its owner.';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Adjusted max width and height, ensure content scrolls */}
      <DialogContent className="w-[90vw] max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden"> 
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="text-xl font-bold break-words">{modalTitle}</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 break-words">{modalDescription}</DialogDescription>
        </DialogHeader>
        
        {/* Scrollable Content Area */}
        <div className="flex-grow min-h-0 pl-1 pr-4 overflow-x-hidden overflow-y-auto custom-scrollbar"> 
          {isLoading ? (
            <div className="flex items-center justify-center h-40"><Spinner size="large"/></div>
          ) : (
            <div className="space-y-4"> 
              {error && (
                <Alert variant="destructive" className="mb-4">
                   <strong className="font-bold">Error:</strong> {error} 
                </Alert>
              )}
              
              {/* --- ADD MODE ONLY: Owner Details --- */} 
              {!isEditMode && (
                <div className="p-3 border rounded-md bg-gray-50/50 dark:bg-gray-800/50">
                  <h4 className="pb-2 mb-3 text-base font-semibold border-b">Owner Account Details</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName" className="mb-1.5 block">Owner First Name*</Label>
                      <Input id="firstName" name="firstName" value={formData.firstName || ''} onChange={handleChange} required placeholder="First name" />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="mb-1.5 block">Owner Last Name*</Label>
                      <Input id="lastName" name="lastName" value={formData.lastName || ''} onChange={handleChange} required placeholder="Last name" />
                    </div>
                    <div>
                      <Label htmlFor="email" className="mb-1.5 block">Owner Email*</Label>
                      <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} required placeholder="email@example.com" />
                    </div>
                    <div>
                      <Label htmlFor="password" className="mb-1.5 block">Owner Password*</Label>
                      <Input id="password" name="password" type="password" value={formData.password || ''} onChange={handleChange} required placeholder="Set temporary password" />
                    </div>
                     <div className="sm:col-span-2">
                       <Label htmlFor="phone" className="mb-1.5 block">Owner Phone*</Label>
                       <Input id="phone" name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} required placeholder="10-digit phone number" />
                    </div>
                  </div>
                </div>
              )}

              {/* --- Restaurant Details (Common Section) --- */}
              <div className="p-3 border rounded-md">
                <h4 className="pb-2 mb-3 text-base font-semibold border-b">Restaurant Information</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={isEditMode ? "name" : "restaurantName"} className="mb-1.5 block">Restaurant Name*</Label>
                    <Input 
                      id={isEditMode ? "name" : "restaurantName"} 
                      // Use 'name' for edit mode's main restaurant name field
                      // Use 'restaurantName' for add mode's restaurant name field
                      name={isEditMode ? "name" : "restaurantName"} 
                      value={isEditMode ? formData.name || '' : formData.restaurantName || ''}
                      onChange={handleChange} 
                      required 
                      placeholder="e.g., The Grand Cafe"
                    />
                  </div>
                
                  <div>
                    <Label htmlFor="description" className="mb-1.5 block">Description</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      value={formData.description || ''} 
                      onChange={handleChange} 
                      rows={3} 
                      placeholder="Brief description of the restaurant, cuisine type, etc."
                    />
                  </div>

                  {/* Status field - EDIT mode only */}
                  {isEditMode && (
                    <Select
                      label="Status"
                      value={formData.status}
                      onChange={handleStatusChange}
                      options={[
                        { value: 'pending_approval', label: 'Pending Approval' },
                        { value: 'approved', label: 'Approved' },
                        { value: 'rejected', label: 'Rejected' },
                        { value: 'deleted', label: 'Deleted' },
                      ]}
                      placeholder="Select status"
                      disabled={isSaving}
                      className="w-full"
                    />
                  )}

                  {/* PAN Number - Required for Add, potentially viewable/non-editable for Edit */}
                  {!isEditMode && (
                     <div>
                       <Label htmlFor="panNumber" className="mb-1.5 block">PAN Number*</Label>
                       <Input 
                         id="panNumber" 
                         name="panNumber" 
                         value={formData.panNumber || ''} 
                         onChange={handleChange} 
                         required 
                         placeholder="9-digit business PAN"
                       />
                     </div>
                  )}
                   {isEditMode && formData.panNumber && ( // Display PAN if available in edit mode, but make it read-only
                     <div>
                       <Label htmlFor="panNumber" className="mb-1.5 block">PAN Number</Label>
                       <Input 
                         id="panNumber" 
                         name="panNumber" 
                         value={formData.panNumber || ''} 
                         readOnly 
                         disabled
                         className="bg-gray-100 dark:bg-gray-700"
                       />
                     </div>
                   )}
                </div>
              </div>

              {/* --- Address Section (Conditional Input) --- */}
              <div className="p-3 border rounded-md">
                 <h4 className="pb-2 mb-3 text-base font-semibold border-b">Address</h4>
                {/* Simplified Address for ADD Mode */}
                {!isEditMode && (
                   <div>
                     <Label htmlFor="restaurantAddress" className="mb-1.5 block">Full Address*</Label>
                     <Input 
                       id="restaurantAddress" 
                       name="restaurantAddress" 
                       value={formData.restaurantAddress || ''} 
                       onChange={handleChange} 
                       required 
                       placeholder="Street, City, State"
                     />
                   </div>
                )}
                {/* Detailed Address for EDIT Mode */}
                {isEditMode && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                     <div>
                       <Label htmlFor="address.street" className="mb-1.5 block">Street</Label>
                       <Input 
                         id="address.street" 
                         name="address.street" 
                         value={getNested(formData, 'address.street')} 
                         onChange={handleChange} 
                         placeholder="Street address"
                       />
                     </div>
                    <div>
                      <Label htmlFor="address.city" className="mb-1.5 block">City</Label>
                      <Input 
                        id="address.city" 
                        name="address.city" 
                        value={getNested(formData, 'address.city')} 
                        onChange={handleChange} 
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address.state" className="mb-1.5 block">State</Label>
                      <Input 
                        id="address.state" 
                        name="address.state" 
                        value={getNested(formData, 'address.state')} 
                        onChange={handleChange} 
                        placeholder="State/Province"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address.zipCode" className="mb-1.5 block">Zip Code</Label>
                      <Input 
                        id="address.zipCode" 
                        name="address.zipCode" 
                        value={getNested(formData, 'address.zipCode')} 
                        onChange={handleChange} 
                        placeholder="Postal/ZIP code"
                      />
                    </div>
                    <div className="sm:col-span-2">
                       <Label htmlFor="address.country" className="mb-1.5 block">Country</Label>
                       <Input 
                         id="address.country" 
                         name="address.country" 
                         value={getNested(formData, 'address.country')} 
                         onChange={handleChange} 
                         placeholder="Country"
                       />
                    </div>
                  </div>
                )}
              </div>
              
              {/* --- Contact Info (EDIT Mode Only) --- */}
              {isEditMode && (
               <div className="p-3 border rounded-md">
                 <h4 className="pb-2 mb-3 text-base font-semibold border-b">Restaurant Contact Info</h4>
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="contactInfo.phone" className="mb-1.5 block">Contact Phone</Label>
                      <Input 
                        id="contactInfo.phone" 
                        name="contactInfo.phone" 
                        type="tel" 
                        value={getNested(formData, 'contactInfo.phone')} 
                        onChange={handleChange} 
                        placeholder="Restaurant contact number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactInfo.email" className="mb-1.5 block">Contact Email</Label>
                      <Input 
                        id="contactInfo.email" 
                        name="contactInfo.email" 
                        type="email" 
                        value={getNested(formData, 'contactInfo.email')} 
                        onChange={handleChange} 
                        placeholder="contact@restaurant.com"
                      />
                    </div>
                    <div className="sm:col-span-2">
                       <Label htmlFor="contactInfo.website" className="mb-1.5 block">Website</Label>
                       <Input 
                         id="contactInfo.website" 
                         name="contactInfo.website" 
                         type="url" 
                         value={getNested(formData, 'contactInfo.website')} 
                         onChange={handleChange} 
                         placeholder="https://www.restaurant.com"
                       />
                    </div>
                 </div>
               </div>
              )}
              
              {/* --- Other Common Details --- */} 
              <div className="p-3 mb-3 border rounded-md">
                 <h4 className="pb-2 mb-3 text-base font-semibold border-b">Other Details</h4>
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                       <Label htmlFor="cuisine" className="mb-1.5 block">Cuisine Types</Label>
                       <Input 
                         id="cuisine" 
                         name="cuisine" 
                         value={formData.cuisine || ''} 
                         onChange={handleChange} 
                         placeholder="Italian, Mexican, Indian (comma-separated)"
                       />
                    </div>
                    <div>
                      <Label htmlFor="priceRange" className="mb-1.5 block">Price Range</Label>
                      {/* TODO: Consider using a Select component for price range */}
                      <Input 
                        id="priceRange" 
                        name="priceRange" 
                        value={formData.priceRange || ''} 
                        onChange={handleChange} 
                        placeholder="e.g., $, $$, $$$"
                      />
                    </div>
                 </div>
                 {/* TODO: Add Opening Hours fields here if needed */}
              </div>
            </div> 
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 pt-4 mt-auto border-t">
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isSaving}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isLoading || isSaving}>
            {isSaving ? <Spinner size="sm" className="mr-2"/> : null}
            {isSaving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Restaurant')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

RestaurantEditModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  restaurantId: PropTypes.string, // Optional: ID for edit mode
  onSave: PropTypes.func.isRequired,
};

export default RestaurantEditModal; 