import { useState, useEffect } from 'react';
import { Card, Button, Input, Textarea, Label, Alert, Switch } from '../../components/ui';
import { FaSave, FaClock, FaImage, FaPortrait } from 'react-icons/fa';
import { restaurantAPI } from '../../utils/api';
import { Spinner } from '../../components/ui/spinner';
import { getFullImageUrl } from '../../utils/imageUtils';

// Helper to get main address line
const getMainAddress = (address) => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return address.street || address.full || address.formatted || ''; 
};

const RestaurantProfile = () => {
  const [profile, setProfile] = useState({
    id: null,
    name: '',
    description: '',
    address: '', // Store main address string for display
    phone: '',
    email: '',
    cuisine: [],
    isOpen: true,
    deliveryRadius: 5,
    minimumOrder: 0,
    deliveryFee: 0,
    openingHours: {
      monday: { open: '09:00', close: '22:00' },
      tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' },
      thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '22:00' },
      saturday: { open: '10:00', close: '23:00' },
      sunday: { open: '10:00', close: '22:00' }
    },
    logo: null, // Add logo state
    coverImage: null, // Add coverImage state
    _fullAddressObject: {}, // Store original address object if needed
  });
  
  const [logoFile, setLogoFile] = useState(null); // For file input
  const [coverImageFile, setCoverImageFile] = useState(null); // For file input

  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchRestaurantProfile();
  }, []);

  // Add polling effect when changes are pending approval
  useEffect(() => {
    let refreshInterval;
    if (isPendingApproval) {
      // Poll every 60 seconds for status changes
      refreshInterval = setInterval(fetchRestaurantProfile, 60000);
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [isPendingApproval]);

  const fetchRestaurantProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setIsPendingApproval(false);
    try {
        const response = await restaurantAPI.getProfile();
        let isCurrentlyPendingAdminUpdate = false; // Flag for pending admin notification

        if (response.data.success) {
          const restaurantData = response.data.data;
          setProfile(prevProfile => ({
            ...prevProfile,
            ...restaurantData,
            // Map isActive from backend to isOpen for frontend state/UI
            isOpen: restaurantData.isOpen !== undefined ? restaurantData.isOpen : prevProfile.isOpen,
            // Extract main address string for display, store original object if exists
            address: getMainAddress(restaurantData.address),
            _fullAddressObject: typeof restaurantData.address === 'object' ? restaurantData.address : {},
            cuisine: Array.isArray(restaurantData.cuisine) ? restaurantData.cuisine.join(', ') : '', // Store as comma-separated string for input
            // Ensure numeric fields have defaults if missing from response
            deliveryRadius: restaurantData.deliveryRadius ?? prevProfile.deliveryRadius,
            minimumOrder: restaurantData.minimumOrder ?? prevProfile.minimumOrder,
            deliveryFee: restaurantData.deliveryFee ?? prevProfile.deliveryFee,
            openingHours: restaurantData.openingHours || prevProfile.openingHours,
            logo: restaurantData.logo || null,
            coverImage: restaurantData.coverImage || null,
          }));
          
          // Check if the restaurant document itself is pending initial approval
          const isPendingInitialApproval = restaurantData.status === 'pending_approval';
          if (isPendingInitialApproval) {
              setSuccess('Your profile is pending initial admin approval.');
              setIsPendingApproval(true);
          }

          // Separately check if there's a pending *update* notification for this restaurant
          try {
              const pendingUpdateCheckResponse = await restaurantAPI.hasPendingUpdate();
              if (pendingUpdateCheckResponse.data.success) {
                  isCurrentlyPendingAdminUpdate = pendingUpdateCheckResponse.data.hasPendingUpdate;
                   if (isCurrentlyPendingAdminUpdate && !isPendingInitialApproval) {
                       // Set appropriate message if an update is pending but initial approval was done
                       setSuccess('Your previously submitted profile changes are pending admin approval.');
                       setIsPendingApproval(true);
                   }
              }
          } catch (checkError) {
              console.error('Error checking for pending update notification:', checkError);
          }
          
          // Set the final approval state based on both checks
          setIsPendingApproval(isPendingInitialApproval || isCurrentlyPendingAdminUpdate);

        } else {
           throw new Error(response.data.message || 'Failed to load profile');
        }
    } catch (err) {
      console.error('Error fetching restaurant profile:', err);
      setError(err.response?.data?.message || 'Failed to load restaurant profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Don't allow changes if the profile is pending approval
    if (isPendingApproval) {
      console.log("Cannot update profile while changes are pending approval");
      return;
    }
    
    if (type === 'checkbox') {
      // Assuming 'isOpen' is the only checkbox mapped directly like this
       setProfile(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'cuisine') {
       setProfile(prev => ({ ...prev, [name]: value })); // Keep as string
    } else if (type === 'number') {
       // Ensure value is parsed correctly, handle empty string case
       const numValue = value === '' ? '' : parseFloat(value);
       setProfile(prev => ({ ...prev, [name]: numValue }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    
    // Don't allow changes if the profile is pending approval
    if (isPendingApproval) {
      console.log("Cannot update files while changes are pending approval");
      return;
    }
    
    if (files.length > 0) {
      if (name === 'logo') {
        setLogoFile(files[0]);
        // Show preview
        setProfile(prev => ({ ...prev, logo: URL.createObjectURL(files[0]) })); 
      } else if (name === 'coverImage') {
        setCoverImageFile(files[0]);
        // Show preview
        setProfile(prev => ({ ...prev, coverImage: URL.createObjectURL(files[0]) }));
      }
    }
  };

  const handleOpeningHoursChange = (day, field, value) => {
    // Don't allow changes if the profile is pending approval
    if (isPendingApproval) {
      console.log("Cannot update opening hours while profile changes are pending approval");
      return;
    }
    
    setProfile(prev => ({
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Check if the restaurant is already in pending approval state
      // to avoid unnecessary API calls
      if (isPendingApproval) {
        setSuccess('Your profile changes are already pending admin approval.');
        setIsSubmitting(false);
        return;
      }
      
      // Use FormData for potential file uploads
      const formData = new FormData();

      // Append non-file fields
      formData.append('name', profile.name);
      formData.append('description', profile.description);
      formData.append('address', profile.address); 
      formData.append('isOpen', profile.isOpen); 
      formData.append('cuisine', JSON.stringify(profile.cuisine.split(',').map(c => c.trim()).filter(Boolean))); 
      formData.append('deliveryRadius', parseFloat(profile.deliveryRadius) || 0);
      formData.append('minimumOrder', parseFloat(profile.minimumOrder) || 0);
      formData.append('deliveryFee', parseFloat(profile.deliveryFee) || 0);
      formData.append('openingHours', JSON.stringify(profile.openingHours));

      // Append files if they exist
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      if (coverImageFile) {
        formData.append('coverImage', coverImageFile);
      }
      
      // Use the updated updateProfile endpoint which hits PUT /restaurants/profile
      const response = await restaurantAPI.updateProfile(formData); 
      console.log("Update profile response:", response);
      
      // Store potential new paths before clearing file state
      const submittedLogoPath = logoFile ? `/uploads/restaurants/${logoFile.name}` : null; // Construct potential path (adjust if backend stores differently)
      const submittedCoverImagePath = coverImageFile ? `/uploads/restaurants/${coverImageFile.name}` : null;

      // Backend PUT /restaurants/profile returns 202 Accepted for pending approval
      if (response.status === 202 || response.data?.data?.status === 'pending_approval') {
        setSuccess('Profile update request submitted successfully. Changes require admin approval.');
        setIsPendingApproval(true); // Keep form disabled
        
        // *** FIX: Update profile state with submitted changes, including image previews ***
        setProfile(prevProfile => ({
          ...prevProfile,
          // Update text fields based on what was submitted in formData
          name: formData.get('name') || prevProfile.name,
          description: formData.get('description') || prevProfile.description,
          address: formData.get('address') || prevProfile.address,
          isOpen: formData.get('isOpen') === 'true' || prevProfile.isOpen,
          cuisine: (JSON.parse(formData.get('cuisine') || '[]')).join(', ') || prevProfile.cuisine,
          deliveryRadius: parseFloat(formData.get('deliveryRadius')) || prevProfile.deliveryRadius,
          minimumOrder: parseFloat(formData.get('minimumOrder')) || prevProfile.minimumOrder,
          deliveryFee: parseFloat(formData.get('deliveryFee')) || prevProfile.deliveryFee,
          openingHours: JSON.parse(formData.get('openingHours') || '{}') || prevProfile.openingHours,
          // Use the temporary blob URL for preview if a new file was submitted
          logo: logoFile ? URL.createObjectURL(logoFile) : prevProfile.logo,
          coverImage: coverImageFile ? URL.createObjectURL(coverImageFile) : prevProfile.coverImage
        }));
        // *** END FIX ***

      } else if (response.data.success) {
        // Handle direct success (if approval system is bypassed or feature changes)
        setSuccess('Restaurant profile updated successfully!');
        setIsPendingApproval(false);
        const updatedData = response.data.data;
        setProfile(prevProfile => ({
          ...prevProfile,
          ...updatedData,
          isOpen: updatedData.isOpen !== undefined ? updatedData.isOpen : prevProfile.isOpen,
          address: getMainAddress(updatedData.address),
          _fullAddressObject: typeof updatedData.address === 'object' ? updatedData.address : {},
          cuisine: Array.isArray(updatedData.cuisine) ? updatedData.cuisine.join(', ') : '',
          // Use the actual paths returned from backend on direct success
          logo: updatedData.logo || null,
          coverImage: updatedData.coverImage || null,
        }));
      } else {
        setError(response.data.message || 'Failed to submit profile update. Please try again.');
      }
    } catch (err) {
      console.error('Failed to submit profile update:', err);
      // Handle specific conflict error if update is already pending
      if (err.response?.status === 409) { 
        // Use success styling for info message about pending changes
        setSuccess('You already have profile changes pending approval. Please wait for the current request to be processed.');
        setIsPendingApproval(true);
        // Refresh to get the latest state
        fetchRestaurantProfile();
      } else if (err.response?.status === 400 && err.response?.data?.message) {
        setError(`Validation Error: ${err.response.data.message}`);
      } else {
        setError(err.response?.data?.message || 'An error occurred submitting your update. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
      // Clear file inputs after submission attempt only if successful or pending
      if (success || isPendingApproval) {
           setLogoFile(null);
           setCoverImageFile(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading restaurant profile...</p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-800 dark:text-gray-100">Manage Restaurant</h1>
        
        {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}
        {success && <Alert variant={isPendingApproval ? "warning" : "success"} className="mb-4">{success}</Alert>}

        {isPendingApproval && !success && (
          <Alert variant="warning" className="mb-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-start">
                <FaClock className="w-4 h-4 mt-1" />
                <div className="ml-3">
                  <p className="font-medium">Changes Pending Approval</p>
                  <p className="text-sm">Your profile changes are currently under review by an administrator. Further edits are disabled until approved or rejected.</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchRestaurantProfile} 
                className="ml-4 shrink-0"
              >
                Check Status
              </Button>
            </div>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
           <fieldset disabled={isPendingApproval || isSubmitting}>
              <Card className="p-6 mb-6">
                <h2 className="mb-4 text-lg font-semibold">Restaurant Images</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="logo" className="block mb-2">Restaurant Logo</Label>
                    <div className="mb-2">
                      {profile.logo && (
                        <div className="flex items-center justify-center mb-2">
                          <img 
                            src={profile.logo.startsWith('blob:') ? profile.logo : getFullImageUrl(profile.logo)} 
                            alt="Restaurant Logo"
                            className="object-contain w-32 h-32 border rounded-md"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Input
                        id="logo"
                        name="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="flex-1 cursor-pointer"
                      />
                      <FaPortrait className="ml-2 text-gray-400" />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Upload a square logo image (recommended size: 300x300px).</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="coverImage" className="block mb-2">Cover Image</Label>
                    <div className="mb-2">
                      {profile.coverImage && (
                        <div className="flex items-center justify-center mb-2">
                          <img 
                            src={profile.coverImage.startsWith('blob:') ? profile.coverImage : getFullImageUrl(profile.coverImage)} 
                            alt="Restaurant Cover"
                            className="object-cover w-full h-32 border rounded-md"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Input
                        id="coverImage"
                        name="coverImage"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="flex-1 cursor-pointer"
                      />
                      <FaImage className="ml-2 text-gray-400" />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Upload a cover image (recommended size: 1200x400px).</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 mb-6">
                <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Restaurant Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={profile.name}
                      onChange={handleInputChange}
                      placeholder="Enter restaurant name"
                      className="w-full"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Restaurant Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={profile.description}
                      onChange={handleInputChange}
                      placeholder="Describe your restaurant"
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Restaurant Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={profile.address}
                      onChange={handleInputChange}
                      placeholder="Enter restaurant address"
                      className="w-full"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={profile.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className="w-full"
                      required
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6 mb-6">
                <h2 className="mb-4 text-lg font-semibold">Business Settings</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
                    <Input
                      id="deliveryRadius"
                      name="deliveryRadius"
                      type="number"
                      min="0"
                      step="0.1"
                      value={profile.deliveryRadius}
                      onChange={handleInputChange}
                    />
                  </div>
              
                  <div>
                    <Label htmlFor="minimumOrder">Minimum Order ($)</Label>
                    <Input
                      id="minimumOrder"
                      name="minimumOrder"
                      type="number"
                      min="0"
                      step="0.01"
                      value={profile.minimumOrder}
                      onChange={handleInputChange}
                    />
                  </div>
              
                  <div>
                    <Label htmlFor="deliveryFee">Delivery Fee ($)</Label>
                    <Input
                      id="deliveryFee"
                      name="deliveryFee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={profile.deliveryFee}
                      onChange={handleInputChange}
                    />
                  </div>
              
                  <div className="flex items-center mt-2">
                    <Switch
                      id="isOpen"
                      name="isOpen"
                      checked={profile.isOpen}
                      onChange={(checked) => {
                        console.log("Switch Handler Called!", checked);
                        // Only update state if not in pending approval mode
                        if (!isPendingApproval) {
                          setProfile(prev => ({ ...prev, isOpen: checked }));
                        } else {
                          console.log("Cannot update isOpen while profile changes are pending approval");
                        }
                      }}
                      disabled={isPendingApproval}
                    />
                    <Label htmlFor="isOpen" className="ml-2">Restaurant is currently open</Label>
                  </div>
                </div>
              </Card>

              <Card className="p-6 mb-6">
                <h2 className="mb-4 text-lg font-semibold">Opening Hours</h2>
                <div className="space-y-4">
                  {Object.entries(profile.openingHours).map(([day, hours]) => (
                    <div key={day} className="flex flex-wrap items-center gap-4">
                      <span className="w-24 font-medium capitalize">{day}</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => handleOpeningHoursChange(day, 'open', e.target.value)}
                          className="w-32"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => handleOpeningHoursChange(day, 'close', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex justify-end mt-6">
                <Button type="submit" disabled={isPendingApproval || isSubmitting}>
                  {isSubmitting ? <Spinner size="sm" className="mr-2"/> : <FaSave className="mr-2" />} 
                  {isPendingApproval ? 'Changes Pending Approval' : 'Save Changes'}
                </Button>
              </div>
           </fieldset>
        </form>
      </div>
    </div>
  );
};

export default RestaurantProfile;