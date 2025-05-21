import { useState, useEffect } from 'react';
import { Card, Button, Input, Label, Alert, Avatar, AvatarFallback, AvatarImage, Switch } from '../../components/ui';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaLock, FaInfoCircle, FaCamera } from 'react-icons/fa';
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
    role: "",
    healthCondition: "",
    avatar: "",
    healthProfile: {
      height: 0,
      weight: 0,
      allergies: [],
      healthConditions: [],
      dietaryPreferences: [],
      fitnessGoals: [],
      activityLevel: "moderately_active",
      dailyTargets: { calories: 2000, protein: 50, carbs: 250, fat: 70, fiber: 25 },
      favouriteFoods: [],
      dislikedFoods: [],
    },
    deliveryRiderDetails: {
      vehicleType: "",
      licenseNumber: "",
      vehicleRegistrationNumber: "",
      approved: false,
      isAvailable: false,
    },
    restaurantId: null,
    notifications: {
      orderUpdates: true,
      promotions: true,
      newsletters: false,
      deliveryUpdates: true
    }
  });
  
  // Track original values to detect changes
  const [originalProfile, setOriginalProfile] = useState({});

  // Add state and handler for inline change-password form
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    checkApprovalStatus();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile();
      
      if (response.data.success) {
        const userData = response.data.data;
        
        // Ensure healthProfile and dailyTargets exist with defaults before merging
        const defaultHealthProfile = {
          height: 0,
          weight: 0,
          allergies: [],
          healthConditions: [],
          dietaryPreferences: [],
          fitnessGoals: [],
          activityLevel: "moderately_active",
          dailyTargets: { calories: 2000, protein: 50, carbs: 250, fat: 70, fiber: 25 },
          favouriteFoods: [],
          dislikedFoods: [],
        };

        const mergedHealthProfile = {
          ...defaultHealthProfile,
          ...userData.healthProfile,
          dailyTargets: {
            ...defaultHealthProfile.dailyTargets,
            ...(userData.healthProfile?.dailyTargets || {}),
          },
        };

        setProfile({
          name: userData.fullName || "",
          phone: userData.phone || "",
          email: userData.email || "",
          address: userData.address || "",
          role: userData.role || "customer",
          healthCondition: userData.healthCondition || "",
          avatar: userData.avatar || "",
          healthProfile: mergedHealthProfile,
          deliveryRiderDetails: userData.deliveryRiderDetails || {
            vehicleType: "",
            licenseNumber: "",
            vehicleRegistrationNumber: "",
            approved: false,
            isAvailable: false,
          },
          restaurantId: userData.restaurantId || null,
          notifications: userData.notifications || {
            orderUpdates: true,
            promotions: true,
            newsletters: false,
            deliveryUpdates: true
          }
        });
        setOriginalProfile({
          name: userData.fullName || "",
          phone: userData.phone || "",
          email: userData.email || "",
          address: userData.address || "",
          role: userData.role || "customer",
          healthCondition: userData.healthCondition || "",
          avatar: userData.avatar || "",
          healthProfile: mergedHealthProfile,
          deliveryRiderDetails: userData.deliveryRiderDetails || {
            vehicleType: "",
            licenseNumber: "",
            vehicleRegistrationNumber: "",
            approved: false,
            isAvailable: false,
          },
          restaurantId: userData.restaurantId || null,
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
      role: "customer",
      healthCondition: "",
      avatar: "",
      healthProfile: {
        height: 0,
        weight: 0,
        allergies: [],
        healthConditions: [],
        dietaryPreferences: [],
        fitnessGoals: [],
        activityLevel: "moderately_active",
        dailyTargets: { calories: 2000, protein: 50, carbs: 250, fat: 70, fiber: 25 },
        favouriteFoods: [],
        dislikedFoods: [],
      },
      deliveryRiderDetails: {
        vehicleType: "",
        licenseNumber: "",
        vehicleRegistrationNumber: "",
        approved: false,
        isAvailable: false,
      },
      restaurantId: null,
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

  // Generic handler for simple input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Determine if any field has changed
  const hasChanges = () => {
    return (
      profile.name !== originalProfile.name ||
      profile.phone !== originalProfile.phone ||
      profile.email !== originalProfile.email ||
      profile.address !== originalProfile.address
    );
  };

  // Separate save handler for health profile
  const handleSaveHealthProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Ensure healthProfile object exists
      const healthDataToSave = profile.healthProfile || {};
      
      // Clean up arrays: Remove 'None' if other items exist
      const cleanArray = (arr) => {
          if (!Array.isArray(arr)) return [];
          const filtered = arr.filter(item => item && item.trim() !== 'None');
          return filtered.length > 0 ? filtered : (arr.includes('None') ? ['None'] : []);
      };
      
      const cleanedHealthProfile = {
           ...healthDataToSave,
           allergies: cleanArray(healthDataToSave.allergies),
           healthConditions: cleanArray(healthDataToSave.healthConditions),
           dietaryPreferences: cleanArray(healthDataToSave.dietaryPreferences),
           fitnessGoals: cleanArray(healthDataToSave.fitnessGoals),
           favouriteFoods: cleanArray(healthDataToSave.favouriteFoods),
           dislikedFoods: cleanArray(healthDataToSave.dislikedFoods),
           // Ensure daily targets are numbers
           dailyTargets: {
                calories: parseInt(healthDataToSave.dailyTargets?.calories || 0, 10),
                protein: parseInt(healthDataToSave.dailyTargets?.protein || 0, 10),
                carbs: parseInt(healthDataToSave.dailyTargets?.carbs || 0, 10),
                fat: parseInt(healthDataToSave.dailyTargets?.fat || 0, 10),
                fiber: parseInt(healthDataToSave.dailyTargets?.fiber || 0, 10),
            },
            height: parseFloat(healthDataToSave.height || 0),
            weight: parseFloat(healthDataToSave.weight || 0),
      };
      
      console.log("Saving health profile:", cleanedHealthProfile);
      
      const response = await userAPI.updateHealthProfile(cleanedHealthProfile);
      if (response.data.success) {
        setSuccess('Health profile updated successfully!');
        // Update original profile to reflect saved state
        setOriginalProfile(prev => ({ ...prev, healthProfile: cleanedHealthProfile })); 
      } else {
        setError(response.data.error?.message || 'Failed to save health profile');
      }
    } catch (error) {
      console.error("Error saving health profile:", error);
      setError(error.response?.data?.error?.message || 'An error occurred while saving health profile');
    } finally {
      setSaving(false);
    }
  };

  // Unified handler for delivery rider details changes
  const handleDeliveryDetailsChange = (name, value, type = 'input') => {
    setProfile(prev => ({
      ...prev,
      deliveryRiderDetails: {
        ...prev.deliveryRiderDetails,
        [name]: type === 'checkbox' ? value : value // Treat Switch value directly
      }
    }));
  };

  // Separate save handler for delivery details
  const handleSaveDeliveryDetails = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Extract only delivery details for the payload
      const { vehicleType, licenseNumber, vehicleRegistrationNumber, isAvailable } = profile.deliveryRiderDetails;
      const payload = { vehicleType, licenseNumber, vehicleRegistrationNumber, isAvailable };

      const response = await userAPI.updateDeliveryDetails(payload);

      if (response.data.success) {
        setSuccess("Delivery details updated successfully");
        setOriginalProfile(prev => ({ ...prev, deliveryRiderDetails: { ...profile.deliveryRiderDetails } })); // Deep copy might be needed
        // setIsEditing(false); // Optional: turn off edit mode
      } else {
        setError(response.data.error?.message || "Failed to update delivery details");
      }
    } catch (error) {
      console.error("Error saving delivery details:", error);
      setError("Failed to save delivery details changes");
    } finally {
      setSaving(false);
    }
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
          fullName: profile.name !== originalProfile.name ? profile.name : undefined,
          phone: profile.phone !== originalProfile.phone ? profile.phone : undefined,
          address: profile.address !== originalProfile.address ? profile.address : undefined,
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

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setPasswordLoading(true);
    const current = e.target.currentPassword.value;
    const newP = e.target.newPassword.value;
    const confirm = e.target.confirmPassword.value;
    if (newP !== confirm) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }
    try {
      const response = await userAPI.changePassword({ currentPassword: current, newPassword: newP });
      if (response.data.success) {
        setPasswordSuccess(response.data.message || 'Password updated successfully!');
        e.target.reset();
        setShowPasswordForm(false);
      } else {
        setPasswordError(response.data.message || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'An error occurred while changing password');
      console.error('Password change error:', err);
    } finally {
      setPasswordLoading(false);
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
          <div className="flex flex-wrap gap-2">
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
              {saving ? "Saving..." : "Save Basic Info"}
            </Button>
            <Button 
              onClick={handleSaveHealthProfile} 
              disabled={saving || JSON.stringify(profile.healthProfile) === JSON.stringify(originalProfile.healthProfile)} // Disable if no health changes or saving
              variant="secondary" // Different style
            >
              {saving ? "Saving..." : "Save Health Info"}
            </Button>
             {profile.role === 'delivery_rider' && (
                <Button 
                  onClick={handleSaveDeliveryDetails} 
                  disabled={saving || JSON.stringify(profile.deliveryRiderDetails) === JSON.stringify(originalProfile.deliveryRiderDetails)} 
                  variant="secondary" 
                  className="text-green-800 bg-green-100 hover:bg-green-200"
                >
                  {saving ? "Saving..." : "Save Delivery Info"}
                </Button>
              )}
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

          {/* Delivery Rider Details (Conditional & Editable) */}
          {profile.role === 'delivery_rider' && (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Delivery Rider Information</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Approval Status (Read-only) */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-500">Approval Status</Label>
                  <p className={`font-medium ${profile.deliveryRiderDetails?.approved ? 'text-green-600' : 'text-orange-600'}`}>
                    {profile.deliveryRiderDetails?.approved ? 'Approved' : 'Pending Approval'}
                  </p>
                </div>
                 {/* Availability (Editable Toggle) */}
                <div className="space-y-1">
                  <Label htmlFor="isAvailable" className="text-sm font-medium">Availability</Label>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isAvailable"
                        name="isAvailable"
                        checked={profile.deliveryRiderDetails?.isAvailable || false}
                        onCheckedChange={(checked) => handleDeliveryDetailsChange('isAvailable', checked, 'checkbox')}
                      />
                      <span>{profile.deliveryRiderDetails?.isAvailable ? 'Available' : 'Not Available'}</span>
                    </div>
                  ) : (
                    <p className={`font-medium ${profile.deliveryRiderDetails?.isAvailable ? 'text-green-600' : 'text-gray-600'}`}>
                        {profile.deliveryRiderDetails?.isAvailable ? 'Available' : 'Not Available'}
                    </p>
                  )}
                </div>
                {/* Replace the vehicle type dropdown with buttons */}
                <div className="space-y-1">
                  <Label htmlFor="vehicleType" className="text-sm font-medium">Vehicle Type</Label>
                  {isEditing ? (
                    <div>
                      {/* Current value display */}
                      <p className="mb-2 text-sm font-medium text-blue-600">
                        Current: {profile.deliveryRiderDetails?.vehicleType || 'Not selected'}
                      </p>
                      
                      {/* Button group instead of select */}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          {value: 'bicycle', label: 'Bicycle'},
                          {value: 'motorcycle', label: 'Motorcycle'},
                          {value: 'scooter', label: 'Scooter'},
                          {value: 'car', label: 'Car'}
                        ].map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleDeliveryDetailsChange('vehicleType', option.value)}
                            className={`p-2 text-center border rounded ${
                              profile.deliveryRiderDetails?.vehicleType === option.value 
                                ? 'bg-blue-500 text-white border-blue-600' 
                                : 'bg-white text-gray-800 hover:bg-gray-100 border-gray-300'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p>{profile.deliveryRiderDetails?.vehicleType || 'N/A'}</p>
                  )}
                </div>
                {/* License Number (Editable Input) */}
                <div className="space-y-1">
                  <Label htmlFor="licenseNumber" className="text-sm font-medium">License Number</Label>
                  {isEditing ? (
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      value={profile.deliveryRiderDetails?.licenseNumber || ''}
                      onChange={(e) => handleDeliveryDetailsChange(e.target.name, e.target.value)}
                      placeholder="Enter license number"
                    />
                  ) : (
                    <p>{profile.deliveryRiderDetails?.licenseNumber || 'N/A'}</p>
                  )}
                </div>
                {/* Vehicle Registration (Editable Input) */}
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="vehicleRegistrationNumber" className="text-sm font-medium">Vehicle Registration</Label>
                  {isEditing ? (
                    <Input
                      id="vehicleRegistrationNumber"
                      name="vehicleRegistrationNumber"
                      value={profile.deliveryRiderDetails?.vehicleRegistrationNumber || ''}
                      onChange={(e) => handleDeliveryDetailsChange(e.target.name, e.target.value)}
                      placeholder="Enter vehicle registration"
                    />
                  ) : (
                    <p>{profile.deliveryRiderDetails?.vehicleRegistrationNumber || 'N/A'}</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Restaurant Details (Conditional) */}
          {profile.role === 'restaurant' && profile.restaurantId && (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Restaurant Information</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-500">Restaurant Name</Label>
                  <p>{profile.restaurantId.name || 'N/A'}</p>
                </div>
                 <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <p className={`font-medium ${ profile.restaurantId.status === 'approved' ? 'text-green-600' : profile.restaurantId.status === 'pending_approval' ? 'text-orange-600' : 'text-red-600' }`}>
                     {profile.restaurantId.status?.replace('_', ' ') || 'N/A'}
                  </p>
                </div>
                 <div className="space-y-1 md:col-span-2">
                  <Label className="text-sm font-medium text-gray-500">Address</Label>
                  <p>{/* Format address object nicely */}
                     {profile.restaurantId.address ? 
                       `${profile.restaurantId.address.street || ''}, ${profile.restaurantId.address.city || ''}` 
                       : 'N/A'}
                  </p>
                </div>
                {/* Add more restaurant details here if needed */}
              </div>
              {/* Add Edit button linking to restaurant admin later if needed */}
              {/* <Button variant="outline" size="sm" className="mt-4">Manage Restaurant</Button> */}
            </Card>
          )}

          {/* Security */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Security</h2>
            {passwordSuccess && (
              <Alert variant="success" className="mb-4">
                {passwordSuccess}
              </Alert>
            )}
            {passwordError && (
              <Alert variant="destructive" className="mb-4">
                {passwordError}
              </Alert>
            )}
            <div className="space-y-4">
              {!showPasswordForm ? (
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <FaLock className="w-5 h-5 text-gray-400" />
                    <div>
                      <Label>Password</Label>
                      <p className="text-sm text-gray-500">Last changed: Never</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
                    Change Password
                  </Button>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4 p-4 border rounded-md">
                  <div>
                    <Label>Current Password</Label>
                    <Input type="password" name="currentPassword" required />
                  </div>
                  <div>
                    <Label>New Password</Label>
                    <Input type="password" name="newPassword" required />
                  </div>
                  <div>
                    <Label>Confirm New Password</Label>
                    <Input type="password" name="confirmPassword" required />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowPasswordForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={passwordLoading}>
                      {passwordLoading ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 