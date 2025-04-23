import { useState, useEffect } from 'react';
import { Card, Button, Input, Label, Alert, Avatar, AvatarFallback, AvatarImage, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '../../components/ui';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBell, FaLock, FaInfoCircle, FaCamera } from 'react-icons/fa';
import { userAPI } from '../../utils/api';

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  
  // Add state for tag inputs
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');
  const [preferenceInput, setPreferenceInput] = useState('');

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
      activityLevel: "",
      dailyTargets: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
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
    restaurantDetails: null,
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
        const userData = response.data.data;
        setProfile({
          name: userData.fullName || "",
          phone: userData.phone || "",
          email: userData.email || "",
          address: userData.address || "",
          role: userData.role || "customer",
          healthCondition: userData.healthCondition || "",
          avatar: userData.avatar || "",
          healthProfile: userData.healthProfile || {
            height: 0,
            weight: 0,
            allergies: [],
            healthConditions: [],
            dietaryPreferences: [],
            fitnessGoals: [],
            activityLevel: "",
            dailyTargets: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
            favouriteFoods: [],
            dislikedFoods: [],
          },
          deliveryRiderDetails: userData.deliveryRiderDetails || {
            vehicleType: "",
            licenseNumber: "",
            vehicleRegistrationNumber: "",
            approved: false,
            isAvailable: false,
          },
          restaurantDetails: userData.restaurantDetails || null,
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
          healthProfile: userData.healthProfile || {
            height: 0,
            weight: 0,
            allergies: [],
            healthConditions: [],
            dietaryPreferences: [],
            fitnessGoals: [],
            activityLevel: "",
            dailyTargets: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
            favouriteFoods: [],
            dislikedFoods: [],
          },
          deliveryRiderDetails: userData.deliveryRiderDetails || {
            vehicleType: "",
            licenseNumber: "",
            vehicleRegistrationNumber: "",
            approved: false,
            isAvailable: false,
          },
          restaurantDetails: userData.restaurantDetails || null,
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
        activityLevel: "",
        dailyTargets: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
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
      restaurantDetails: null,
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

  // Handler for nested health profile basic fields (height, weight)
  const handleHealthProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      healthProfile: {
        ...prev.healthProfile,
        [name]: value
      }
    }));
  };

  // Handler to add a tag to a health profile array field
  const handleAddTag = (field, inputState, setInputState) => {
    if (inputState.trim() === '') return; // Don't add empty tags
    setProfile(prev => ({
      ...prev,
      healthProfile: {
        ...prev.healthProfile,
        [field]: [...(prev.healthProfile[field] || []), inputState.trim()]
      }
    }));
    setInputState(''); // Clear the input
  };

  // Handler to remove a tag from a health profile array field
  const handleRemoveTag = (field, indexToRemove) => {
    setProfile(prev => ({
      ...prev,
      healthProfile: {
        ...prev.healthProfile,
        [field]: (prev.healthProfile[field] || []).filter((_, index) => index !== indexToRemove)
      }
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
      profile.healthCondition !== originalProfile.healthCondition ||
      JSON.stringify(profile.healthProfile) !== JSON.stringify(originalProfile.healthProfile) // Basic check for health profile changes
    );
  };

  // Separate save handler for health profile
  const handleSaveHealthProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await userAPI.updateHealthProfile(profile.healthProfile);

      if (response.data.success) {
        setSuccess("Health profile updated successfully");
        // Update original profile state for health section
        setOriginalProfile(prev => ({ ...prev, healthProfile: profile.healthProfile }));
        // Optionally turn off editing mode if needed, or keep it on
        // setIsEditing(false); 
      } else {
        setError(response.data.error?.message || "Failed to update health profile");
      }
    } catch (error) {
      console.error("Error saving health profile:", error);
      setError("Failed to save health profile changes");
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
          healthCondition: profile.healthCondition !== originalProfile.healthCondition ? profile.healthCondition : undefined,
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
                  className="bg-green-100 hover:bg-green-200 text-green-800"
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

              <div className="space-y-2">
                <Label htmlFor="healthCondition">Health Condition</Label>
                <div className="relative">
                  <FaInfoCircle className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <Input
                    id="healthCondition"
                    name="healthCondition"
                    value={profile.healthCondition}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="pl-10"
                    placeholder="e.g., Healthy, Allergies"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Health Profile Display/Edit */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Health & Dietary Information</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Height */}
              <div className="space-y-1">
                <Label htmlFor="height" className="text-sm font-medium">Height (cm)</Label>
                {isEditing ? (
                  <Input
                    id="height"
                    name="height"
                    type="number"
                    value={profile.healthProfile?.height || ''}
                    onChange={handleHealthProfileInputChange} // Use specific handler
                    placeholder="e.g., 175"
                  />
                ) : (
                  <p>{profile.healthProfile?.height ? `${profile.healthProfile.height} cm` : 'N/A'}</p>
                )}
              </div>
              {/* Weight */}
              <div className="space-y-1">
                <Label htmlFor="weight" className="text-sm font-medium">Weight (kg)</Label>
                {isEditing ? (
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    value={profile.healthProfile?.weight || ''}
                    onChange={handleHealthProfileInputChange} // Use specific handler
                    placeholder="e.g., 70"
                  />
                ) : (
                  <p>{profile.healthProfile?.weight ? `${profile.healthProfile.weight} kg` : 'N/A'}</p>
                )}
              </div>
            </div>

            {/* Allergies - Tag Input Style */}
            <div className="mt-4 space-y-2">
              <Label htmlFor="allergies-input" className="text-sm font-medium">Allergies</Label>
              {isEditing ? (
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(profile.healthProfile?.allergies || []).map((allergy, index) => (
                      <span key={index} className="flex items-center px-2 py-1 text-sm bg-gray-200 rounded-full">
                        {allergy}
                        <button 
                          type="button"
                          onClick={() => handleRemoveTag('allergies', index)} 
                          className="ml-1 text-red-500 hover:text-red-700"
                          aria-label={`Remove ${allergy}`}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="allergies-input"
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      placeholder="Add allergy..."
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag('allergies', allergyInput, setAllergyInput); } }}
                    />
                    <Button type="button" variant="secondary" onClick={() => handleAddTag('allergies', allergyInput, setAllergyInput)}>Add</Button>
                  </div>
                </div>
              ) : (
                <p>{profile.healthProfile?.allergies?.join(', ') || 'None specified'}</p>
              )}
            </div>

            {/* Health Conditions - Tag Input Style */}
            <div className="mt-4 space-y-2">
              <Label htmlFor="conditions-input" className="text-sm font-medium">Health Conditions</Label>
              {isEditing ? (
                 <div>
                   <div className="flex flex-wrap gap-2 mb-2">
                     {(profile.healthProfile?.healthConditions || []).map((condition, index) => (
                       <span key={index} className="flex items-center px-2 py-1 text-sm bg-gray-200 rounded-full">
                         {condition}
                         <button 
                           type="button"
                           onClick={() => handleRemoveTag('healthConditions', index)} 
                           className="ml-1 text-red-500 hover:text-red-700"
                           aria-label={`Remove ${condition}`}
                         >
                           &times;
                         </button>
                       </span>
                     ))}
                   </div>
                   <div className="flex gap-2">
                     <Input
                       id="conditions-input"
                       value={conditionInput}
                       onChange={(e) => setConditionInput(e.target.value)}
                       placeholder="Add condition..."
                       onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag('healthConditions', conditionInput, setConditionInput); } }}
                     />
                     <Button type="button" variant="secondary" onClick={() => handleAddTag('healthConditions', conditionInput, setConditionInput)}>Add</Button>
                   </div>
                 </div>
               ) : (
                 <p>{profile.healthProfile?.healthConditions?.join(', ') || 'None specified'}</p>
               )}
            </div>

            {/* Dietary Preferences - Tag Input Style */}
            <div className="mt-4 space-y-2">
              <Label htmlFor="preferences-input" className="text-sm font-medium">Dietary Preferences</Label>
               {isEditing ? (
                 <div>
                   <div className="flex flex-wrap gap-2 mb-2">
                     {(profile.healthProfile?.dietaryPreferences || []).map((preference, index) => (
                       <span key={index} className="flex items-center px-2 py-1 text-sm bg-gray-200 rounded-full">
                         {preference}
                         <button 
                           type="button"
                           onClick={() => handleRemoveTag('dietaryPreferences', index)} 
                           className="ml-1 text-red-500 hover:text-red-700"
                           aria-label={`Remove ${preference}`}
                         >
                           &times;
                         </button>
                       </span>
                     ))}
                   </div>
                   <div className="flex gap-2">
                     <Input
                       id="preferences-input"
                       value={preferenceInput}
                       onChange={(e) => setPreferenceInput(e.target.value)}
                       placeholder="Add preference..."
                       onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag('dietaryPreferences', preferenceInput, setPreferenceInput); } }}
                     />
                     <Button type="button" variant="secondary" onClick={() => handleAddTag('dietaryPreferences', preferenceInput, setPreferenceInput)}>Add</Button>
                   </div>
                 </div>
               ) : (
                 <p>{profile.healthProfile?.dietaryPreferences?.join(', ') || 'None specified'}</p>
               )}
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
                {/* Vehicle Type (Editable Select) */}
                <div className="space-y-1">
                  <Label htmlFor="vehicleType" className="text-sm font-medium">Vehicle Type</Label>
                  {isEditing ? (
                    <Select
                      value={profile.deliveryRiderDetails?.vehicleType || ''}
                      onValueChange={(value) => handleDeliveryDetailsChange('vehicleType', value)}
                    >
                      <SelectTrigger id="vehicleType">
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bicycle">Bicycle</SelectItem>
                        <SelectItem value="motorcycle">Motorcycle</SelectItem>
                        <SelectItem value="scooter">Scooter</SelectItem>
                        <SelectItem value="car">Car</SelectItem>
                      </SelectContent>
                    </Select>
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
          {profile.role === 'restaurant' && profile.restaurantDetails && (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Restaurant Information</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-500">Restaurant Name</Label>
                  <p>{profile.restaurantDetails.name || 'N/A'}</p>
                </div>
                 <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <p className={`font-medium ${ profile.restaurantDetails.status === 'approved' ? 'text-green-600' : profile.restaurantDetails.status === 'pending_approval' ? 'text-orange-600' : 'text-red-600' }`}>
                     {profile.restaurantDetails.status?.replace('_', ' ') || 'N/A'}
                  </p>
                </div>
                 <div className="space-y-1 md:col-span-2">
                  <Label className="text-sm font-medium text-gray-500">Address</Label>
                  <p>{/* Format address object nicely */}
                     {profile.restaurantDetails.address ? 
                       `${profile.restaurantDetails.address.street || ''}, ${profile.restaurantDetails.address.city || ''}` 
                       : 'N/A'}
                  </p>
                </div>
                {/* Add more restaurant details here if needed */}
              </div>
              {/* Add Edit button linking to restaurant admin later if needed */}
              {/* <Button variant="outline" size="sm" className="mt-4">Manage Restaurant</Button> */}
            </Card>
          )}

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