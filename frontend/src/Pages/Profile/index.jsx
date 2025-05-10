import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../utils/api';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles.css';
import { FaSignOutAlt } from 'react-icons/fa';
import { Card, Button, Input, Select, Alert } from '../../components/ui';
import PendingChanges from '../../components/Profile/PendingChanges';
import HealthProfile from '../../components/Profile/HealthProfile';

const Profile = () => {
  const { currentUser, logout, isAdmin, isRestaurantOwner, isDeliveryStaff } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    healthCondition: 'Healthy',
    restaurantDetails: {
      name: '',
      address: '',
      description: '',
      cuisineType: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Check for tab query parameter
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get('tab');
    
    if (tabParam && ['profile', 'security', 'account', 'health'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (currentUser) {
      // Set basic profile data
      setProfileData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        healthCondition: currentUser.healthCondition || 'Healthy',
        restaurantDetails: {
          name: currentUser.restaurantDetails?.name || '',
          address: currentUser.restaurantDetails?.address || '',
          description: currentUser.restaurantDetails?.description || '',
          cuisineType: currentUser.restaurantDetails?.cuisineType || ''
        }
      });
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested restaurant details
    if (name.startsWith('restaurant.')) {
      const detailField = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        restaurantDetails: {
          ...prev.restaurantDetails,
          [detailField]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare data for submission based on user type
      const dataToSubmit = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone
      };
      
      // Add role-specific data
      if (isRestaurantOwner()) {
        dataToSubmit.restaurantDetails = profileData.restaurantDetails;
      } else if (!isAdmin() && !isDeliveryStaff()) {
        // Regular user data
        dataToSubmit.healthCondition = profileData.healthCondition;
      }
      
      const response = await userAPI.updateProfile(dataToSubmit);
      
      if (response.data.success) {
        setSuccess(response.data.message || 'Profile updated successfully!');
        
        // If not a restaurant owner or pending approval not required, update local storage
        if (!isRestaurantOwner() || !response.data.pendingChanges) {
          // Update local storage with new user data if needed
          const userData = JSON.parse(localStorage.getItem('userData'));
          if (userData) {
            const updatedUserData = { ...userData, ...dataToSubmit };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
          }
        }
      } else {
        setError(response.data.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while updating your profile');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    // Password change functionality (to be implemented)
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card className="mb-6">
            <div className="p-4 text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-500">
                  {currentUser?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <h5 className="text-xl font-bold mb-1">{currentUser?.name || 'User'}</h5>
              <p className="text-gray-500 mb-1">{currentUser?.email}</p>
              <p className="text-sm text-gray-500 mb-4">
                {isAdmin() ? 'Administrator' : 
                 isRestaurantOwner() ? 'Restaurant Owner' : 
                 isDeliveryStaff() ? 'Delivery Staff' : 'Customer'}
              </p>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <nav className="space-y-2">
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setActiveTab('profile'); }}
                  className={`block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${activeTab === 'profile' ? 'bg-gray-100 dark:bg-gray-800 font-medium' : ''}`}
                >
                  Profile Settings
                </a>
                {/* Only show Health Profile tab for customers */}
                {!isAdmin() && !isRestaurantOwner() && !isDeliveryStaff() && (
                  <>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setActiveTab('health'); }}
                      className={`block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${activeTab === 'health' ? 'bg-gray-100 dark:bg-gray-800 font-medium' : ''}`}
                    >
                      Health Profile
                    </a>
                  </>
                )}
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setActiveTab('security'); }}
                  className={`block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${activeTab === 'security' ? 'bg-gray-100 dark:bg-gray-800 font-medium' : ''}`}
                >
                  Security
                </a>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setActiveTab('account'); }}
                  className={`block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${activeTab === 'account' ? 'bg-gray-100 dark:bg-gray-800 font-medium' : ''}`}
                >
                  Account
                </a>
                
                <div className="border-t border-gray-200 dark:border-gray-700 my-4 pt-4">
                  <Button 
                    variant="destructive"
                    onClick={handleLogout}
                    className="w-full"
                  >
                    <FaSignOutAlt className="mr-2" /> Logout
                  </Button>
                </div>
              </nav>
            </div>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          {/* Display pending changes banner if restaurant owner */}
          {isRestaurantOwner() && (
            <PendingChanges />
          )}
          
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>
              
              {success && (
                <Alert variant="success" className="mb-4">
                  {success}
                </Alert>
              )}
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  {error}
                </Alert>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <Input 
                      name="name" 
                      value={profileData.name} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <Input 
                      type="email" 
                      name="email" 
                      value={profileData.email} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <Input 
                      name="phone" 
                      value={profileData.phone} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  
                  {/* Show health condition dropdown only for regular users */}
                  {!isAdmin() && !isRestaurantOwner() && !isDeliveryStaff() && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Health Condition</label>
                      <Select 
                        name="healthCondition" 
                        value={profileData.healthCondition} 
                        onChange={handleInputChange}
                      >
                        <option value="Healthy">Healthy</option>
                        <option value="Diabetes">Diabetes</option>
                        <option value="Heart Condition">Heart Condition</option>
                        <option value="Hypertension">Hypertension</option>
                        <option value="Other">Other</option>
                      </Select>
                      <p className="text-sm text-gray-500 mt-1">
                        For more detailed health preferences, visit the &quot;Health Profile&quot; tab.
                      </p>
                    </div>
                  )}
                  
                  {/* Restaurant owner specific fields */}
                  {isRestaurantOwner() && (
                    <>
                      <div className="border-t pt-4 mt-4">
                        <h3 className="text-xl font-semibold mb-4">Restaurant Details</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Restaurant Name</label>
                            <Input 
                              name="restaurant.name" 
                              value={profileData.restaurantDetails.name} 
                              onChange={handleInputChange} 
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2">Restaurant Address</label>
                            <Input 
                              name="restaurant.address" 
                              value={profileData.restaurantDetails.address} 
                              onChange={handleInputChange} 
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2">Description</label>
                            <textarea 
                              name="restaurant.description" 
                              value={profileData.restaurantDetails.description} 
                              onChange={handleInputChange}
                              className="w-full rounded-md border border-gray-300 p-2"
                              rows="3"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2">Cuisine Type</label>
                            <Input 
                              name="restaurant.cuisineType" 
                              value={profileData.restaurantDetails.cuisineType} 
                              onChange={handleInputChange} 
                              placeholder="e.g., Italian, Chinese, Indian" 
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full md:w-auto"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          )}
          
          {/* Health Profile Tab */}
          {activeTab === 'health' && !isAdmin() && !isRestaurantOwner() && !isDeliveryStaff() && (
            <HealthProfile />
          )}
          
          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Security Settings</h2>
              
              <form onSubmit={handlePasswordChange}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Password</label>
                    <Input 
                      type="password" 
                      name="currentPassword" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">New Password</label>
                    <Input 
                      type="password" 
                      name="newPassword" 
                      required 
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Password must be at least 8 characters long and include at least one uppercase letter, 
                      one lowercase letter, one number, and one special character.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                    <Input 
                      type="password" 
                      name="confirmPassword" 
                      required 
                    />
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto"
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          )}
          
          {/* Account Tab */}
          {activeTab === 'account' && (
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Delete Account</h3>
                  <p className="text-gray-500 mb-4">
                    This action is irreversible. All of your data will be permanently deleted.
                  </p>
                  <Button 
                    variant="destructive"
                  >
                    Delete My Account
                  </Button>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-2">Export My Data</h3>
                  <p className="text-gray-500 mb-4">
                    Download a copy of all the personal data associated with your account.
                  </p>
                  <Button>
                    Export Data
                  </Button>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-2">Privacy Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="marketing" 
                        className="mr-2" 
                      />
                      <label htmlFor="marketing">
                        Receive marketing emails
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="orderUpdates" 
                        className="mr-2" 
                        defaultChecked 
                      />
                      <label htmlFor="orderUpdates">
                        Receive order updates via email
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="shareData" 
                        className="mr-2" 
                      />
                      <label htmlFor="shareData">
                        Share my order history for personalized recommendations
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 