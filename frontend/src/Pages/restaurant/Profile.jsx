import { useState, useEffect } from 'react';
import { Card, Button, Input, Textarea, Label, Alert, Switch } from '../../components/ui';
import { FaSave, FaInfoCircle } from 'react-icons/fa';
import { restaurantAPI } from '../../utils/api';

const RestaurantProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    cuisine: ['Healthy', 'Vegetarian'],
    isOpen: true,
    deliveryRadius: 5, // in kilometers
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
    pendingApproval: false
  });
  
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
          
          // Set profile with original data
          setProfile(prevProfile => ({
            ...prevProfile,
            ...restaurantData,
            // Ensure openingHours has correct structure
            openingHours: restaurantData.openingHours || prevProfile.openingHours,
            pendingApproval: pendingData?.hasPendingChanges || false
          }));
          
          // If there are pending changes, show message
          if (pendingData?.hasPendingChanges) {
            // Show pending changes alert
            setSuccess('Your profile changes are pending admin approval.');
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
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setProfile(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setProfile(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Submit profile changes
      const response = await restaurantAPI.updateProfile({
        name: profile.name,
        description: profile.description,
        address: profile.address,
        phone: profile.phone,
        isOpen: profile.isOpen,
        deliveryRadius: profile.deliveryRadius,
        minimumOrder: profile.minimumOrder,
        deliveryFee: profile.deliveryFee,
        openingHours: profile.openingHours
      });
      
      if (response.data.success) {
        setSuccess('Restaurant profile updated successfully!');
        fetchRestaurantProfile(); // Refresh data
      } else {
        setError(response.data.message || 'Failed to update profile. Please try again.');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to connect to the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading restaurant profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Manage Restaurant</h1>
        
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

        {profile.pendingApproval && (
          <Alert variant="warning" className="mb-6">
            <div className="flex items-center">
              <FaInfoCircle className="mr-2 text-amber-500" />
              <div>
                <p className="font-medium">Profile changes awaiting approval</p>
                <p className="text-sm">Your recent profile changes are pending admin approval.</p>
              </div>
            </div>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
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

          {/* Business Settings */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Business Settings</h2>
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
                  onCheckedChange={(checked) => setProfile(prev => ({ ...prev, isOpen: checked }))}
                />
                <Label htmlFor="isOpen" className="ml-2">Restaurant is currently open</Label>
              </div>
            </div>
          </Card>

          {/* Opening Hours */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Opening Hours</h2>
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

          <div className="flex justify-end gap-2">
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              <FaSave className="mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantProfile;