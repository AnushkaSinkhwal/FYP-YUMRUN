import { useState } from 'react';
import { Card, Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBell, FaLock, FaCreditCard } from 'react-icons/fa';

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Doe",
    phone: "+1 234 567 8900",
    email: "john.doe@example.com",
    address: "123 Customer Street, City, Country",
    language: "en",
    notifications: {
      orderUpdates: true,
      promotions: true,
      newsletters: false,
      deliveryUpdates: true
    },
    paymentMethods: [
      {
        id: 1,
        type: "Credit Card",
        last4: "4242",
        expiry: "12/25",
        isDefault: true
      },
      {
        id: 2,
        type: "PayPal",
        email: "john.doe@example.com",
        isDefault: false
      }
    ],
    preferences: {
      deliveryInstructions: "Please ring the doorbell",
      favoriteRestaurants: ["Burger Palace", "Pizza Express"],
      dietaryRestrictions: ["No peanuts"],
      preferredDeliveryTime: "Evening"
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (type) => {
    setProfile(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };

  const handleSave = () => {
    // TODO: Implement API call to save profile
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Profile</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        )}
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="name"
                name="name"
                value={profile.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="phone"
                name="phone"
                value={profile.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Delivery Address</Label>
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="address"
                name="address"
                value={profile.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Preferences</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Preferred Language</Label>
            <Select value={profile.language} onValueChange={(value) => setProfile(prev => ({ ...prev, language: value }))} disabled={!isEditing}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Delivery Instructions</Label>
            <Textarea
              value={profile.preferences.deliveryInstructions}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                preferences: {
                  ...prev.preferences,
                  deliveryInstructions: e.target.value
                }
              }))}
              disabled={!isEditing}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Dietary Restrictions</Label>
            <Input
              value={profile.preferences.dietaryRestrictions.join(', ')}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                preferences: {
                  ...prev.preferences,
                  dietaryRestrictions: e.target.value.split(',').map(item => item.trim())
                }
              }))}
              disabled={!isEditing}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Notifications</h2>
        <div className="space-y-4">
          {Object.entries(profile.notifications).map(([type, enabled]) => (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaBell className="h-5 w-5 text-gray-400" />
                <Label className="capitalize">
                  {type.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
              </div>
              <Button
                variant={enabled ? "default" : "outline"}
                size="sm"
                onClick={() => handleNotificationChange(type)}
                disabled={!isEditing}
              >
                {enabled ? "Enabled" : "Disabled"}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>
        <div className="space-y-4">
          {profile.paymentMethods.map(method => (
            <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FaCreditCard className="h-6 w-6 text-gray-400" />
                <div>
                  <p className="font-medium">{method.type}</p>
                  {method.type === "Credit Card" ? (
                    <p className="text-sm text-gray-500">•••• {method.last4} • Expires {method.expiry}</p>
                  ) : (
                    <p className="text-sm text-gray-500">{method.email}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {method.isDefault && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full dark:bg-green-800/30 dark:text-green-300">
                    Default
                  </span>
                )}
                <Button variant="outline" size="sm" disabled={!isEditing}>
                  Edit
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full" disabled={!isEditing}>
            Add Payment Method
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Account Security</h2>
        <div className="space-y-4">
          <Button variant="outline" className="w-full justify-start gap-2">
            <FaLock className="h-4 w-4" />
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default UserProfile; 