import { useState, useEffect } from 'react';
import { Card, Button, Input, Textarea, Label, Switch, Alert } from '../../components/ui';
import { FaUpload, FaSave, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const RestaurantProfile = () => {
  const { currentUser } = useAuth();
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
    coverImage: null
  });

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
      // Use the restaurant details from the current user initially
      if (currentUser && currentUser.restaurantDetails) {
        setProfile(prevProfile => ({
          ...prevProfile,
          name: currentUser.restaurantDetails.name || '',
          address: currentUser.restaurantDetails.address || '',
          description: currentUser.restaurantDetails.description || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
        }));
      }

      // Try both endpoints - first singular, then plural if singular fails
      try {
        // First try the singular endpoint
        const response = await axios.get('/api/restaurant/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (response.data.success) {
          const restaurantData = response.data.data;
          setProfile(prevProfile => ({
            ...prevProfile,
            ...restaurantData,
            // Make sure openingHours has the correct structure if coming from API
            openingHours: restaurantData.openingHours || prevProfile.openingHours
          }));
        }
      } catch (error) {
        console.log('Singular endpoint failed, trying plural endpoint', error.message);
        
        // If singular endpoint fails, try the plural endpoint
        const pluralResponse = await axios.get('/api/restaurants/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (pluralResponse.data.success) {
          const restaurantData = pluralResponse.data.data;
          setProfile(prevProfile => ({
            ...prevProfile,
            ...restaurantData,
            // Make sure openingHours has the correct structure if coming from API
            openingHours: restaurantData.openingHours || prevProfile.openingHours
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching restaurant profile:', err);
      // Don't set error if we at least have the basic info from currentUser
      if (!currentUser?.restaurantDetails?.name) {
        setError('Failed to load restaurant profile. Using default information.');
      }
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
      // Create FormData to handle file uploads
      const formData = new FormData();
      
      // Append basic text fields
      formData.append('name', profile.name);
      formData.append('description', profile.description);
      formData.append('address', profile.address);
      formData.append('phone', profile.phone);
      
      // Handle complex fields
      if (profile.openingHours) {
        formData.append('openingHours', JSON.stringify(profile.openingHours));
      }
      
      if (profile.cuisine && profile.cuisine.length > 0) {
        formData.append('cuisine', JSON.stringify(profile.cuisine));
      }
      
      // Handle boolean fields
      formData.append('isOpen', profile.isOpen);
      
      // Handle number fields
      if (profile.deliveryRadius) {
        formData.append('deliveryRadius', profile.deliveryRadius);
      }
      
      if (profile.minimumOrder) {
        formData.append('minimumOrder', profile.minimumOrder);
      }
      
      if (profile.deliveryFee) {
        formData.append('deliveryFee', profile.deliveryFee);
      }
      
      // Handle file uploads if they exist and are not data URLs
      if (profile.logo && profile.logo instanceof File) {
        formData.append('logo', profile.logo);
      } else if (profile.logo && profile.logo.startsWith('data:')) {
        // Convert data URL to File object
        const logoFile = dataURLtoFile(profile.logo, 'logo.png');
        formData.append('logo', logoFile);
      }
      
      if (profile.coverImage && profile.coverImage instanceof File) {
        formData.append('coverImage', profile.coverImage);
      } else if (profile.coverImage && profile.coverImage.startsWith('data:')) {
        // Convert data URL to File object
        const coverFile = dataURLtoFile(profile.coverImage, 'cover.png');
        formData.append('coverImage', coverFile);
      }

      // Try both endpoints - first singular, then plural if singular fails
      try {
        // First try the singular endpoint
        const response = await axios.put('/api/restaurant/profile', formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          setSuccess('Restaurant profile updated successfully!');
          setIsEditing(false);
          updateLocalStorage(profile);
        }
      } catch (error) {
        console.log('Singular endpoint failed, trying plural endpoint', error.message);
        
        // If singular endpoint fails, try the plural endpoint
        const pluralResponse = await axios.put('/api/restaurants/profile', formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (pluralResponse.data.success) {
          setSuccess('Restaurant profile updated successfully!');
          setIsEditing(false);
          updateLocalStorage(profile);
        }
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to update restaurant profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to convert data URL to File
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Helper function to update localStorage
  const updateLocalStorage = (profileData) => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
      userData.restaurantDetails = {
        ...userData.restaurantDetails,
        name: profileData.name,
        address: profileData.address,
        description: profileData.description
      };
      localStorage.setItem('userData', JSON.stringify(userData));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-yumrun-orange"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Restaurant Profile</h1>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
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
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

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
              <Label htmlFor="logo" className="block mb-2">Restaurant Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-32 h-32 overflow-hidden bg-gray-200 rounded-lg dark:bg-gray-700">
                  {profile.logo ? (
                    <img 
                      src={profile.logo} 
                      alt="Restaurant logo" 
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">No Logo</span>
                  )}
                </div>
                {isEditing && (
                  <div>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('logo', e)}
                      disabled={!isEditing}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('logo').click()}
                    >
                      <FaUpload className="mr-2" />
                      Upload Logo
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="coverImage" className="block mb-2">Cover Image</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-32 h-32 overflow-hidden bg-gray-200 rounded-lg dark:bg-gray-700">
                  {profile.coverImage ? (
                    <img 
                      src={profile.coverImage} 
                      alt="Restaurant cover" 
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">No Cover</span>
                  )}
                </div>
                {isEditing && (
                  <div>
                    <Input
                      id="coverImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('coverImage', e)}
                      disabled={!isEditing}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('coverImage').click()}
                    >
                      <FaUpload className="mr-2" />
                      Upload Cover
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RestaurantProfile; 