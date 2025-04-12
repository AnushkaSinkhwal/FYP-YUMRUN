import React from 'react';
import { Card, Progress } from '../ui';

/**
 * A component that displays nutritional information in a user-friendly format
 */
const NutritionSummary = ({ nutritionalInfo, dailyGoals, compact = false }) => {
  const {
    calories = 0,
    protein = 0,
    carbs = 0,
    fat = 0,
    sodium = 0,
    sugar = 0,
    fiber = 0
  } = nutritionalInfo || {};

  // Default daily values if not provided
  const defaultDailyValues = {
    calories: 2000,
    protein: 50, // grams
    carbs: 275, // grams
    fat: 78, // grams
    sodium: 2300, // mg
    sugar: 50, // grams
    fiber: 28 // grams
  };

  // Use provided daily goals or defaults
  const dailyValues = dailyGoals || defaultDailyValues;

  // Calculate percentages of daily values
  const calculatePercentage = (value, dailyValue) => {
    return Math.min(100, Math.round((value / dailyValue) * 100));
  };

  const percentages = {
    calories: calculatePercentage(calories, dailyValues.calories),
    protein: calculatePercentage(protein, dailyValues.protein),
    carbs: calculatePercentage(carbs, dailyValues.carbs),
    fat: calculatePercentage(fat, dailyValues.fat),
    sodium: calculatePercentage(sodium, dailyValues.sodium),
    sugar: calculatePercentage(sugar, dailyValues.sugar),
    fiber: calculatePercentage(fiber, dailyValues.fiber)
  };

  // Get color based on percentage (green for good, yellow for moderate, red for high)
  const getProgressColor = (nutrient, percentage) => {
    // For calories, protein, and fiber, higher is generally better (until too high)
    if (nutrient === 'protein' || nutrient === 'fiber') {
      if (percentage < 20) return 'bg-red-500';
      if (percentage < 50) return 'bg-yellow-500';
      return 'bg-green-500';
    }
    
    // For calories, context matters
    if (nutrient === 'calories') {
      if (percentage < 20) return 'bg-blue-500';
      if (percentage < 50) return 'bg-green-500';
      if (percentage < 85) return 'bg-yellow-500';
      return 'bg-red-500';
    }
    
    // For carbs, fat, sodium, sugar - lower is generally better
    if (percentage < 20) return 'bg-green-500';
    if (percentage < 50) return 'bg-blue-500';
    if (percentage < 85) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (compact) {
    return (
      <div className="p-3 bg-white rounded-lg shadow-sm dark:bg-gray-800">
        <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Nutrition Summary</h4>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 text-xs bg-gray-100 rounded-full dark:bg-gray-700">
            {calories} Cal
          </span>
          <span className="px-2 py-1 text-xs bg-gray-100 rounded-full dark:bg-gray-700">
            {protein}g Protein
          </span>
          <span className="px-2 py-1 text-xs bg-gray-100 rounded-full dark:bg-gray-700">
            {carbs}g Carbs
          </span>
          <span className="px-2 py-1 text-xs bg-gray-100 rounded-full dark:bg-gray-700">
            {fat}g Fat
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="mb-4 text-lg font-semibold">Nutritional Information</h3>
      
      <div className="space-y-4">
        {/* Calories */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Calories</span>
            <span className="text-sm text-gray-500">{calories} / {dailyValues.calories} kcal</span>
          </div>
          <Progress 
            value={percentages.calories} 
            className={`h-2 ${getProgressColor('calories', percentages.calories)}`}
          />
        </div>
        
        {/* Macros */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Protein */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Protein</span>
              <span className="text-sm text-gray-500">{protein}g / {dailyValues.protein}g</span>
            </div>
            <Progress 
              value={percentages.protein} 
              className={`h-2 ${getProgressColor('protein', percentages.protein)}`}
            />
          </div>
          
          {/* Carbs */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Carbs</span>
              <span className="text-sm text-gray-500">{carbs}g / {dailyValues.carbs}g</span>
            </div>
            <Progress 
              value={percentages.carbs} 
              className={`h-2 ${getProgressColor('carbs', percentages.carbs)}`}
            />
          </div>
          
          {/* Fat */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Fat</span>
              <span className="text-sm text-gray-500">{fat}g / {dailyValues.fat}g</span>
            </div>
            <Progress 
              value={percentages.fat} 
              className={`h-2 ${getProgressColor('fat', percentages.fat)}`}
            />
          </div>
        </div>
        
        {/* Others */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Sodium */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Sodium</span>
              <span className="text-sm text-gray-500">{sodium}mg / {dailyValues.sodium}mg</span>
            </div>
            <Progress 
              value={percentages.sodium} 
              className={`h-2 ${getProgressColor('sodium', percentages.sodium)}`}
            />
          </div>
          
          {/* Sugar */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Sugar</span>
              <span className="text-sm text-gray-500">{sugar}g / {dailyValues.sugar}g</span>
            </div>
            <Progress 
              value={percentages.sugar} 
              className={`h-2 ${getProgressColor('sugar', percentages.sugar)}`}
            />
          </div>
          
          {/* Fiber */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Fiber</span>
              <span className="text-sm text-gray-500">{fiber}g / {dailyValues.fiber}g</span>
            </div>
            <Progress 
              value={percentages.fiber} 
              className={`h-2 ${getProgressColor('fiber', percentages.fiber)}`}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NutritionSummary; 