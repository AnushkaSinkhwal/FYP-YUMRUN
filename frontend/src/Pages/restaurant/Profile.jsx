import { useState } from 'react';
import { Card, Button, Input, Textarea, Label, Switch } from '../../components/ui';
import { FaUpload, FaSave, FaTimes } from 'react-icons/fa';

const RestaurantProfile = () => {
  const [profile, setProfile] = useState({
    name: 'Healthy Bites',
    description: 'Fresh and healthy food options',
    address: '123 Main St, City, Country',
    phone: '+1 234 567 8900',
    email: 'contact@healthybites.com',
    openingHours: {
      monday: { open: '09:00', close: '22:00' },
      tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' },
      thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '23:00' },
      saturday: { open: '10:00', close: '23:00' },
      sunday: { open: '10:00', close: '22:00' }
    },
    cuisine: ['Healthy', 'Vegetarian', 'Vegan'],
    isOpen: true,
    deliveryRadius: 5, // in kilometers
    minimumOrder: 15,
    deliveryFee: 2.99,
    logo: null,
    coverImage: null
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleImageUpload = (type, file) => {
    // TODO: Implement image upload logic
    console.log(`Uploading ${type}:`, file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // TODO: Implement API call to update profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Basic Information</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Restaurant Name</Label>
              <Input
                id="name"
                name="name"
                value={profile.name}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={profile.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={profile.address}
                onChange={handleInputChange}
                disabled={!isEditing}
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
            </select>
          </div>
        </Card>

        {/* Images */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Images</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Restaurant Logo</Label>
              <div className="flex items-center mt-2 space-x-4">
                <div className="flex items-center justify-center w-32 h-32 bg-gray-200 rounded-lg dark:bg-gray-700">
                  {profile.logo ? (
                    <img src={profile.logo} alt="Logo" className="object-cover w-full h-full rounded-lg" />
                  ) : (
                    <FaUpload className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                {isEditing && (
                  <Button variant="outline" asChild>
                    <label className="cursor-pointer">
                      <FaUpload className="mr-2" />
                      Upload Logo
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload('logo', e.target.files[0])}
                      />
                    </label>
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label>Cover Image</Label>
              <div className="flex items-center mt-2 space-x-4">
                <div className="flex items-center justify-center w-32 h-32 bg-gray-200 rounded-lg dark:bg-gray-700">
                  {profile.coverImage ? (
                    <img src={profile.coverImage} alt="Cover" className="object-cover w-full h-full rounded-lg" />
                  ) : (
                    <FaUpload className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                {isEditing && (
                  <Button variant="outline" asChild>
                    <label className="cursor-pointer">
                      <FaUpload className="mr-2" />
                      Upload Cover
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload('coverImage', e.target.files[0])}
                      />
                    </label>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default RestaurantProfile; 