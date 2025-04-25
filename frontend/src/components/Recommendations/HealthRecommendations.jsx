import { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '../ui';
import { userAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';
import NutritionSummary from '../NutritionTracker/NutritionSummary';
import { useNavigate } from 'react-router-dom';
import { FaSyncAlt, FaLeaf, FaArrowLeft, FaHeart, FaRegHeart, FaShoppingCart } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';

const HealthRecommendations = ({ healthCondition, maxItems = 8 }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState([]);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('health');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendations();
  }, [healthCondition, user?._id]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch health-based recommendations
      const healthParams = new URLSearchParams();
      if (healthCondition) {
        healthParams.append('healthCondition', healthCondition);
      }
      if (user?._id) {
        healthParams.append('userId', user._id);
      }
      
      const healthRecsPromise = userAPI.getHealthRecommendations(healthParams.toString());
      
      // Fetch personalized recommendations if user is logged in
      let personalizedRecsPromise;
      if (user?._id) {
        personalizedRecsPromise = userAPI.getPersonalizedRecommendations(user._id);
      }
      
      // Wait for both requests to complete
      const [healthRecsResponse, personalizedRecsResponse] = await Promise.all([
        healthRecsPromise,
        personalizedRecsPromise || Promise.resolve({ data: { success: true, data: { recommendations: [] } } })
      ]);
      
      if (healthRecsResponse.data.success) {
        setRecommendations(healthRecsResponse.data.data?.recommendations || []);
      } else {
        setError('Failed to fetch health recommendations');
      }
      
      if (personalizedRecsResponse.data.success) {
        setPersonalizedRecommendations(personalizedRecsResponse.data.data?.recommendations || []);
        
        // If we have personalized recommendations, set the active tab to personalized
        if (personalizedRecsResponse.data.data?.recommendations?.length > 0) {
          setActiveTab('personalized');
        }
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('An error occurred while fetching your recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const handleAddToCart = (item) => {
    // Implementation would depend on your cart functionality
    console.log('Adding to cart:', item);
    // Close details view
    setSelectedItem(null);
    
    // Show success message
    alert(`Added ${item.name} to your cart!`);
  };
  
  const handleViewRestaurant = (restaurantId) => {
    navigate(`/restaurant/${restaurantId}`);
  };
  
  const getHealthConditionTitle = () => {
    if (!healthCondition) return 'Healthy Options';
    
    switch(healthCondition) {
      case 'Diabetes':
        return 'Diabetic-Friendly Options';
      case 'Heart Disease':
        return 'Heart-Healthy Options';
      case 'Hypertension':
        return 'Low-Sodium Options';
      default:
        return `${healthCondition} Options`;
    }
  };

  const getHealthBenefits = (item, condition = healthCondition) => {
    // Use the health benefits from the item if available
    if (item.healthBenefits && Array.isArray(item.healthBenefits)) {
      return item.healthBenefits;
    }
    
    // Default benefits based on condition
    if (condition === 'Diabetes') {
      return [
        'Low glycemic index to help manage blood sugar',
        'High in fiber to slow sugar absorption',
        'Balanced macronutrients for steady energy'
      ];
    } else if (condition === 'Heart Disease') {
      return [
        'Low in saturated fats and cholesterol',
        'Rich in heart-healthy omega-3 fatty acids',
        'Reduced sodium content'
      ];
    } else if (condition === 'Hypertension') {
      return [
        'Very low sodium content',
        'Rich in potassium to help regulate blood pressure',
        'Antioxidants to support vascular health'
      ];
    } else {
      return [
        'Well-balanced nutritional profile',
        'Rich in essential vitamins and minerals',
        'Good source of quality protein'
      ];
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <Spinner size="lg" className="mb-4" />
          <p className="text-lg font-medium text-gray-600">Loading your personalized recommendations...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
        <Button onClick={fetchRecommendations} className="w-full mt-2 gap-2">
          <FaSyncAlt className="w-4 h-4" /> Try Again
        </Button>
      </Card>
    );
  }

  const allRecommendationsEmpty = 
    recommendations.length === 0 && 
    personalizedRecommendations.length === 0;
    
  if (allRecommendationsEmpty) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <FaLeaf className="mx-auto w-16 h-16 text-gray-300 mb-4" />
          <h3 className="mb-2 text-xl font-semibold">No Recommendations Found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            We couldn't find any recommendations based on your health profile.
            Try updating your preferences or explore our menu.
          </p>
          <Button className="px-6" onClick={() => navigate('/restaurants')}>
            Browse Restaurants
          </Button>
        </div>
      </Card>
    );
  }

  // If an item is selected, show its details
  if (selectedItem) {
    // Prepare nutritional info object
    const nutritionalInfo = {
      calories: selectedItem.calories,
      protein: selectedItem.protein,
      carbs: selectedItem.carbs,
      fat: selectedItem.fat,
      sodium: selectedItem.sodium,
      fiber: selectedItem.fiber,
      sugar: selectedItem.sugar
    };
    
    // Get health benefits for the selected item
    const healthBenefits = getHealthBenefits(selectedItem);
    
    return (
      <Card className="p-6">
        <button 
          onClick={() => setSelectedItem(null)}
          className="mb-6 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium"
        >
          <FaArrowLeft className="w-3 h-3" /> Back to recommendations
        </button>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <img 
              src={selectedItem.image || '/uploads/placeholders/food-placeholder.jpg'} 
              alt={selectedItem.name} 
              className="object-cover w-full rounded-lg h-60 shadow-md"
            />
            
            <div className="mt-6">
              <h2 className="text-2xl font-bold">{selectedItem.name}</h2>
              <p className="mt-1 text-lg text-gray-600 font-medium">
                {formatCurrency(selectedItem.price)}
              </p>
              
              <div className="flex items-center mt-3 space-x-2 flex-wrap gap-2">
                {selectedItem.healthAttributes && Object.entries(selectedItem.healthAttributes)
                  .filter(([_, value]) => value === true)
                  .map(([key]) => {
                    // Convert camelCase to readable format
                    const label = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, str => str.toUpperCase())
                      .replace('Is ', '');
                    
                    return (
                      <Badge key={key} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {label}
                      </Badge>
                    );
                  })
                }
                
                {selectedItem.isVegetarian && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Vegetarian
                  </Badge>
                )}
                
                {selectedItem.isVegan && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Vegan
                  </Badge>
                )}
                
                {selectedItem.isGlutenFree && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Gluten Free
                  </Badge>
                )}
              </div>
              
              <p className="mt-4 text-sm text-gray-600">{selectedItem.description}</p>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Customization Options</h3>
                
                {selectedItem.isCustomizable ? (
                  <div className="text-sm text-gray-600">
                    <p>This item can be customized to better suit your dietary needs.</p>
                    <p className="mt-2">You'll be able to:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Add or remove ingredients</li>
                      <li>Adjust serving size</li>
                      <li>Select cooking method</li>
                      <li>Add special instructions</li>
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    This item has limited customization options. Please view the restaurant for more details.
                  </p>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={() => handleAddToCart(selectedItem)}
                  className="flex-1 gap-2"
                >
                  <FaShoppingCart className="w-4 h-4" /> Add to Cart
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleViewRestaurant(selectedItem.restaurantId)}
                  className="flex-1"
                >
                  View Restaurant
                </Button>
              </div>
            </div>
          </div>
          
          <div>
            <NutritionSummary 
              nutritionalInfo={nutritionalInfo} 
              healthProfile={user?.healthProfile}
              showHealthTips={true}
            />
            
            <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="mb-3 text-lg font-semibold">Health Benefits</h3>
              <ul className="pl-5 mt-2 space-y-2 list-disc">
                {healthBenefits.map((benefit, index) => (
                  <li key={index} className="text-gray-700">{benefit}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Show tabs if we have both types of recommendations
  const showTabs = personalizedRecommendations.length > 0 && recommendations.length > 0;
  
  // Filter recommendations to show only up to maxItems
  const filteredHealthRecs = recommendations.slice(0, maxItems);
  const filteredPersonalizedRecs = personalizedRecommendations.slice(0, maxItems);
  
  // Determine which recommendations to display based on active tab
  const displayedRecommendations = activeTab === 'personalized' && personalizedRecommendations.length > 0 
    ? filteredPersonalizedRecs 
    : filteredHealthRecs;
  
  // Show the list of recommendations
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {activeTab === 'personalized' ? 'Personalized Recommendations' : getHealthConditionTitle()}
        </h2>
        <Button variant="outline" size="sm" onClick={fetchRecommendations} className="gap-2">
          <FaSyncAlt className="w-3 h-3" /> Refresh
        </Button>
      </div>
      
      {user?.healthProfile && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-800">
          <p className="font-medium">Your health preferences are being used for these recommendations.</p>
          <p className="mt-1 text-blue-600">
            {user.healthProfile.dietaryPreferences?.filter(p => p !== 'None').join(', ')} • 
            {user.healthProfile.healthConditions?.filter(c => c !== 'None').join(', ')}
          </p>
        </div>
      )}
      
      {showTabs && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personalized">Personalized</TabsTrigger>
            <TabsTrigger value="health">Health-Focused</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayedRecommendations.map((item) => (
          <Card 
            key={item.id} 
            className="overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 border border-gray-100"
            onClick={() => handleItemClick(item)}
          >
            <div className="relative">
              <img 
                src={item.image || '/uploads/placeholders/food-placeholder.jpg'} 
                alt={item.name} 
                className="object-cover w-full h-40"
              />
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                {item.isCustomizable && (
                  <Badge className="bg-blue-500 hover:bg-blue-600">
                    Customizable
                  </Badge>
                )}
                
                {Object.entries(item.healthAttributes || {})
                  .filter(([_, value]) => value === true)
                  .slice(0, 1) // Only show the first health attribute as a badge
                  .map(([key]) => {
                    // Convert camelCase to readable format
                    const label = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, str => str.toUpperCase())
                      .replace('Is ', '');
                    
                    return (
                      <Badge key={key} className="bg-green-500 hover:bg-green-600">
                        {label}
                      </Badge>
                    );
                  })
                }
              </div>
              
              <button 
                className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  // Implement favorite functionality
                  console.log('Toggle favorite:', item.id);
                }}
              >
                <FaRegHeart className="w-4 h-4 text-red-500" />
              </button>
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-lg leading-tight">{item.name}</h3>
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{item.description}</p>
              
              <div className="mt-3 flex items-center justify-between">
                <span className="font-medium text-gray-900">{formatCurrency(item.price)}</span>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-500">{item.calories} cal</span>
                </div>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-1">
                {item.healthBenefits && item.healthBenefits.slice(0, 2).map((benefit, idx) => (
                  <span key={idx} className="inline-block px-2 py-1 text-xs bg-gray-100 rounded-full text-gray-800">
                    {benefit}
                  </span>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-3 gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(item);
                }}
              >
                <FaShoppingCart className="w-3 h-3" /> Add to Cart
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      {displayedRecommendations.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No recommendations available. Try changing your filters.</p>
        </div>
      )}
    </Card>
  );
};

HealthRecommendations.propTypes = {
  healthCondition: PropTypes.string,
  maxItems: PropTypes.number
};

export default HealthRecommendations; 