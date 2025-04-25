import React from 'react';
import { Card, Progress } from '../ui';

/**
 * A component that displays nutritional information in a user-friendly format
 * @param {Object} nutritionalInfo - The nutritional information to display
 * @param {Object} dailyGoals - User's daily nutritional goals
 * @param {boolean} compact - Whether to show a compact version
 * @param {Object} healthProfile - User's health profile for contextual advice
 * @param {boolean} showHealthTips - Whether to show health tips based on the nutritional content
 */
const NutritionSummary = ({ 
  nutritionalInfo, 
  dailyGoals, 
  compact = false, 
  healthProfile = null,
  showHealthTips = false 
}) => {
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
  // If health profile exists, use its goals as priority
  const dailyValues = healthProfile?.dailyCalorieGoal ? {
    ...defaultDailyValues,
    calories: healthProfile.dailyCalorieGoal,
    protein: Math.round(healthProfile.dailyCalorieGoal * (healthProfile.macroTargets?.protein || 25) / 100 / 4), // 4 calories per gram of protein
    carbs: Math.round(healthProfile.dailyCalorieGoal * (healthProfile.macroTargets?.carbs || 50) / 100 / 4), // 4 calories per gram of carbs
    fat: Math.round(healthProfile.dailyCalorieGoal * (healthProfile.macroTargets?.fat || 25) / 100 / 9), // 9 calories per gram of fat
  } : (dailyGoals || defaultDailyValues);

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
  
  // Calculate macronutrient distribution (as percentages)
  const totalMacroCalories = (protein * 4) + (carbs * 4) + (fat * 9);
  const macroDistribution = {
    protein: totalMacroCalories > 0 ? Math.round((protein * 4 / totalMacroCalories) * 100) : 0,
    carbs: totalMacroCalories > 0 ? Math.round((carbs * 4 / totalMacroCalories) * 100) : 0,
    fat: totalMacroCalories > 0 ? Math.round((fat * 9 / totalMacroCalories) * 100) : 0,
  };

  // Helper to generate health tips based on nutrition and health profile
  const getHealthTips = () => {
    const tips = [];
    
    // Only add tips if we have nutritional info
    if (!nutritionalInfo) return tips;
    
    // Diabetes-related tips
    if (healthProfile?.healthConditions?.includes('Diabetes')) {
      if (carbs > 30) {
        tips.push('This meal is high in carbs. Consider reducing portion size or pairing with physical activity.');
      }
      if (sugar > 15) {
        tips.push('High sugar content. This may impact blood glucose levels.');
      }
      if (fiber > 5) {
        tips.push('Good fiber content, which helps manage blood sugar levels.');
      }
    }
    
    // Heart health tips
    if (healthProfile?.healthConditions?.includes('Heart Disease') || 
        healthProfile?.healthConditions?.includes('Hypertension')) {
      if (sodium > 600) {
        tips.push('High sodium content. Consider reducing added salt.');
      }
      if (fat > 25 && macroDistribution.fat > 35) {
        tips.push('High fat content. Monitor your overall fat intake for the day.');
      }
    }
    
    // Weight management tips
    if (healthProfile?.weightManagementGoal === 'Lose') {
      if (calories > 600) {
        tips.push('This meal is calorie-dense. Consider smaller portions or balancing with lighter meals.');
      }
      if (protein > 20 && macroDistribution.protein > 30) {
        tips.push('Good protein content, which helps with satiety and metabolism.');
      }
    }
    
    // Generic tips if no specific health conditions or not enough specific tips
    if (tips.length < 2) {
      if (fiber > 5) {
        tips.push('Good source of fiber, supporting digestive health.');
      }
      if (protein > 15) {
        tips.push('Good protein content, supporting muscle maintenance.');
      }
      if (calories < 400 && fat < 15) {
        tips.push('Relatively light meal, appropriate for a calorie-controlled diet.');
      }
    }
    
    return tips.slice(0, 2); // Return at most 2 tips
  };

  const healthTips = showHealthTips ? getHealthTips() : [];

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
        
        {/* Show macronutrient ratio in compact mode */}
        {totalMacroCalories > 0 && (
          <div className="flex items-center mt-2 h-2">
            <div 
              className="h-full bg-red-400" 
              style={{width: `${macroDistribution.protein}%`}} 
              title={`Protein: ${macroDistribution.protein}%`}
            ></div>
            <div 
              className="h-full bg-blue-400" 
              style={{width: `${macroDistribution.carbs}%`}} 
              title={`Carbs: ${macroDistribution.carbs}%`}
            ></div>
            <div 
              className="h-full bg-yellow-400" 
              style={{width: `${macroDistribution.fat}%`}} 
              title={`Fat: ${macroDistribution.fat}%`}
            ></div>
          </div>
        )}
        
        {/* Show one health tip if available */}
        {healthTips.length > 0 && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">Tip:</span> {healthTips[0]}
          </p>
        )}
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
        
        {/* Macronutrient Distribution */}
        {totalMacroCalories > 0 && (
          <div className="mb-3">
            <h4 className="mb-2 text-sm font-medium">Macronutrient Ratio</h4>
            <div className="flex items-center h-4 mb-1 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-700">
              <div 
                className="h-full bg-red-400 transition-all duration-300" 
                style={{width: `${macroDistribution.protein}%`}}
              ></div>
              <div 
                className="h-full bg-blue-400 transition-all duration-300" 
                style={{width: `${macroDistribution.carbs}%`}}
              ></div>
              <div 
                className="h-full bg-yellow-400 transition-all duration-300" 
                style={{width: `${macroDistribution.fat}%`}}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Protein {macroDistribution.protein}%</span>
              <span>Carbs {macroDistribution.carbs}%</span>
              <span>Fat {macroDistribution.fat}%</span>
            </div>
          </div>
        )}
        
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
        
        {/* Health Tips */}
        {showHealthTips && healthTips.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Health Tips</h4>
            <ul className="list-disc pl-5 text-sm text-blue-700 dark:text-blue-200 space-y-1">
              {healthTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NutritionSummary; 