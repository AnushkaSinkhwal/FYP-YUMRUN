import { useState, useEffect, useContext } from 'react';
import { Button, Checkbox, Card, Label, Slider, RadioGroup, RadioGroupItem } from '../ui';
import NutritionSummary from '../NutritionTracker/NutritionSummary';
import { useAuth } from '../../context/AuthContext';

/**
 * A component for customizing menu item ingredients at a detailed level
 */
const IngredientCustomizer = ({ 
  menuItem, 
  onChange,
  onClose
}) => {
  const { user } = useAuth(); // Get the current user to access health profile
  
  const [baseNutrition, setBaseNutrition] = useState({
    calories: menuItem?.calories || 0,
    protein: menuItem?.protein || 0,
    carbs: menuItem?.carbs || 0,
    fat: menuItem?.fat || 0,
    sodium: menuItem?.sodium || 0,
    fiber: menuItem?.fiber || 0,
    sugar: menuItem?.sugar || 0
  });
  
  const [basePrice, setBasePrice] = useState(menuItem?.item_price || 0);
  const [currentPrice, setCurrentPrice] = useState(basePrice);
  const [removedIngredients, setRemovedIngredients] = useState([]);
  const [addedIngredients, setAddedIngredients] = useState([]);
  const [portionSizes, setPortionSizes] = useState({});
  const [servingSize, setServingSize] = useState('Regular');
  const [currentNutrition, setCurrentNutrition] = useState({...baseNutrition});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [cookingMethod, setCookingMethod] = useState(null);
  
  // Available cooking methods and their nutritional impacts
  const cookingMethods = [
    { id: 'default', name: 'Default', impact: { calories: 0, fat: 0 } },
    { id: 'grilled', name: 'Grilled', impact: { calories: -50, fat: -4 } },
    { id: 'steamed', name: 'Steamed', impact: { calories: -70, fat: -6 } },
    { id: 'fried', name: 'Fried', impact: { calories: 100, fat: 8 } },
  ];
  
  // Initialize with default ingredients if available
  useEffect(() => {
    if (menuItem) {
      // Set base nutrition
      setBaseNutrition({
        calories: menuItem.calories || 0,
        protein: menuItem.protein || 0,
        carbs: menuItem.carbs || 0,
        fat: menuItem.fat || 0,
        sodium: menuItem.sodium || 0,
        fiber: menuItem.fiber || 0,
        sugar: menuItem.sugar || 0
      });
      
      // Set current nutrition to match base
      setCurrentNutrition({
        calories: menuItem.calories || 0,
        protein: menuItem.protein || 0,
        carbs: menuItem.carbs || 0,
        fat: menuItem.fat || 0,
        sodium: menuItem.sodium || 0,
        fiber: menuItem.fiber || 0,
        sugar: menuItem.sugar || 0
      });
      
      // Set base and current price
      setBasePrice(menuItem.item_price || 0);
      setCurrentPrice(menuItem.item_price || 0);
      
      // Initialize default cooking method
      setCookingMethod('default');
      
      // Initialize portion sizes for each ingredient (100% by default)
      if (menuItem.ingredients) {
        const initialPortionSizes = {};
        menuItem.ingredients.forEach(ingredient => {
          initialPortionSizes[ingredient.name] = 100;
        });
        setPortionSizes(initialPortionSizes);
      }
    }
  }, [menuItem]);
  
  // Recalculate nutrition and price whenever customizations change
  useEffect(() => {
    let updatedNutrition = {...baseNutrition};
    let updatedPrice = basePrice;
    
    // Subtract removed ingredients based on portion size
    removedIngredients.forEach(ingredient => {
      const portionFactor = portionSizes[ingredient.name] !== undefined ? 
        (100 - portionSizes[ingredient.name]) / 100 : 1;
        
      updatedNutrition.calories -= (ingredient.calories || 0) * portionFactor;
      updatedNutrition.protein -= (ingredient.protein || 0) * portionFactor;
      updatedNutrition.carbs -= (ingredient.carbs || 0) * portionFactor;
      updatedNutrition.fat -= (ingredient.fat || 0) * portionFactor;
      updatedNutrition.sodium -= (ingredient.sodium || 0) * portionFactor;
      updatedNutrition.fiber -= (ingredient.fiber || 0) * portionFactor;
      updatedNutrition.sugar -= (ingredient.sugar || 0) * portionFactor;
      
      // Adjust price if ingredient removal affects price
      if (ingredient.price) {
        updatedPrice -= ingredient.price * portionFactor;
      }
    });
    
    // Add added ingredients
    addedIngredients.forEach(ingredient => {
      updatedNutrition.calories += ingredient.calories || 0;
      updatedNutrition.protein += ingredient.protein || 0;
      updatedNutrition.carbs += ingredient.carbs || 0;
      updatedNutrition.fat += ingredient.fat || 0;
      updatedNutrition.sodium += ingredient.sodium || 0;
      updatedNutrition.fiber += ingredient.fiber || 0;
      updatedNutrition.sugar += ingredient.sugar || 0;
      
      // Adjust price for add-ons
      updatedPrice += ingredient.price || 0;
    });
    
    // Apply cooking method impacts if selected
    if (cookingMethod && cookingMethod !== 'default') {
      const selectedMethod = cookingMethods.find(method => method.id === cookingMethod);
      if (selectedMethod) {
        Object.entries(selectedMethod.impact).forEach(([nutrient, value]) => {
          if (updatedNutrition[nutrient] !== undefined) {
            updatedNutrition[nutrient] = Math.max(0, updatedNutrition[nutrient] + value);
          }
        });
      }
    }
    
    // Apply serving size factor
    let sizeFactor = 1;
    let priceAdjustment = 0;
    
    switch (servingSize) {
      case 'Small':
        sizeFactor = 0.7;
        priceAdjustment = -0.2; // 20% discount for small size
        break;
      case 'Large':
        sizeFactor = 1.3;
        priceAdjustment = 0.3; // 30% premium for large size
        break;
      case 'Extra Large':
        sizeFactor = 1.5;
        priceAdjustment = 0.5; // 50% premium for extra large
        break;
      default: // Regular
        sizeFactor = 1;
        priceAdjustment = 0;
    }
    
    // Apply size factor to nutrition values
    Object.keys(updatedNutrition).forEach(key => {
      updatedNutrition[key] = Math.max(0, Math.round(updatedNutrition[key] * sizeFactor));
    });
    
    // Apply price adjustment
    updatedPrice = Math.max(0, updatedPrice * (1 + priceAdjustment));
    updatedPrice = Math.round(updatedPrice * 100) / 100; // Round to 2 decimal places
    
    setCurrentNutrition(updatedNutrition);
    setCurrentPrice(updatedPrice);
    
    // Notify parent component of changes
    if (onChange) {
      onChange({
        removedIngredients: removedIngredients.map(i => ({
          name: i.name,
          portionRemoved: portionSizes[i.name] !== undefined ? 100 - portionSizes[i.name] : 100
        })),
        addedIngredients: addedIngredients.map(i => ({
          name: i.name,
          price: i.price || 0
        })),
        cookingMethod: cookingMethod !== 'default' ? cookingMethods.find(m => m.id === cookingMethod)?.name : undefined,
        servingSize,
        specialInstructions,
        nutritionalInfo: updatedNutrition,
        updatedPrice: updatedPrice
      });
    }
  }, [baseNutrition, basePrice, removedIngredients, addedIngredients, portionSizes, cookingMethod, servingSize, specialInstructions, onChange]);
  
  const handleIngredientToggle = (ingredient, isRemoved) => {
    if (isRemoved) {
      // Toggle removal of an ingredient
      if (removedIngredients.find(i => i.name === ingredient.name)) {
        setRemovedIngredients(prev => prev.filter(i => i.name !== ingredient.name));
      } else {
        setRemovedIngredients(prev => [...prev, ingredient]);
      }
    } else {
      // Toggle addition of an ingredient
      if (addedIngredients.find(i => i.name === ingredient.name)) {
        setAddedIngredients(prev => prev.filter(i => i.name !== ingredient.name));
      } else {
        setAddedIngredients(prev => [...prev, ingredient]);
      }
    }
  };
  
  const handlePortionChange = (ingredientName, value) => {
    setPortionSizes(prev => ({
      ...prev,
      [ingredientName]: value
    }));
    
    // Update removed ingredients if portion is adjusted
    const ingredient = menuItem.ingredients.find(i => i.name === ingredientName);
    if (ingredient) {
      if (value < 100) {
        // Add to removed ingredients if not already there
        if (!removedIngredients.find(i => i.name === ingredientName)) {
          setRemovedIngredients(prev => [...prev, ingredient]);
        }
      } else {
        // Remove from removed ingredients if portion is back to 100%
        setRemovedIngredients(prev => prev.filter(i => i.name !== ingredientName));
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Customize Your Order</h3>
      
      {/* Health-based customization recommendations */}
      {user?.healthProfile && (
        <Card className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
          <h4 className="mb-2 font-medium text-blue-700 text-md dark:text-blue-300">Health Recommendations</h4>
          <p className="text-sm text-blue-600 dark:text-blue-200">
            {user.healthProfile.healthConditions?.includes('Diabetes') && 
              'Consider reducing carbs and sugar with your customizations.'}
            {user.healthProfile.healthConditions?.includes('Heart Disease') && 
              'Consider low-sodium options and heart-healthy cooking methods like grilled or steamed.'}
            {user.healthProfile.healthConditions?.includes('Hypertension') && 
              'Low sodium options are recommended for your health profile.'}
            {user.healthProfile.weightManagementGoal === 'Lose' && 
              'Choose smaller portions and grilled/steamed options to reduce calories.'}
            {user.healthProfile.weightManagementGoal === 'Gain' && 
              'You may want to add extra protein-rich ingredients.'}
          </p>
        </Card>
      )}
      
      {/* Ingredients that can be removed */}
      {menuItem?.ingredients && menuItem.ingredients.length > 0 && (
        <Card className="p-4">
          <h4 className="mb-4 text-lg font-medium">Ingredients</h4>
          <div className="space-y-4">
            {menuItem.ingredients.map(ingredient => (
              <div key={ingredient.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id={`ingredient-${ingredient.name}`}
                      checked={!removedIngredients.find(i => i.name === ingredient.name) || 
                              (portionSizes[ingredient.name] === 100)}
                      onCheckedChange={(checked) => {
                        if (!checked) {
                          handleIngredientToggle(ingredient, true);
                          // Set portion to 0 if removing completely
                          handlePortionChange(ingredient.name, 0);
                        } else {
                          handleIngredientToggle(ingredient, true);
                          // Reset portion to 100% if re-adding
                          handlePortionChange(ingredient.name, 100);
                        }
                      }}
                      disabled={!ingredient.isRemovable}
                    />
                    <label htmlFor={`ingredient-${ingredient.name}`} className="text-sm">
                      {ingredient.name}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {ingredient.calories > 0 ? `${ingredient.calories} cal` : ''}
                    </span>
                    {ingredient.protein > 0 && (
                      <span className="text-xs text-gray-500">
                        {ingredient.protein}g protein
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Portion slider for adjusting ingredient amount */}
                {ingredient.isRemovable && (
                  <div className="pl-6">
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor={`portion-${ingredient.name}`} className="text-xs text-gray-500">
                        Portion Size: {portionSizes[ingredient.name] || 0}%
                      </label>
                    </div>
                    <Slider
                      id={`portion-${ingredient.name}`}
                      min={0}
                      max={100}
                      step={10}
                      value={[portionSizes[ingredient.name] || 0]}
                      onValueChange={(values) => handlePortionChange(ingredient.name, values[0])}
                      disabled={!ingredient.isRemovable}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Add-on ingredients */}
      {menuItem?.customizationOptions?.availableAddOns && 
       menuItem.customizationOptions.availableAddOns.length > 0 && (
        <Card className="p-4">
          <h4 className="mb-4 text-lg font-medium">Additional Ingredients</h4>
          <div className="space-y-2">
            {menuItem.customizationOptions.availableAddOns.map(ingredient => (
              <div key={ingredient.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id={`addon-${ingredient.name}`}
                    checked={!!addedIngredients.find(i => i.name === ingredient.name)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleIngredientToggle(ingredient, false);
                      } else {
                        handleIngredientToggle(ingredient, false);
                      }
                    }}
                  />
                  <label htmlFor={`addon-${ingredient.name}`} className="flex flex-col text-sm">
                    <span>{ingredient.name}</span>
                    {/* Show health tags if applicable */}
                    {ingredient.protein > 5 && (
                      <span className="text-xs text-green-600 dark:text-green-400">High Protein</span>
                    )}
                    {ingredient.fiber > 3 && (
                      <span className="text-xs text-green-600 dark:text-green-400">High Fiber</span>
                    )}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {ingredient.calories > 0 ? `${ingredient.calories} cal` : ''}
                  </span>
                  {ingredient.price > 0 && (
                    <span className="text-xs font-medium text-gray-700">
                      +Rs.{ingredient.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Cooking Method Selection */}
      <Card className="p-4">
        <h4 className="mb-4 text-lg font-medium">Cooking Method</h4>
        <RadioGroup
          value={cookingMethod}
          onValueChange={setCookingMethod}
          className="flex flex-col space-y-2"
        >
          {cookingMethods.map(method => (
            <div key={method.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={method.id} id={`cooking-${method.id}`} />
                <Label htmlFor={`cooking-${method.id}`} className="text-sm">
                  {method.name}
                </Label>
              </div>
              {method.id !== 'default' && (
                <div className="text-xs text-gray-500">
                  {method.impact.calories > 0 ? `+${method.impact.calories}` : method.impact.calories} cal, 
                  {method.impact.fat > 0 ? `+${method.impact.fat}` : method.impact.fat}g fat
                </div>
              )}
            </div>
          ))}
        </RadioGroup>
      </Card>
      
      {/* Serving size selection */}
      {menuItem?.customizationOptions?.servingSizeOptions && 
       menuItem.customizationOptions.servingSizeOptions.length > 1 && (
        <Card className="p-4">
          <h4 className="mb-4 text-lg font-medium">Serving Size</h4>
          <div className="flex flex-wrap gap-2">
            {menuItem.customizationOptions.servingSizeOptions.map(size => (
              <Button
                key={size}
                type="button"
                variant={servingSize === size ? "default" : "outline"}
                onClick={() => setServingSize(size)}
                className="text-sm"
              >
                {size}
                {size === 'Small' && ' (-20%)'}
                {size === 'Large' && ' (+30%)'}
                {size === 'Extra Large' && ' (+50%)'}
              </Button>
            ))}
          </div>
        </Card>
      )}
      
      {/* Special instructions */}
      <Card className="p-4">
        <h4 className="mb-2 text-lg font-medium">Special Instructions</h4>
        <p className="mb-2 text-sm text-gray-500">
          Add any special requests or preparation instructions here
        </p>
        <textarea
          value={specialInstructions}
          onChange={e => setSpecialInstructions(e.target.value)}
          className="w-full h-24 p-2 text-sm border rounded-md"
          placeholder="E.g., Extra spicy, no onions, etc."
        />
      </Card>
      
      {/* Price summary */}
      <Card className="p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium">Total Price</h4>
          <div>
            <span className={`text-xl font-bold ${currentPrice !== basePrice ? 'text-blue-600 dark:text-blue-400' : ''}`}>
              Rs.{currentPrice.toFixed(2)}
            </span>
            {currentPrice !== basePrice && (
              <span className="ml-2 text-sm text-gray-500 line-through">
                Rs.{basePrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </Card>
      
      {/* Nutritional information with user's health profile for context */}
      <div className="mt-6">
        <NutritionSummary 
          nutritionalInfo={currentNutrition} 
          healthProfile={user?.healthProfile}
          showHealthTips={true}
        />
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => {
          onChange({
            removedIngredients: removedIngredients.map(i => ({
              name: i.name,
              portionRemoved: portionSizes[i.name] !== undefined ? 100 - portionSizes[i.name] : 100
            })),
            addedIngredients: addedIngredients.map(i => ({
              name: i.name,
              price: i.price || 0
            })),
            cookingMethod: cookingMethod !== 'default' ? cookingMethods.find(m => m.id === cookingMethod)?.name : undefined,
            servingSize,
            specialInstructions,
            nutritionalInfo: currentNutrition,
            updatedPrice: currentPrice
          });
          onClose();
        }}>
          Add to Cart - Rs.{currentPrice.toFixed(2)}
        </Button>
      </div>
    </div>
  );
};

export default IngredientCustomizer; 