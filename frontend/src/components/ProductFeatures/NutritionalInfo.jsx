import { useState } from 'react';
import PropTypes from 'prop-types';
import { Card } from '../ui';

const NutritionalInfo = ({ nutritionalData, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!nutritionalData) {
    return null;
  }
  
  const { calories, protein, carbs, fat, sodium, sugar, fiber } = nutritionalData;
  
  return (
    <Card className={`p-4 ${className || ''}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Nutritional Information</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
          <p className="text-xl font-bold">{calories || 0}</p>
          <p className="text-xs text-gray-500">Calories</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
          <p className="text-xl font-bold">{protein || 0}g</p>
          <p className="text-xs text-gray-500">Protein</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
          <p className="text-xl font-bold">{carbs || 0}g</p>
          <p className="text-xs text-gray-500">Carbs</p>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
              <p className="text-xl font-bold">{fat || 0}g</p>
              <p className="text-xs text-gray-500">Fat</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
              <p className="text-xl font-bold">{sodium || 0}mg</p>
              <p className="text-xs text-gray-500">Sodium</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
              <p className="text-xl font-bold">{sugar || 0}g</p>
              <p className="text-xs text-gray-500">Sugar</p>
            </div>
          </div>
          
          {fiber !== undefined && (
            <div className="mt-3">
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-center">
                <p className="text-xl font-bold">{fiber || 0}g</p>
                <p className="text-xs text-gray-500">Fiber</p>
              </div>
            </div>
          )}
          
          {/* Diet indicators */}
          {nutritionalData.healthAttributes && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Health Attributes</h4>
              <div className="flex flex-wrap gap-2">
                {nutritionalData.healthAttributes.isDiabeticFriendly && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                    Diabetic Friendly
                  </span>
                )}
                {nutritionalData.healthAttributes.isLowSodium && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    Low Sodium
                  </span>
                )}
                {nutritionalData.healthAttributes.isHeartHealthy && (
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-full">
                    Heart Healthy
                  </span>
                )}
                {nutritionalData.healthAttributes.isLowGlycemicIndex && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                    Low Glycemic Index
                  </span>
                )}
                {nutritionalData.healthAttributes.isHighProtein && (
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
                    High Protein
                  </span>
                )}
                {nutritionalData.healthAttributes.isLowCarb && (
                  <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                    Low Carb
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Diet types */}
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Diet Types</h4>
            <div className="flex flex-wrap gap-2">
              {nutritionalData.isVegetarian && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                  Vegetarian
                </span>
              )}
              {nutritionalData.isVegan && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                  Vegan
                </span>
              )}
              {nutritionalData.isGlutenFree && (
                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs rounded-full">
                  Gluten Free
                </span>
              )}
            </div>
          </div>
          
          {/* Allergens */}
          {nutritionalData.allergens && nutritionalData.allergens.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Allergens</h4>
              <div className="flex flex-wrap gap-2">
                {nutritionalData.allergens.map((allergen, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-full"
                  >
                    {allergen}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

NutritionalInfo.propTypes = {
  nutritionalData: PropTypes.shape({
    calories: PropTypes.number,
    protein: PropTypes.number,
    carbs: PropTypes.number,
    fat: PropTypes.number,
    sodium: PropTypes.number,
    sugar: PropTypes.number,
    fiber: PropTypes.number,
    healthAttributes: PropTypes.shape({
      isDiabeticFriendly: PropTypes.bool,
      isLowSodium: PropTypes.bool,
      isHeartHealthy: PropTypes.bool,
      isLowGlycemicIndex: PropTypes.bool,
      isHighProtein: PropTypes.bool,
      isLowCarb: PropTypes.bool
    }),
    isVegetarian: PropTypes.bool,
    isVegan: PropTypes.bool,
    isGlutenFree: PropTypes.bool,
    allergens: PropTypes.arrayOf(PropTypes.string)
  }),
  className: PropTypes.string
};

export default NutritionalInfo; 