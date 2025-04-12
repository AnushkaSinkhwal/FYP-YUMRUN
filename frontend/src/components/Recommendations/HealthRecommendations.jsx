import { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner } from '../ui';
import { userAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';
import NutritionSummary from '../NutritionTracker/NutritionSummary';
import { useNavigate } from 'react-router-dom';
import { FaSyncAlt, FaLeaf, FaArrowLeft } from 'react-icons/fa';
import PropTypes from 'prop-types';

const HealthRecommendations = ({ healthCondition }) => {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendations();
  }, [healthCondition]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userAPI.getPersonalizedRecommendations();
      
      if (response.data.success) {
        setRecommendations(response.data.data.recommendations || []);
      } else {
        setError('Failed to fetch recommendations');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('An error occurred while fetching your personalized recommendations');
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
      case 'Heart Condition':
        return 'Heart-Healthy Options';
      case 'Hypertension':
        return 'Low-Sodium Options';
      default:
        return 'Personalized Recommendations';
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

  if (recommendations.length === 0) {
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
              src={selectedItem.image} 
              alt={selectedItem.name} 
              className="object-cover w-full rounded-lg h-60 shadow-md"
            />
            
            <div className="mt-6">
              <h2 className="text-2xl font-bold">{selectedItem.name}</h2>
              <p className="mt-1 text-lg text-gray-600 font-medium">
                {formatCurrency(selectedItem.price)}
              </p>
              
              <div className="flex items-center mt-3 space-x-2">
                <span className="px-3 py-1 text-xs font-medium text-white bg-green-500 rounded-full">
                  {selectedItem.healthTag}
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-600">{selectedItem.rating}</span>
                </span>
              </div>
              
              <p className="mt-4 text-sm text-gray-600">
                From {selectedItem.restaurant} • {selectedItem.location}
              </p>
              
              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={() => handleAddToCart(selectedItem)}
                  className="flex-1"
                >
                  Add to Cart
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
            <NutritionSummary nutritionalInfo={selectedItem.nutritionalInfo} />
            
            <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="mb-3 text-lg font-semibold">Health Benefits</h3>
              <ul className="pl-5 mt-2 space-y-2 list-disc">
                {healthCondition === 'Diabetes' && (
                  <>
                    <li>Low glycemic index to help manage blood sugar</li>
                    <li>High in fiber to slow sugar absorption</li>
                    <li>Balanced macronutrients for steady energy</li>
                  </>
                )}
                
                {healthCondition === 'Heart Condition' && (
                  <>
                    <li>Low in saturated fats and cholesterol</li>
                    <li>Rich in heart-healthy omega-3 fatty acids</li>
                    <li>Reduced sodium content</li>
                  </>
                )}
                
                {healthCondition === 'Hypertension' && (
                  <>
                    <li>Very low sodium content</li>
                    <li>Rich in potassium to help regulate blood pressure</li>
                    <li>Antioxidants to support vascular health</li>
                  </>
                )}
                
                {(!healthCondition || healthCondition === 'Healthy') && (
                  <>
                    <li>Well-balanced nutritional profile</li>
                    <li>Rich in essential vitamins and minerals</li>
                    <li>Good source of quality protein</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Show the list of recommendations
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{getHealthConditionTitle()}</h2>
        <Button variant="outline" size="sm" onClick={fetchRecommendations} className="gap-2">
          <FaSyncAlt className="w-3 h-3" /> Refresh
        </Button>
      </div>
      
      <p className="mb-6 text-gray-600">
        <strong>Health insights:</strong> These recommendations are based on your health condition: {healthCondition || 'Healthy'}
      </p>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {recommendations.map((item) => (
          <Card 
            key={item.id} 
            className="overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 border border-gray-100"
            onClick={() => handleItemClick(item)}
          >
            <div className="relative">
              <img 
                src={item.image} 
                alt={item.name} 
                className="object-cover w-full h-40"
              />
              <span className="absolute top-2 right-2 px-2 py-1 text-xs font-medium text-white bg-green-500 rounded-full shadow-sm">
                {item.healthTag}
              </span>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold truncate">{item.name}</h3>
                <span className="text-sm font-medium text-gray-700">
                  {formatCurrency(item.price)}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate mb-3">
                {item.restaurant} • {item.location}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <span className="ml-1 text-xs font-medium">{item.rating}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs px-2 py-1 hover:bg-gray-100"
                >
                  View
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

HealthRecommendations.propTypes = {
  healthCondition: PropTypes.string
};

HealthRecommendations.defaultProps = {
  healthCondition: 'Healthy'
};

export default HealthRecommendations; 