import { useState, useEffect } from 'react';
import { Card, Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Alert } from '../../components/ui';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBell, FaLock, FaCreditCard, FaInfoCircle } from 'react-icons/fa';
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
        });
      } else {
        setError("Failed to load profile data");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const checkApprovalStatus = async () => {
    try {
      const response = await userAPI.getProfileChangeStatus();
      
      if (response.data.success) {
        setApprovalStatus(response.data);
      }
    } catch (error) {
      console.error("Error checking approval status:", error);
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Profile</h1>
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
          <FaInfoCircle className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <FaInfoCircle className="h-4 w-4" />
          <span>{success}</span>
        </Alert>
      )}

      {approvalStatus && approvalStatus.hasPendingChanges && (
        <Alert>
          <FaInfoCircle className="h-4 w-4" />
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
          <FaInfoCircle className="h-4 w-4" />
          <span>
            Your recent profile changes were rejected.
            Reason: {approvalStatus.rejectionReason || "No reason provided"}
          </span>
        </Alert>
      )}

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
                disabled={!isEditing || approvalStatus?.hasPendingChanges}
                className="pl-10"
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
        <h2 className="text-lg font-semibold mb-4">Security</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FaLock className="h-5 w-5 text-gray-400" />
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
  );
};

export default UserProfile; 