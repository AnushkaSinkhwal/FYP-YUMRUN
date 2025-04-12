import { useState, useEffect } from 'react';
import { Card, Input, Button, Select, Checkbox, Slider } from '../ui';
import { userAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AdvancedSearch = ({ onSearch, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    query: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    dietaryPreferences: [],
    healthConditions: [],
    allergens: [],
    minCalories: '',
    maxCalories: '',
    maxCarbs: '',
    minProtein: '',
    ...initialFilters
  });
  
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch user profile to get health data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await userAPI.getProfile();
        if (response.data.success) {
          setUserProfile(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (category, value) => {
    setFilters(prev => {
      const currentValues = prev[category] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [category]: newValues
      };
    });
  };

  const handleRangeChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Filter out empty values
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) acc[key] = value;
      } else if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    if (onSearch) {
      onSearch(cleanFilters);
    } else {
      // Build query string and navigate to search page
      const queryParams = new URLSearchParams();
      Object.entries(cleanFilters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else {
          queryParams.append(key, value);
        }
      });
      
      navigate(`/search?${queryParams.toString()}`);
    }
    
    setLoading(false);
  };

  const handleReset = () => {
    setFilters({
      query: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      dietaryPreferences: [],
      healthConditions: [],
      allergens: [],
      minCalories: '',
      maxCalories: '',
      maxCarbs: '',
      minProtein: ''
    });
  };

  const useHealthProfile = () => {
    if (!userProfile || !userProfile.healthProfile) return;
    
    // Apply user's health profile to filters
    setFilters(prev => ({
      ...prev,
      dietaryPreferences: userProfile.healthProfile.dietaryPreferences.filter(p => p !== 'None'),
      healthConditions: userProfile.healthProfile.healthConditions.filter(c => c !== 'None'),
      allergens: userProfile.healthProfile.allergies || []
    }));
  };

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-xl font-semibold">Advanced Search</h3>
      
      <form onSubmit={handleApplyFilters}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Basic search */}
          <div className="lg:col-span-3">
            <label className="block mb-1 text-sm font-medium">Search</label>
            <Input
              type="text"
              name="query"
              value={filters.query}
              onChange={handleInputChange}
              placeholder="Search for food items..."
              className="w-full"
            />
          </div>
          
          {/* Category filter */}
          <div>
            <label className="block mb-1 text-sm font-medium">Category</label>
            <Select
              name="category"
              value={filters.category}
              onChange={handleInputChange}
              className="w-full"
            >
              <option value="">All Categories</option>
              <option value="Appetizers">Appetizers</option>
              <option value="Main Course">Main Course</option>
              <option value="Desserts">Desserts</option>
              <option value="Drinks">Drinks</option>
              <option value="Beverages">Beverages</option>
              <option value="Sides">Sides</option>
              <option value="Specials">Specials</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Vegan">Vegan</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Gluten-Free">Gluten-Free</option>
            </Select>
          </div>
          
          {/* Price range */}
          <div>
            <label className="block mb-1 text-sm font-medium">Price Range</label>
            <div className="flex gap-2">
              <Input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleInputChange}
                placeholder="Min"
                className="w-full"
              />
              <span className="mt-2">-</span>
              <Input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleInputChange}
                placeholder="Max"
                className="w-full"
              />
            </div>
          </div>
          
          {/* Calories range */}
          <div>
            <label className="block mb-1 text-sm font-medium">Calories Range</label>
            <div className="flex gap-2">
              <Input
                type="number"
                name="minCalories"
                value={filters.minCalories}
                onChange={handleInputChange}
                placeholder="Min"
                className="w-full"
              />
              <span className="mt-2">-</span>
              <Input
                type="number"
                name="maxCalories"
                value={filters.maxCalories}
                onChange={handleInputChange}
                placeholder="Max"
                className="w-full"
              />
            </div>
          </div>
          
          {/* Max carbs */}
          <div>
            <label className="block mb-1 text-sm font-medium">Max Carbs (g)</label>
            <Input
              type="number"
              name="maxCarbs"
              value={filters.maxCarbs}
              onChange={handleInputChange}
              placeholder="Maximum carbs in grams"
              className="w-full"
            />
          </div>
          
          {/* Min protein */}
          <div>
            <label className="block mb-1 text-sm font-medium">Min Protein (g)</label>
            <Input
              type="number"
              name="minProtein"
              value={filters.minProtein}
              onChange={handleInputChange}
              placeholder="Minimum protein in grams"
              className="w-full"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-3">
          {/* Dietary preferences */}
          <div>
            <label className="block mb-2 text-sm font-medium">Dietary Preferences</label>
            <div className="space-y-2">
              {['Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Low Carb', 'Low Fat', 'Gluten Free', 'Dairy Free'].map(pref => (
                <div key={pref} className="flex items-center gap-2">
                  <Checkbox 
                    checked={filters.dietaryPreferences.includes(pref)}
                    onCheckedChange={() => handleCheckboxChange('dietaryPreferences', pref)}
                    id={`diet-${pref}`}
                  />
                  <label htmlFor={`diet-${pref}`} className="text-sm">
                    {pref}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Health conditions */}
          <div>
            <label className="block mb-2 text-sm font-medium">Health Conditions</label>
            <div className="space-y-2">
              {['Diabetes', 'Heart Disease', 'Hypertension', 'High Cholesterol', 'Obesity'].map(condition => (
                <div key={condition} className="flex items-center gap-2">
                  <Checkbox 
                    checked={filters.healthConditions.includes(condition)}
                    onCheckedChange={() => handleCheckboxChange('healthConditions', condition)}
                    id={`condition-${condition}`}
                  />
                  <label htmlFor={`condition-${condition}`} className="text-sm">
                    {condition}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Allergens */}
          <div>
            <label className="block mb-2 text-sm font-medium">Allergens to Exclude</label>
            <div className="space-y-2">
              {['Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Fish', 'Shellfish', 'Soy', 'Wheat', 'Gluten', 'Sesame'].map(allergen => (
                <div key={allergen} className="flex items-center gap-2">
                  <Checkbox 
                    checked={filters.allergens.includes(allergen)}
                    onCheckedChange={() => handleCheckboxChange('allergens', allergen)}
                    id={`allergen-${allergen}`}
                  />
                  <label htmlFor={`allergen-${allergen}`} className="text-sm">
                    {allergen}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-wrap justify-between mt-8 gap-4">
          <div>
            {userProfile && userProfile.healthProfile && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={useHealthProfile}
              >
                Use My Health Profile
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default AdvancedSearch; 