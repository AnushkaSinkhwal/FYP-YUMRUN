import { useState, useEffect } from 'react';
import { Card, Button, Input, Textarea, Label, Switch, Alert } from '../../components/ui';
import { FaUpload, FaSave, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { restaurantAPI } from '../../utils/api';

const RestaurantProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    openingHours: {
      monday: { open: '09:00', close: '22:00' },
      tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' },
      thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '23:00' },
      saturday: { open: '10:00', close: '23:00' },
      sunday: { open: '10:00', close: '22:00' }
    },
    cuisine: ['Healthy', 'Vegetarian'],
    isOpen: true,
    deliveryRadius: 5, // in kilometers
    minimumOrder: 15,
    deliveryFee: 2.99,
    logo: null,
    coverImage: null,
    pendingApproval: false
  });
  
  // Store original data separately
  const [originalData, setOriginalData] = useState(null);
  // Store pending changes separately
  const [pendingChanges, setPendingChanges] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchRestaurantProfile();
  }, []);

  const fetchRestaurantProfile = async () => {
    setLoading(true);
    try {
      // Get profile data from API
      try {
        const response = await restaurantAPI.getProfile();

        if (response.data.success) {
          const restaurantData = response.data.data;
          const pendingData = response.data.pendingChanges;
          
          // Store the original data
          setOriginalData(restaurantData);
          
          // Set profile with original data
          setProfile(prevProfile => ({
            ...prevProfile,
            ...restaurantData,
            // Make sure openingHours has the correct structure if coming from API
            openingHours: restaurantData.openingHours || prevProfile.openingHours,
            pendingApproval: pendingData?.hasPendingChanges || false
          }));
          
          // If there are pending changes, store them separately
          if (pendingData?.hasPendingChanges) {
            setPendingChanges({
              name: pendingData.restaurantName,
              address: pendingData.restaurantAddress,
              phone: pendingData.phone,
              email: pendingData.email,
              submittedAt: new Date(pendingData.submittedAt).toLocaleDateString()
            });
            
            // If we're in edit mode, show the pending values
            if (!isEditing) {
              setProfile(prevProfile => ({
                ...prevProfile,
                name: pendingData.restaurantName || prevProfile.name,
                address: pendingData.restaurantAddress || prevProfile.address,
                phone: pendingData.phone || prevProfile.phone,
                email: pendingData.email || prevProfile.email,
                pendingApproval: true
              }));
            }
            
            // Show pending changes alert
            setSuccess('Your profile changes are pending admin approval. You can see both current and pending values below.');
          }
        }
      } catch (error) {
        console.error('Error fetching restaurant profile from API:', error);
        setError('Failed to load restaurant profile. Please try again later.');
      }
    } catch (err) {
      console.error('Error in fetchRestaurantProfile:', err);
      setError('Failed to load restaurant profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpeningHoursChange = (day, field, value) => {
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

  const handleCuisineChange = (e) => {
    const cuisines = Array.from(e.target.selectedOptions, option => option.value);
    setProfile(prev => ({
      ...prev,
      cuisine: cuisines
    }));
  };

  const handleImageUpload = (type, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfile(prev => ({
        ...prev,
        [type]: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Extract the changes to submit for approval
      const changes = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        restaurantName: profile.name,  // Map name to restaurantName for the API
        restaurantAddress: profile.address // Map address to restaurantAddress for the API
      };
      
      // Submit profile changes
      const profileChangesResponse = await restaurantAPI.submitProfileChanges(changes);
      
      if (profileChangesResponse.data.success) {
        setSuccess('Profile changes submitted for admin approval. You will be notified once approved.');
        
        // Store the pending changes
        setPendingChanges({
          name: profile.name,
          address: profile.address,
          phone: profile.phone,
          email: profile.email,
          submittedAt: new Date().toLocaleDateString()
        });
        
        // Update state to show pending status
        setProfile(prev => ({
          ...prev,
          pendingApproval: true
        }));
        
        setIsEditing(false);
        
        // Refresh the profile data to get the latest from the backend
        fetchRestaurantProfile();
      } else {
        setError(profileChangesResponse.data.message || 'Failed to submit profile changes. Please try again.');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to connect to the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to original data
  const handleCancelEdit = () => {
    if (originalData) {
      // If we have pending changes and we're editing, restore the pending values
      if (pendingChanges && profile.pendingApproval) {
        setProfile(prev => ({
          ...prev,
          name: pendingChanges.name || originalData.name,
          address: pendingChanges.address || originalData.address,
          phone: pendingChanges.phone || originalData.phone,
          email: pendingChanges.email || originalData.email
        }));
      } else {
        // Otherwise just restore original values
        setProfile(prev => ({
          ...prev,
          ...originalData
        }));
      }
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-yumrun-orange"></div>
      </div>
    );
  }

  // Helper function to show pending value if it exists
  const renderPendingValue = (fieldName, fieldLabel) => {
    if (!pendingChanges || !pendingChanges[fieldName] || !profile.pendingApproval) return null;
    
    // Only show if the pending value is different from the original
    if (pendingChanges[fieldName] === originalData?.[fieldName]) return null;
    
    return (
      <div className="mt-1 text-sm text-amber-600 dark:text-amber-400">
        <span className="font-medium">Pending {fieldLabel}:</span> {pendingChanges[fieldName]}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Restaurant Profile</h1>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  <FaTimes className="mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  <FaSave className="mr-2" />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} disabled={loading}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {profile.pendingApproval && (
          <Alert variant="warning" className="mb-6">
            <div className="flex items-center">
              <FaInfoCircle className="mr-2 text-amber-500" />
              <div>
                <p className="font-medium">Profile changes awaiting approval</p>
                <p className="text-sm">Your recent profile changes submitted on {pendingChanges?.submittedAt} are pending admin approval. You&apos;ll be notified once they&apos;re reviewed.</p>
              </div>
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-4">
            {success}
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Basic Information</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Restaurant Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={profile.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter restaurant name"
                  className="w-full"
                />
                {renderPendingValue('name', 'name')}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={profile.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter restaurant address"
                  className="w-full"
                />
                {renderPendingValue('address', 'address')}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={profile.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter phone number"
                  className="w-full"
                />
                {renderPendingValue('phone', 'phone number')}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  value={profile.email}
                  onChange={handleInputChange}
                  disabled={!isEditing || true} // Email is always disabled as it's the login id
                  placeholder="Enter email address"
                  className="w-full"
                />
                {renderPendingValue('email', 'email')}
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Description</h2>
            <div>
              <Label htmlFor="description">About Your Restaurant</Label>
              <Textarea
                id="description"
                name="description"
                value={profile.description}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={4}
                placeholder="Describe your restaurant, its specialties, and unique features"
              />
            </div>
          </Card>

          {/* Business Settings */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Business Settings</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
                <Input
                  id="deliveryRadius"
                  name="deliveryRadius"
                  type="number"
                  value={profile.deliveryRadius}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="minimumOrder">Minimum Order ($)</Label>
                <Input
                  id="minimumOrder"
                  name="minimumOrder"
                  type="number"
                  value={profile.minimumOrder}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="deliveryFee">Delivery Fee ($)</Label>
                <Input
                  id="deliveryFee"
                  name="deliveryFee"
                  type="number"
                  value={profile.deliveryFee}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isOpen"
                  checked={profile.isOpen}
                  onCheckedChange={(checked) => setProfile(prev => ({ ...prev, isOpen: checked }))}
                  disabled={!isEditing}
                />
                <Label htmlFor="isOpen">Restaurant is Open</Label>
              </div>
            </div>
          </Card>

          {/* Opening Hours */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Opening Hours</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Object.entries(profile.openingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center space-x-2">
                  <Label className="w-24 capitalize">{day}</Label>
                  <Input
                    type="time"
                    value={hours.open}
                    onChange={(e) => handleOpeningHoursChange(day, 'open', e.target.value)}
                    disabled={!isEditing}
                    className="w-32"
                  />
                  <span>to</span>
                  <Input
                    type="time"
                    value={hours.close}
                    onChange={(e) => handleOpeningHoursChange(day, 'close', e.target.value)}
                    disabled={!isEditing}
                    className="w-32"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Cuisine Types */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Cuisine Types</h2>
            <div>
              <Label htmlFor="cuisine">Select Cuisine Types</Label>
              <select
                id="cuisine"
                multiple
                value={profile.cuisine}
                onChange={handleCuisineChange}
                disabled={!isEditing}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="Healthy">Healthy</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Vegan">Vegan</option>
                <option value="Italian">Italian</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="Mexican">Mexican</option>
                <option value="Indian">Indian</option>
                <option value="Nepalese">Nepalese</option>
                <option value="Fast Food">Fast Food</option>
                <option value="Dessert">Dessert</option>
                <option value="Breakfast">Breakfast</option>
              </select>
            </div>
          </Card>

          {/* Images */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Restaurant Images</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="logo">Restaurant Logo</Label>
                <div className="mt-2 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md">
                  {profile.logo ? (
                    <div className="relative w-full h-40">
                      <img
                        src={profile.logo}
                        alt="Restaurant Logo"
                        className="h-full w-full object-contain"
                      />
                      {isEditing && (
                        <button
                          onClick={() => setProfile({ ...profile, logo: null })}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-1 text-sm text-gray-500">Upload your restaurant logo</p>
                    </div>
                  )}
                  {isEditing && (
                    <input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('logo', e)}
                      className="mt-4 w-full text-sm"
                    />
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="coverImage">Cover Image</Label>
                <div className="mt-2 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md">
                  {profile.coverImage ? (
                    <div className="relative w-full h-40">
                      <img
                        src={profile.coverImage}
                        alt="Cover Image"
                        className="h-full w-full object-cover"
                      />
                      {isEditing && (
                        <button
                          onClick={() => setProfile({ ...profile, coverImage: null })}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-1 text-sm text-gray-500">Upload a cover image</p>
                    </div>
                  )}
                  {isEditing && (
                    <input
                      id="coverImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('coverImage', e)}
                      className="mt-4 w-full text-sm"
                    />
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RestaurantProfile;