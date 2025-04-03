import { useState, useEffect } from 'react';
import { Card, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Alert, Avatar, AvatarFallback, AvatarImage } from '../../components/ui';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBell, FaLock, FaInfoCircle, FaCamera } from 'react-icons/fa';
import { userAPI } from '../../utils/api';

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    language: "en",
    avatar: "",
    notifications: {
      orderUpdates: true,
      promotions: true,
      newsletters: false,
      deliveryUpdates: true
    }
  });
  
  // Track original values to detect changes
  const [originalProfile, setOriginalProfile] = useState({});

  useEffect(() => {
    fetchUserProfile();
    checkApprovalStatus();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUserProfile();
      
      if (response.data.success) {
        const userData = response.data.user;
        setProfile({
          name: userData.name || "",
          phone: userData.phone || "",
          email: userData.email || "",
          address: userData.address || "",
          language: userData.language || "en",
          avatar: userData.avatar || "",
          notifications: userData.notifications || {
            orderUpdates: true,
            promotions: true,
            newsletters: false,
            deliveryUpdates: true
          }
        });
        setOriginalProfile({
          name: userData.name || "",
          phone: userData.phone || "",
          email: userData.email || "",
          address: userData.address || "",
          language: userData.language || "en",
          avatar: userData.avatar || "",
        });
      } else {
        console.warn("Profile data fetch returned non-success response:", response.data);
        loadFallbackData();
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Use fallback data instead of showing error
      loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  // Fallback data when API calls fail
  const loadFallbackData = () => {
    // Use local storage data if available
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    
    // Create fallback profile data
    const fallbackProfile = {
      name: userData.name || "Guest User",
      phone: userData.phone || "",
      email: userData.email || "",
      address: userData.address || "",
      language: "en",
      avatar: "",
      notifications: {
        orderUpdates: true,
        promotions: false,
        newsletters: false,
        deliveryUpdates: true
      }
    };
    
    // Set both current and original profile to fallback data
    setProfile(fallbackProfile);
    setOriginalProfile(fallbackProfile);
    
    // Clear any existing error messages
    setError(null);
  };

  const checkApprovalStatus = async () => {
    try {
      const response = await userAPI.getProfileChangeStatus();
      
      if (response.data.success) {
        setApprovalStatus(response.data);
      }
    } catch (error) {
      console.error("Error checking approval status:", error);
      // Don't show error to user, just silently fail
      setApprovalStatus(null);
    }
  };

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

  // Determine if any field has changed
  const hasChanges = () => {
    return (
      profile.name !== originalProfile.name ||
      profile.phone !== originalProfile.phone ||
      profile.email !== originalProfile.email ||
      profile.address !== originalProfile.address ||
      profile.language !== originalProfile.language
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // If email changed, we need admin approval
      if (profile.email !== originalProfile.email) {
        const response = await userAPI.requestEmailChange(profile.email);
        
        if (response.data.success) {
          setSuccess("Email change request submitted for admin approval");
          setIsEditing(false);
          
          // Refresh approval status
          await checkApprovalStatus();
        } else {
          setError(response.data.message || "Failed to submit email change request");
        }
      } else {
        // For other fields, just update directly
        const changes = {
          name: profile.name !== originalProfile.name ? profile.name : undefined,
          phone: profile.phone !== originalProfile.phone ? profile.phone : undefined,
          address: profile.address !== originalProfile.address ? profile.address : undefined,
          language: profile.language !== originalProfile.language ? profile.language : undefined,
          notifications: profile.notifications
        };
        
        // Filter out undefined values
        Object.keys(changes).forEach(key => 
          changes[key] === undefined && delete changes[key]
        );
        
        // Only make API call if there are changes
        if (Object.keys(changes).length > 0) {
          const response = await userAPI.updateProfile(changes);
          
          if (response.data.success) {
            setSuccess("Profile updated successfully");
            setIsEditing(false);
            
            // Update original profile with new values
            setOriginalProfile({
              ...originalProfile,
              ...changes
            });
          } else {
            setError(response.data.message || "Failed to update profile");
          }
        } else {
          setSuccess("No changes to save");
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const getInitials = (name) => {
    return name
      ? name
          .split(' ')
          .map(part => part[0])
          .join('')
          .toUpperCase()
      : 'U';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setIsEditing(false);
              // Reset to original values
              setProfile({
                ...originalProfile,
                notifications: profile.notifications // Keep notification settings
              });
              setError(null);
              setSuccess(null);
            }}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges() || saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <FaInfoCircle className="w-4 h-4" />
          <span>{error}</span>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <FaInfoCircle className="w-4 h-4" />
          <span>{success}</span>
        </Alert>
      )}

      {approvalStatus && approvalStatus.hasPendingChanges && (
        <Alert>
          <FaInfoCircle className="w-4 h-4" />
          <span>
            You have pending profile changes awaiting admin approval.
            {approvalStatus.pendingChanges?.email && 
              ` Email change from ${originalProfile.email} to ${approvalStatus.pendingChanges.email} is in review.`
            }
          </span>
        </Alert>
      )}

      {approvalStatus && approvalStatus.hasRejectedChanges && (
        <Alert variant="destructive">
          <FaInfoCircle className="w-4 h-4" />
          <span>
            Your recent profile changes were rejected.
            Reason: {approvalStatus.rejectionReason || "No reason provided"}
          </span>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Profile Summary Card */}
        <Card className="p-6 md:col-span-1">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="text-3xl bg-gradient-to-r from-purple-500 to-indigo-500">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="absolute bottom-0 right-0 w-8 h-8 p-0 rounded-full"
                >
                  <FaCamera className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">{profile.name}</h2>
              <p className="text-gray-500">{profile.email}</p>
              <div className="mt-2 text-sm text-gray-500">Member since January 2023</div>
            </div>
            
            <div className="w-full mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <FaEnvelope className="text-gray-400" />
                <span className="text-sm">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaPhone className="text-gray-400" />
                <span className="text-sm">{profile.phone || 'No phone added'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-gray-400" />
                <span className="text-sm">{profile.address || 'No address added'}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6 md:col-span-2">
          {/* Basic Information */}
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
                    placeholder="Your full name"
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
                    placeholder="Your phone number"
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
                    onChange={handleInputChange}
                    disabled={!isEditing || approvalStatus?.hasPendingChanges}
                    className="pl-10"
                    placeholder="Your email address"
                  />
                </div>
                {isEditing && (
                  <p className="text-xs text-amber-600">
                    Email changes require admin approval.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Delivery Address</Label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <Input
                    id="address"
                    name="address"
                    value={profile.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="pl-10"
                    placeholder="Your delivery address"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Preferences */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Preferences</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Preferred Language</Label>
                <Select 
                  value={profile.language} 
                  onValueChange={(value) => setProfile(prev => ({ ...prev, language: value }))} 
                  disabled={!isEditing}
                >
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
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Notifications</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Object.entries(profile.notifications).map(([type, enabled]) => (
                <div key={type} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <FaBell className="w-5 h-5 text-gray-400" />
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

          {/* Security */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <FaLock className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label>Password</Label>
                    <p className="text-sm text-gray-500">Last changed: Never</p>
                  </div>
                </div>
                <Button variant="outline">Change Password</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 