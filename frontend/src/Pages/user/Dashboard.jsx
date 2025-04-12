import { useState, useEffect } from 'react';
import { Card, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../utils/api';
import LoyaltyDashboard from '../../components/Loyalty/LoyaltyDashboard';
import HealthRecommendations from '../../components/Recommendations/HealthRecommendations';
import NutritionSummary from '../../components/NutritionTracker/NutritionSummary';
import HealthProfile from '../../components/Profile/HealthProfile';
import { formatDate } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('recommendations');
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
                onClick={() => setActiveTab('recommendations')}
                className={`w-full text-left p-2 rounded-md ${activeTab === 'recommendations' ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                Personalized Recommendations
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className={`w-full text-left p-2 rounded-md ${activeTab === 'health' ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                Health Profile
              </button>
              <button
                onClick={() => setActiveTab('nutrition')}
                className={`w-full text-left p-2 rounded-md ${activeTab === 'nutrition' ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                Nutrition Tracker
              </button>
              <button
                onClick={() => setActiveTab('calorie')}
                className={`w-full text-left p-2 rounded-md ${activeTab === 'calorie' ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                Calorie Counter
              </button>
              <button
                onClick={() => setActiveTab('loyalty')}
                className={`w-full text-left p-2 rounded-md ${activeTab === 'loyalty' ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                Loyalty Points
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full text-left p-2 rounded-md ${activeTab === 'orders' ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                Order History
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
              <div className="text-xs text-gray-500">
                <p>Dietary Preferences: {profile.healthProfile.dietaryPreferences.join(', ')}</p>
                <p>Health Conditions: {profile.healthProfile.healthConditions.join(', ')}</p>
                {profile.healthProfile.allergies?.length > 0 && (
                  <p>Allergies: {profile.healthProfile.allergies.join(', ')}</p>
                )}
                {profile.healthProfile.dailyCalorieGoal && (
                  <p>Daily Calorie Goal: {profile.healthProfile.dailyCalorieGoal} kcal</p>
                )}
              </div>
            </Card>
          )}
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div>
              <h2 className="mb-6 text-2xl font-bold">Your Personalized Recommendations</h2>
              <HealthRecommendations healthCondition={profile?.healthCondition} />
            </div>
          )}
          
          {/* Health Profile Tab */}
          {activeTab === 'health' && (
            <div>
              <h2 className="mb-6 text-2xl font-bold">Health Profile</h2>
              <HealthProfile />
            </div>
          )}
          
          {/* Nutrition Tracker Tab */}
          {activeTab === 'nutrition' && (
            <div>
              <h2 className="mb-6 text-2xl font-bold">Nutrition Tracker</h2>
              
              {orderHistory.length > 0 ? (
                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="mb-4 text-lg font-semibold">Recent Meals Nutritional Summary</h3>
                    {orderHistory.slice(0, 3).map((order) => (
                      <div key={order.id} className="py-3 border-b last:border-0">
                        <div className="flex justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{formatDate(order.createdAt, { hour: undefined, minute: undefined })}</h4>
                            <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
                          </div>
                          <Button variant="link" onClick={() => navigate(`/orders/${order.id}`)}>
                            View Details
                          </Button>
                        </div>
                        <NutritionSummary 
                          nutritionalInfo={order.totalNutritionalInfo} 
                          dailyGoals={profile?.healthProfile?.dailyCalorieGoal ? {
                            calories: profile.healthProfile.dailyCalorieGoal,
                            protein: profile.healthProfile.dailyCalorieGoal * (profile.healthProfile.macroTargets.protein / 100) / 4,
                            carbs: profile.healthProfile.dailyCalorieGoal * (profile.healthProfile.macroTargets.carbs / 100) / 4,
                            fat: profile.healthProfile.dailyCalorieGoal * (profile.healthProfile.macroTargets.fat / 100) / 9
                          } : undefined}
                        />
                      </div>
                    ))}
                  </Card>
                  
                  <Card className="p-6">
                    <h3 className="mb-4 text-lg font-semibold">Nutritional Tips Based on Your Diet</h3>
                    <ul className="ml-6 space-y-2 list-disc">
                      {profile?.healthCondition === 'Diabetes' && (
                        <>
                          <li>Focus on low glycemic index foods to maintain stable blood sugar levels</li>
                          <li>Aim for consistent meal times and portion sizes</li>
                          <li>Increase fiber intake to help regulate glucose absorption</li>
                        </>
                      )}
                      
                      {profile?.healthCondition === 'Heart Condition' && (
                        <>
                          <li>Choose foods low in saturated fats and trans fats</li>
                          <li>Limit sodium intake to less than 2,300mg per day</li>
                          <li>Include heart-healthy omega-3 fatty acids in your diet</li>
                        </>
                      )}
                      
                      {profile?.healthCondition === 'Hypertension' && (
                        <>
                          <li>Follow a DASH diet approach (Dietary Approaches to Stop Hypertension)</li>
                          <li>Limit sodium to 1,500-2,300mg per day</li>
                          <li>Include potassium-rich foods to help control blood pressure</li>
                        </>
                      )}
                      
                      {(!profile?.healthCondition || profile?.healthCondition === 'Healthy') && (
                        <>
                          <li>Maintain a balanced diet with a variety of nutrients</li>
                          <li>Focus on whole foods rather than processed options</li>
                          <li>Stay hydrated and limit sugary beverages</li>
                        </>
                      )}
                    </ul>
                  </Card>
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <h3 className="mb-2 text-lg font-semibold">No Order History</h3>
                  <p className="mb-4 text-gray-500">
                    You haven't placed any orders yet. Order meals to start tracking your nutrition.
                  </p>
                  <Button onClick={() => navigate('/restaurants')}>
                    Browse Restaurants
                  </Button>
                </Card>
              )}
            </div>
          )}
          
          {/* Calorie Counter Tab (New) */}
          {activeTab === 'calorie' && (
            <div>
              <h2 className="mb-6 text-2xl font-bold">Calorie Counter</h2>
              
              <Card className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Daily Calorie Information</h3>
                
                {profile?.healthProfile?.dailyCalorieGoal ? (
                  <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-blue-50">
                      <h4 className="font-semibold text-blue-700">Your Daily Calorie Goal</h4>
                      <div className="flex items-center mt-2">
                        <div className="flex items-center justify-center w-16 h-16 mr-4 text-xl font-bold text-white bg-blue-500 rounded-full">
                          {profile.healthProfile.dailyCalorieGoal}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Calories per day based on your:</p>
                          <ul className="pl-5 mt-1 text-sm text-gray-600 list-disc">
                            <li>Activity level: {profile.healthProfile.fitnessLevel || 'Not specified'}</li>
                            <li>Goal: {profile.healthProfile.weightManagementGoal || 'Not specified'}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    {orderHistory.length > 0 ? (
                      <div>
                        <h4 className="mb-2 font-semibold">Today&apos;s Consumption</h4>
                        {/* This is a placeholder - in a real app, you would filter by today's date */}
                        <div className="p-4 rounded-lg bg-gray-50">
                          <div className="flex justify-between mb-1">
                            <span>Total calories consumed today:</span>
                            <span className="font-semibold">{orderHistory[0]?.totalNutritionalInfo?.calories || 0} cal</span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span>Remaining calories:</span>
                            <span className="font-semibold">{(profile.healthProfile.dailyCalorieGoal - (orderHistory[0]?.totalNutritionalInfo?.calories || 0))} cal</span>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <Button onClick={() => navigate('/restaurants')} className="w-full">
                            Order a Meal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center rounded-lg bg-gray-50">
                        <p className="mb-4 text-gray-500">
                          No calorie data available. Place orders to track your calorie intake.
                        </p>
                        <Button onClick={() => navigate('/restaurants')}>
                          Browse Restaurants
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="mb-4 text-gray-500">
                      You haven&apos;t set your daily calorie goal yet. Complete your health profile to get started.
                    </p>
                    <Button onClick={() => setActiveTab('health')}>
                      Set Calorie Goal
                    </Button>
                  </div>
                )}
              </Card>
              
              <Card className="p-6 mt-6">
                <h3 className="mb-4 text-lg font-semibold">Macro Distribution</h3>
                
                {profile?.healthProfile?.macroTargets ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 rounded-lg bg-green-50">
                      <h4 className="text-green-700">Protein</h4>
                      <p className="mt-1 text-2xl font-bold text-green-700">{profile.healthProfile.macroTargets.protein}%</p>
                      <p className="mt-1 text-sm text-gray-600">
                        ~{Math.round(profile.healthProfile.dailyCalorieGoal * (profile.healthProfile.macroTargets.protein / 100) / 4)}g per day
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-blue-50">
                      <h4 className="text-blue-700">Carbohydrates</h4>
                      <p className="mt-1 text-2xl font-bold text-blue-700">{profile.healthProfile.macroTargets.carbs}%</p>
                      <p className="mt-1 text-sm text-gray-600">
                        ~{Math.round(profile.healthProfile.dailyCalorieGoal * (profile.healthProfile.macroTargets.carbs / 100) / 4)}g per day
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-yellow-50">
                      <h4 className="text-yellow-700">Fat</h4>
                      <p className="mt-1 text-2xl font-bold text-yellow-700">{profile.healthProfile.macroTargets.fat}%</p>
                      <p className="mt-1 text-sm text-gray-600">
                        ~{Math.round(profile.healthProfile.dailyCalorieGoal * (profile.healthProfile.macroTargets.fat / 100) / 9)}g per day
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="mb-4 text-gray-500">
                      You haven&apos;t set your macro targets yet. Complete your health profile to track macronutrients.
                    </p>
                    <Button onClick={() => setActiveTab('health')}>
                      Set Macro Targets
                    </Button>
                  </div>
                )}
              </Card>
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
                          <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{order.orderNumber}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">Rs. {order.totalAmount}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'}`}
                              >
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{order.restaurant?.name || 'Unknown'}</div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                              <Button 
                                variant="link" 
                                onClick={() => navigate(`/orders/${order.id}`)}
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
                    You haven't placed any orders yet.
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