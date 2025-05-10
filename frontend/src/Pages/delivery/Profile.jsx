import { useState, useEffect } from 'react';
import { Card, Button, Input, Label, Textarea, Alert, Spinner } from '../../components/ui';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaMotorcycle, FaIdCard } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { deliveryAPI } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const DeliveryProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { currentUser, updateProfile } = useAuth();
  const { showToast } = useToast();
  
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    vehicleType: "",
    vehicleRegistrationNumber: "",
    licenseNumber: "",
    bio: "",
    preferredZones: [],
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await deliveryAPI.getProfile();
        
        if (response.data && response.data.success) {
          const userData = response.data.data;
          
          // Populate basic data
          setProfile({
            name: userData.fullName || userData.name || "",
            phone: userData.phone || "",
            email: userData.email || "",
            address: userData.address || "",
            vehicleType: userData.deliveryRiderDetails?.vehicleType || "",
            vehicleRegistrationNumber: userData.deliveryRiderDetails?.vehicleRegistrationNumber || "",
            licenseNumber: userData.deliveryRiderDetails?.licenseNumber || "",
            bio: userData.deliveryRiderDetails?.bio || "",
            preferredZones: userData.deliveryRiderDetails?.preferredZones || [],
          });
        } else {
          setError('Failed to fetch profile data');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Prepare the complete profile data
      const profileData = {
        fullName: profile.name,
        phone: profile.phone,
        address: profile.address,
        deliveryRiderDetails: {
          vehicleType: profile.vehicleType,
          vehicleRegistrationNumber: profile.vehicleRegistrationNumber,
          licenseNumber: profile.licenseNumber,
          bio: profile.bio,
          preferredZones: profile.preferredZones,
          approved: false // Set to false to trigger re-approval
        }
      };
      
      // Update profile via context which updates localStorage
      const response = await updateProfile(profileData);
      
      if (response.success) {
        setSuccess('Profile updated successfully. Your account requires admin approval before you can accept deliveries.');
        showToast('success', 'Profile updated. Waiting for admin approval.');
        setIsEditing(false);
      } else {
        setError(response.error || 'Failed to update profile');
        showToast('error', 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('An error occurred while updating your profile');
      showToast('error', 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile.name) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <p>{error}</p>
        </Alert>
      )}

      {success && (
        <Alert>
          <p>{success}</p>
        </Alert>
      )}

      {currentUser?.deliveryRiderDetails?.approved === false && (
        <Alert>
          <p>Your account is pending approval from an administrator. You cannot accept deliveries until approved.</p>
        </Alert>
      )}

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <FaUser className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
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
              <FaPhone className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
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
              <FaEnvelope className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <Input
                id="email"
                name="email"
                type="email"
                value={profile.email}
                disabled={true} // Email can't be changed here
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <FaMapMarkerAlt className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
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
        <h2 className="mb-4 text-lg font-semibold">Vehicle Information</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vehicleType">Vehicle Type</Label>
            <div className="relative">
              <FaMotorcycle className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <Input
                id="vehicleType"
                name="vehicleType"
                value={profile.vehicleType}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleRegistrationNumber">Vehicle Registration Number</Label>
            <div className="relative">
              <FaIdCard className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <Input
                id="vehicleRegistrationNumber"
                name="vehicleRegistrationNumber"
                value={profile.vehicleRegistrationNumber}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number</Label>
            <div className="relative">
              <FaIdCard className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <Input
                id="licenseNumber"
                name="licenseNumber"
                value={profile.licenseNumber}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Additional Information</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={profile.bio}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Preferred Delivery Zones</Label>
            <div className="flex flex-wrap gap-2">
              {profile.preferredZones.map((zone, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded-full dark:bg-blue-800/30 dark:text-blue-300"
                >
                  {zone}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DeliveryProfile; 