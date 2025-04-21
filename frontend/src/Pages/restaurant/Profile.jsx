import { useState, useEffect } from 'react';
import { Card, Button, Input, Textarea, Label, Alert, Switch } from '../../components/ui';
import { FaSave, FaInfoCircle, FaClock } from 'react-icons/fa';
import { restaurantAPI } from '../../utils/api';
import { Spinner } from '../../components/ui/spinner';

const RestaurantProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    description: '',
    address: '',
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
    }
  });
  
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchRestaurantProfile();
  }, []);

  const fetchRestaurantProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setIsPendingApproval(false);
    try {
        const response = await restaurantAPI.getProfile();

        if (response.data.success) {
          const restaurantData = response.data.data;
          setProfile(prevProfile => ({
            ...prevProfile,
            ...restaurantData,
            cuisine: Array.isArray(restaurantData.cuisine) ? restaurantData.cuisine : [],
            openingHours: restaurantData.openingHours || prevProfile.openingHours,
          }));
          if (restaurantData.status === 'pending_approval') {
             setIsPendingApproval(true);
          }

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
      const profileDataToSend = {
        name: profile.name,
        description: profile.description,
        address: profile.address,
        isOpen: profile.isOpen,
        cuisine: profile.cuisine,
        deliveryRadius: parseFloat(profile.deliveryRadius) || 0,
        minimumOrder: parseFloat(profile.minimumOrder) || 0,
        deliveryFee: parseFloat(profile.deliveryFee) || 0,
        openingHours: profile.openingHours
      };

      console.log("Submitting profile update:", profileDataToSend);
      const response = await restaurantAPI.updateProfile(profileDataToSend);
      console.log("Update profile response:", response);
      
      if (response.status === 202 || response.data?.data?.status === 'pending_approval') {
        setSuccess('Profile update request submitted successfully. Changes require admin approval.');
        setIsPendingApproval(true);
      } else if (response.data.success) {
        setSuccess('Restaurant profile updated successfully!');
        setIsPendingApproval(false);
      } else {
        setError(response.data.message || 'Failed to update profile. Please try again.');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      if (err.response?.status === 409 && err.response?.data?.message?.includes('pending')) {
          setSuccess('You already have profile changes pending approval.');
          setIsPendingApproval(true);
      } else {
          setError(err.response?.data?.message || 'An error occurred. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
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
            <FaClock className="w-4 h-4" />
            <div className="ml-3">
               <p className="font-medium">Changes Pending Approval</p>
               <p className="text-sm">Your profile changes are currently under review by an administrator. Further edits are disabled until approved or rejected.</p>
            </div>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
           <fieldset disabled={isPendingApproval || isSubmitting}>
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
                      onCheckedChange={(checked) => setProfile(prev => ({ ...prev, isOpen: checked }))}
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