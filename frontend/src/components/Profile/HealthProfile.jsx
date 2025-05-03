import { useState, useEffect } from 'react';
import { Card, Button, Checkbox, Alert, Input } from '../ui';
import { userAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const HealthProfile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [healthProfile, setHealthProfile] = useState({
    dietaryPreferences: ['None'],
    healthConditions: ['None'],
    allergies: [],
    weightManagementGoal: 'None',
    fitnessLevel: 'None',
    dailyCalorieGoal: 2000,
    macroTargets: {
      protein: 25,
      carbs: 50,
      fat: 25
    }
  });
  
  const [newAllergy, setNewAllergy] = useState('');
  
  // Common allergies users might select
  const commonAllergies = [
    'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Fish', 'Shellfish', 
    'Soy', 'Wheat', 'Gluten', 'Sesame', 'Mustard'
  ];

  useEffect(() => {
    if (currentUser?.healthProfile) {
      setHealthProfile({
        ...healthProfile,
        ...currentUser.healthProfile
      });
    }
  }, [currentUser]);

  const handleMultiSelectChange = (type, value) => {
    // If "None" is being selected, clear other options
    if (value === 'None') {
      setHealthProfile(prev => ({
        ...prev,
        [type]: ['None']
      }));
      return;
    }
    
    // If another option is selected while "None" is present, remove "None"
    setHealthProfile(prev => {
      const currentValues = prev[type];
      const hasNone = currentValues.includes('None');
      
      if (hasNone) {
        return {
          ...prev,
          [type]: [value]
        };
      }
      
      // Toggle value (add if not present, remove if present)
      const newValues = currentValues.includes(value) 
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
        
      // If removing the last value, add 'None'
      return {
        ...prev,
        [type]: newValues.length === 0 ? ['None'] : newValues
      };
    });
  };
  
  const handleSingleSelectChange = (e) => {
    const { name, value } = e.target;
    setHealthProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setHealthProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: isNaN(numValue) ? 0 : numValue
        }
      }));
    } else {
      setHealthProfile(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
    }
  };
  
  const handleAllergyAdd = () => {
    if (newAllergy.trim() === '') return;
    
    setHealthProfile(prev => ({
      ...prev,
      allergies: [...new Set([...prev.allergies, newAllergy.trim()])]
    }));
    
    setNewAllergy('');
  };
  
  const handleAllergyRemove = (allergy) => {
    setHealthProfile(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy)
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await userAPI.updateHealthProfile(healthProfile);
      
      if (response.data.success) {
        setSuccess('Health profile updated successfully!');
        
        // Update local storage with new user data if needed
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData) {
          const updatedUserData = { 
            ...userData, 
            healthProfile: healthProfile 
          };
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
        }
      } else {
        setError(response.data.message || 'Failed to update health profile');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while updating your health profile');
      console.error('Health profile update error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-2xl font-bold">Health & Dietary Preferences</h2>
      <p className="mb-6 text-gray-500">
        Customize your health profile to get personalized food recommendations based on your dietary needs and goals.
      </p>
      
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
        <div className="space-y-8">
          {/* Dietary Preferences */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Dietary Preferences</h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {['None', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Low Carb', 'Low Fat', 'Gluten Free', 'Dairy Free'].map(pref => (
                <div key={pref} className="flex items-center gap-2">
                  <Checkbox 
                    id={`diet-${pref}`}
                    checked={healthProfile.dietaryPreferences.includes(pref)}
                    onCheckedChange={() => handleMultiSelectChange('dietaryPreferences', pref)}
                  />
                  <label htmlFor={`diet-${pref}`} className="text-sm font-medium">
                    {pref}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Health Conditions */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Health Conditions</h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {['None', 'Diabetes', 'Heart Disease', 'Hypertension', 'High Cholesterol', 'Obesity', 'Other'].map(condition => (
                <div key={condition} className="flex items-center gap-2">
                  <Checkbox 
                    id={`condition-${condition}`}
                    checked={healthProfile.healthConditions.includes(condition)}
                    onCheckedChange={() => handleMultiSelectChange('healthConditions', condition)}
                  />
                  <label htmlFor={`condition-${condition}`} className="text-sm font-medium">
                    {condition}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Allergies */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Food Allergies</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {healthProfile.allergies.map(allergy => (
                <div key={allergy} className="flex items-center px-3 py-1 bg-gray-100 rounded-full dark:bg-gray-800">
                  <span className="mr-2 text-sm">{allergy}</span>
                  <button 
                    type="button"
                    onClick={() => handleAllergyRemove(allergy)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input 
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Add an allergy..."
                className="flex-1"
              />
              <Button type="button" onClick={handleAllergyAdd}>Add</Button>
            </div>
            
            <div className="mt-3">
              <p className="mb-2 text-sm text-gray-500">Common allergies:</p>
              <div className="flex flex-wrap gap-2">
                {commonAllergies.map(allergy => (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => {
                      if (!healthProfile.allergies.includes(allergy)) {
                        setHealthProfile(prev => ({
                          ...prev,
                          allergies: [...prev.allergies, allergy]
                        }));
                      }
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    {allergy}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Weight Management Goal */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Weight Management Goal</h3>
            <select
              name="weightManagementGoal"
              value={healthProfile.weightManagementGoal}
              onChange={handleSingleSelectChange}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="None">None</option>
              <option value="Maintain">Maintain Weight</option>
              <option value="Lose">Lose Weight</option>
              <option value="Gain">Gain Weight</option>
            </select>
          </div>
          
          {/* Fitness Level */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Activity Level</h3>
            <select
              name="fitnessLevel"
              value={healthProfile.fitnessLevel}
              onChange={handleSingleSelectChange}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="None">None</option>
              <option value="Sedentary">Sedentary (little to no exercise)</option>
              <option value="Light Activity">Light Activity (1-3 days/week)</option>
              <option value="Moderate Activity">Moderate Activity (3-5 days/week)</option>
              <option value="Very Active">Very Active (6-7 days/week)</option>
              <option value="Extra Active">Extra Active (physical job or 2x training)</option>
            </select>
          </div>
          
          {/* Daily Calorie Goal */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Daily Calorie Goal</h3>
            <div className="flex items-center gap-4">
              <Input 
                type="number"
                name="dailyCalorieGoal"
                value={healthProfile.dailyCalorieGoal}
                onChange={handleNumberChange}
                min="1000"
                max="7000"
                className="w-32"
              />
              <span className="text-gray-500">calories</span>
            </div>
          </div>
          
          {/* Macro Nutrient Targets */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Macro Nutrient Targets</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="block mb-2 text-sm font-medium">Protein (%)</label>
                <Input 
                  type="number"
                  name="macroTargets.protein"
                  value={healthProfile.macroTargets.protein}
                  onChange={handleNumberChange}
                  min="0"
                  max="100"
                  className="w-24"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Carbs (%)</label>
                <Input 
                  type="number"
                  name="macroTargets.carbs"
                  value={healthProfile.macroTargets.carbs}
                  onChange={handleNumberChange}
                  min="0"
                  max="100"
                  className="w-24"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Fat (%)</label>
                <Input 
                  type="number"
                  name="macroTargets.fat"
                  value={healthProfile.macroTargets.fat}
                  onChange={handleNumberChange}
                  min="0"
                  max="100"
                  className="w-24"
                />
              </div>
            </div>
            {/* Warning if macros don't add up to 100% */}
            {healthProfile.macroTargets.protein + healthProfile.macroTargets.carbs + healthProfile.macroTargets.fat !== 100 && (
              <p className="mt-2 text-sm text-yellow-500">
                Note: Your macro percentages should total 100%. Current total: 
                {healthProfile.macroTargets.protein + healthProfile.macroTargets.carbs + healthProfile.macroTargets.fat}%
              </p>
            )}
          </div>
          
          <div className="pt-4 border-t">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? 'Saving...' : 'Save Health Profile'}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default HealthProfile; 