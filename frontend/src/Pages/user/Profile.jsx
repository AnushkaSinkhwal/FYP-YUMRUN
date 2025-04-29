import { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Label, Alert, Avatar, AvatarFallback, AvatarImage, Switch } from '../../components/ui';
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
  const [fitnessGoalInput, setFitnessGoalInput] = useState('');
  const [favouriteFoodInput, setFavouriteFoodInput] = useState('');
  const [dislikedFoodInput, setDislikedFoodInput] = useState('');

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

  // Keep only activityLevelSelectRef, remove weightGoalSelectRef
  const activityLevelSelectRef = useRef(null);
  
  // Add this new state for debugging
  const [debugInfo, setDebugInfo] = useState({
    clickAttempted: false,
    dropdownOpened: false,
    clientX: 0,
    clientY: 0,
    target: null
  });

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

  // Handler for nested health profile basic fields (height, weight)
  const handleHealthProfileInputChange = (e) => {
    const { name, value } = e.target;
    // Ensure numeric values for height/weight
    const numericValue = value === '' ? '' : parseFloat(value) || 0;
    setProfile(prev => ({
      ...prev,
      healthProfile: {
        ...prev.healthProfile,
        [name]: numericValue
      }
    }));
  };
  
  // Handler for nested dailyTargets fields
  const handleDailyTargetChange = (e) => {
      const { name, value } = e.target;
      const numericValue = value === '' ? '' : parseInt(value, 10) || 0;
      setProfile(prev => ({
          ...prev,
          healthProfile: {
              ...prev.healthProfile,
              dailyTargets: {
                  ...prev.healthProfile.dailyTargets,
                  [name]: numericValue
              }
          }
      }));
  };
  
  // Handler for activityLevel select change
  const handleActivityLevelChange = (value) => {
      setProfile(prev => ({
          ...prev,
          healthProfile: {
              ...prev.healthProfile,
              activityLevel: value
          }
      }));
  };

  // Handler to add a tag to a health profile array field
  // Updated to handle adding to different fields
  const handleAddTag = (field, value, setValue) => {
    const trimmedValue = value.trim();
    if (trimmedValue === '') return;
    setProfile(prev => {
      const currentArray = prev.healthProfile[field] || [];
      // Prevent adding duplicates
      if (currentArray.includes(trimmedValue)) {
        return prev; 
      }
      return {
        ...prev,
        healthProfile: {
          ...prev.healthProfile,
          [field]: [...currentArray, trimmedValue]
        }
      };
    });
    setValue(''); // Clear the input state
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

  // Click debug handler
  const handleDebugClick = (e) => {
    setDebugInfo(prev => ({
      ...prev,
      clickAttempted: true,
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.target.tagName + (e.target.id ? '#' + e.target.id : '')
    }));
    
    // Try to focus the select element
    if (activityLevelSelectRef.current) {
      activityLevelSelectRef.current.focus();
    }
  };
  
  // Focus debug handler
  const handleDebugFocus = () => {
    setDebugInfo(prev => ({
      ...prev,
      dropdownOpened: true
    }));
  };
  
  // Manual selection handler
  const handleManualSelection = (field, value) => {
    if (field === 'activityLevel') {
      handleActivityLevelChange(value);
    } else if (field === 'weightManagementGoal') {
      handleHealthProfileInputChange({ target: { name: 'weightManagementGoal', value }});
    }
  };

  // useEffect for debugging the dropdown
  useEffect(() => {
    if (isEditing && activityLevelSelectRef.current) {
      const selectEl = activityLevelSelectRef.current;
      
      // Log when select element gets focused
      selectEl.addEventListener('focus', () => {
        console.log('Select focused');
      });
      
      // Log when select element gets clicked
      selectEl.addEventListener('click', () => {
        console.log('Select clicked');
      });
      
      // Log when select element changes
      selectEl.addEventListener('change', () => {
        console.log('Select changed');
      });
      
      return () => {
        selectEl.removeEventListener('focus', () => {});
        selectEl.removeEventListener('click', () => {});
        selectEl.removeEventListener('change', () => {});
      };
    }
  }, [isEditing, activityLevelSelectRef]);

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

  // Helper to render tag input fields
  const renderTagInput = (label, field, inputValue, setInputValue) => (
    <div>
      <Label htmlFor={field} className="block mb-2">{label}</Label>
      <div className="flex mb-2">
        <Input
          id={field}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Add ${label.toLowerCase()}...`}
          className="flex-grow mr-2"
          onKeyDown={(e) => {
             if (e.key === 'Enter') {
               e.preventDefault(); // Prevent form submission
               handleAddTag(field, inputValue, setInputValue);
             }
          }}
        />
        <Button type="button" onClick={() => handleAddTag(field, inputValue, setInputValue)}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(profile.healthProfile?.[field] || []).map((item, index) => (
          <span key={index} className="flex items-center px-2 py-1 text-sm bg-gray-200 rounded-full">
            {item}
            <button 
              type="button" 
              onClick={() => handleRemoveTag(field, index)} 
              className="ml-1 text-red-500 hover:text-red-700"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
    </div>
  );

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

            {/* Dietary Preferences */}
            <div className="mt-4 space-y-2">
              {renderTagInput("Dietary Preferences", "dietaryPreferences", preferenceInput, setPreferenceInput)}
            </div>

            {/* Health Conditions */}
            <div className="mt-4 space-y-2">
              {renderTagInput("Health Conditions", "healthConditions", conditionInput, setConditionInput)}
            </div>

            {/* Allergies */}
            <div className="mt-4 space-y-2">
              {renderTagInput("Food Allergies", "allergies", allergyInput, setAllergyInput)}
            </div>

            {/* Fitness Goals */}
            <div className="mt-4 space-y-2">
              {renderTagInput("Fitness Goals", "fitnessGoals", fitnessGoalInput, setFitnessGoalInput)}
            </div>

            {/* Favourite Foods */}
            <div className="mt-4 space-y-2">
              {renderTagInput("Favourite Foods", "favouriteFoods", favouriteFoodInput, setFavouriteFoodInput)}
            </div>

            {/* Disliked Foods */}
            <div className="mt-4 space-y-2">
              {renderTagInput("Disliked Foods", "dislikedFoods", dislikedFoodInput, setDislikedFoodInput)}
            </div>
          </Card>

          {/* Daily Targets Section */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Daily Nutritional Targets</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              <div>
                <Label htmlFor="calories">Calories</Label>
                <Input 
                  id="calories" 
                  name="calories" 
                  type="number" 
                  value={profile.healthProfile?.dailyTargets?.calories || ''} 
                  onChange={handleDailyTargetChange} 
                  placeholder="e.g., 2000"
                />
              </div>
              <div>
                <Label htmlFor="protein">Protein (g)</Label>
                <Input 
                  id="protein" 
                  name="protein" 
                  type="number" 
                  value={profile.healthProfile?.dailyTargets?.protein || ''} 
                  onChange={handleDailyTargetChange} 
                  placeholder="e.g., 50"
                />
              </div>
              <div>
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input 
                  id="carbs" 
                  name="carbs" 
                  type="number" 
                  value={profile.healthProfile?.dailyTargets?.carbs || ''} 
                  onChange={handleDailyTargetChange} 
                  placeholder="e.g., 250"
                />
              </div>
              <div>
                <Label htmlFor="fat">Fat (g)</Label>
                <Input 
                  id="fat" 
                  name="fat" 
                  type="number" 
                  value={profile.healthProfile?.dailyTargets?.fat || ''} 
                  onChange={handleDailyTargetChange} 
                  placeholder="e.g., 70"
                />
              </div>
              <div>
                <Label htmlFor="fiber">Fiber (g)</Label>
                <Input 
                  id="fiber" 
                  name="fiber" 
                  type="number" 
                  value={profile.healthProfile?.dailyTargets?.fiber || ''} 
                  onChange={handleDailyTargetChange} 
                  placeholder="e.g., 25"
                />
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

      {/* Emergency Debug Options - Fixed Position */}
      {isEditing && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '300px',
          padding: '10px',
          backgroundColor: 'red',
          color: 'white',
          zIndex: 10000,
          border: '5px solid black',
          borderRadius: '5px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>EMERGENCY DEBUG</h3>
          
          {/* Debug info display */}
          <div style={{ fontSize: '10px', marginBottom: '10px' }}>
            <p>Click attempted: {debugInfo.clickAttempted ? 'YES' : 'NO'}</p>
            <p>Dropdown opened: {debugInfo.dropdownOpened ? 'YES' : 'NO'}</p>
            <p>Click position: {debugInfo.clientX}, {debugInfo.clientY}</p>
            <p>Click target: {debugInfo.target || 'None'}</p>
          </div>
          
          {/* Super simple dropdown - direct HTML with minimum styling */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              EMERGENCY Activity Level
            </label>
            <select 
              ref={activityLevelSelectRef}
              value={profile.healthProfile?.activityLevel || 'moderately_active'} 
              onChange={(e) => handleActivityLevelChange(e.target.value)}
              onClick={handleDebugClick}
              onFocus={handleDebugFocus}
              style={{
                width: '100%',
                height: '40px',
                fontSize: '16px',
                border: '3px solid black'
              }}
            >
              <option value="sedentary">Sedentary</option>
              <option value="lightly_active">Lightly Active</option>
              <option value="moderately_active">Moderately Active</option>
              <option value="very_active">Very Active</option>
              <option value="extremely_active">Extremely Active</option>
            </select>
          </div>
          
          {/* Buttons as alternative to dropdown */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Button Selection Method
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <button 
                onClick={() => handleManualSelection('activityLevel', 'sedentary')}
                style={{ 
                  padding: '5px',
                  backgroundColor: profile.healthProfile?.activityLevel === 'sedentary' ? 'green' : 'gray',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Sedentary
              </button>
              <button 
                onClick={() => handleManualSelection('activityLevel', 'lightly_active')}
                style={{ 
                  padding: '5px',
                  backgroundColor: profile.healthProfile?.activityLevel === 'lightly_active' ? 'green' : 'gray',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Lightly Active
              </button>
              <button 
                onClick={() => handleManualSelection('activityLevel', 'moderately_active')}
                style={{ 
                  padding: '5px',
                  backgroundColor: profile.healthProfile?.activityLevel === 'moderately_active' ? 'green' : 'gray',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Moderately Active
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 