import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../utils/api';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles.css';
import { FaSignOutAlt } from 'react-icons/fa';
import { Card, Button, Input, Select, Alert, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import PendingChanges from '../../components/Profile/PendingChanges';

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
    
    if (tabParam && ['profile', 'security', 'account'].includes(tabParam)) {
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
          
          {success && (
            <Alert variant="success" className="mb-6">
              {success}
            </Alert>
          )}
          
          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}
          
          <Card>
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <TabsList className="grid grid-cols-3 gap-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="account">Account</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="profile" className="p-6">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1">
                        Full Name
                      </label>
                      <Input
                        type="text"
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-1">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    {/* Restaurant owner specific fields */}
                    {isRestaurantOwner() && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                        <h4 className="text-lg font-semibold mb-4">Restaurant Details</h4>
                        
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="restaurant.name" className="block text-sm font-medium mb-1">
                              Restaurant Name
                            </label>
                            <Input
                              type="text"
                              id="restaurant.name"
                              name="restaurant.name"
                              value={profileData.restaurantDetails.name}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="restaurant.address" className="block text-sm font-medium mb-1">
                              Restaurant Address
                            </label>
                            <Input
                              type="text"
                              id="restaurant.address"
                              name="restaurant.address"
                              value={profileData.restaurantDetails.address}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="restaurant.cuisineType" className="block text-sm font-medium mb-1">
                              Cuisine Type
                            </label>
                            <Input
                              type="text"
                              id="restaurant.cuisineType"
                              name="restaurant.cuisineType"
                              value={profileData.restaurantDetails.cuisineType}
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="restaurant.description" className="block text-sm font-medium mb-1">
                              Description
                            </label>
                            <textarea
                              id="restaurant.description"
                              name="restaurant.description"
                              value={profileData.restaurantDetails.description}
                              onChange={handleInputChange}
                              className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-yumrun-orange focus:ring focus:ring-orange-200 focus:ring-opacity-50 dark:border-gray-700 dark:bg-gray-800"
                              rows="3"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Regular user specific fields */}
                    {!isAdmin() && !isRestaurantOwner() && !isDeliveryStaff() && (
                      <div>
                        <label htmlFor="healthCondition" className="block text-sm font-medium mb-1">
                          Health Condition
                        </label>
                        <Select
                          id="healthCondition"
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
                      </div>
                    )}
                    
                    <div className="pt-4">
                      <Button 
                        type="submit"
                        variant="brand"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="security" className="p-6">
                <form onSubmit={handlePasswordChange}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
                        Current Password
                      </label>
                      <Input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                        New Password
                      </label>
                      <Input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                        Confirm New Password
                      </label>
                      <Input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        required
                      />
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        type="submit"
                        variant="brand"
                      >
                        Change Password
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="account" className="p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Delete Account</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="destructive">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile; 