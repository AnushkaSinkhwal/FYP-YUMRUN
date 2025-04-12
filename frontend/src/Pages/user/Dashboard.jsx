import { useState, useEffect } from 'react';
import { Card, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../utils/api';
import LoyaltyDashboard from '../../components/Loyalty/LoyaltyDashboard';
import HealthProfile from '../../components/Profile/HealthProfile';
import { formatDate } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [profile, setProfile] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user profile
      const profileResponse = await userAPI.getProfile();
      if (profileResponse.data.success) {
        setProfile(profileResponse.data.data);
      }
      
      // Fetch order history
      const orderResponse = await userAPI.getOrders();
      if (orderResponse.data.success) {
        setOrderHistory(orderResponse.data.data);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('An error occurred while loading your dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container p-6 mx-auto">
        <div className="text-center">
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-6 mx-auto">
        <div className="p-6 text-center bg-red-100 rounded-lg">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchUserData} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-6 mx-auto">
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-1/4">
          <Card className="p-6">
            <div className="mb-6 text-center">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-2 text-2xl font-bold text-center text-white rounded-full bg-primary">
                {currentUser?.fullName?.charAt(0) || 'U'}
              </div>
              <h2 className="text-xl font-bold">{currentUser?.fullName || 'User'}</h2>
              <p className="text-gray-500">{currentUser?.email}</p>
              
              {profile?.healthCondition && (
                <div className="inline-block px-3 py-1 mt-2 text-xs text-white bg-blue-500 rounded-full">
                  {profile.healthCondition}
                </div>
              )}
            </div>
            
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full text-left p-2 rounded-md ${activeTab === 'orders' ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                Order History
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className={`w-full text-left p-2 rounded-md ${activeTab === 'health' ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                Health Profile
              </button>
              <button
                onClick={() => setActiveTab('loyalty')}
                className={`w-full text-left p-2 rounded-md ${activeTab === 'loyalty' ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                Loyalty Points
              </button>
            </nav>
            
            <div className="pt-4 mt-6 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/profile')}
              >
                Edit Profile
              </Button>
              <Button
                variant="ghost"
                className="w-full mt-2"
                onClick={() => navigate('/')}
              >
                Return to Home
              </Button>
            </div>
          </Card>
          
          {/* Health Summary */}
          {profile?.healthProfile && activeTab !== 'health' && (
            <Card className="p-4 mt-4">
              <h3 className="mb-2 text-sm font-medium">Health Summary</h3>
              {profile.healthProfile.dietaryPreferences?.length > 0 && (
                <p className="text-xs text-gray-500">Dietary: {profile.healthProfile.dietaryPreferences.join(', ')}</p>
              )}
              {profile.healthProfile.healthConditions?.length > 0 && (
                <p className="text-xs text-gray-500">Conditions: {profile.healthProfile.healthConditions.join(', ')}</p>
              )}
              {profile.healthProfile.allergies?.length > 0 && (
                <p className="text-xs text-gray-500">Allergies: {profile.healthProfile.allergies.join(', ')}</p>
              )}
            </Card>
          )}
        </div>
        
        {/* Main Content */}
        <div className="flex-1">          
          {/* Health Profile Tab */}
          {activeTab === 'health' && (
            <div>
              <h2 className="mb-6 text-2xl font-bold">Health Profile</h2>
              <HealthProfile />
            </div>
          )}
          
          {/* Loyalty Tab */}
          {activeTab === 'loyalty' && (
            <div>
              <h2 className="mb-6 text-2xl font-bold">Loyalty Points</h2>
              <LoyaltyDashboard />
            </div>
          )}
          
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="mb-6 text-2xl font-bold">Order History</h2>
              
              {orderHistory.length > 0 ? (
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Order ID</th>
                          <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                          <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Total</th>
                          <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                          <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Restaurant</th>
                          <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orderHistory.map((order) => (
                          <tr key={order._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{order.orderNumber}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">Rs. {order.grandTotal}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                                order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                                order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' : 
                                order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                                'bg-gray-100 text-gray-800'}`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{order.restaurantId?.restaurantDetails?.name || 'Unknown'}</div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                              <Button 
                                variant="link" 
                                onClick={() => navigate(`/orders/${order._id}`)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 text-center">
                  <h3 className="mb-2 text-lg font-semibold">No Order History</h3>
                  <p className="mb-4 text-gray-500">
                    You haven&apos;t placed any orders yet.
                  </p>
                  <Button onClick={() => navigate('/restaurants')}>
                    Browse Restaurants
                  </Button>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard; 