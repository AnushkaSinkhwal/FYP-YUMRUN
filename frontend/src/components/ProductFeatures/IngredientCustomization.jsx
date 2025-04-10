import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Checkbox, RadioGroup, RadioGroupItem, Button, Input } from '../ui';

const IngredientCustomization = ({ 
  menuItem, 
  onCustomizationChange,
  initialCustomization = {}
}) => {
  // Initialize state with either provided initialCustomization or defaults
  const [customization, setCustomization] = useState({
    removedIngredients: initialCustomization.removedIngredients || [],
    addedIngredients: initialCustomization.addedIngredients || [],
    servingSize: initialCustomization.servingSize || 'Regular',
    specialInstructions: initialCustomization.specialInstructions || ''
  });
  
  // Track nutritional impact of customizations
  const [nutritionalImpact, setNutritionalImpact] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  // Update parent component when customization changes
  useEffect(() => {
    if (onCustomizationChange) {
      onCustomizationChange(customization);
    }
    
    // Calculate nutritional impact
    calculateNutritionalImpact();
  }, [customization, onCustomizationChange]);

  // Recalculate nutritional impact when menuItem changes
  useEffect(() => {
    calculateNutritionalImpact();
  }, [menuItem]);

  // Calculate the nutritional impact of customizations
  const calculateNutritionalImpact = () => {
    if (!menuItem) return;
    
    let impact = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
    
    // Impact of removed ingredients
    if (menuItem?.ingredients) {
      for (const ingredientName of customization.removedIngredients) {
        const ingredient = menuItem.ingredients.find(ing => ing.name === ingredientName);
        if (ingredient) {
          impact.calories -= ingredient.calories || 0;
          impact.protein -= ingredient.protein || 0;
          impact.carbs -= ingredient.carbs || 0;
          impact.fat -= ingredient.fat || 0;
        }
      }
    }
    
    // Impact of added ingredients
    for (const addedIngredient of customization.addedIngredients) {
      if (addedIngredient.nutritionalInfo) {
        impact.calories += addedIngredient.nutritionalInfo.calories || 0;
        impact.protein += addedIngredient.nutritionalInfo.protein || 0;
        impact.carbs += addedIngredient.nutritionalInfo.carbs || 0;
        impact.fat += addedIngredient.nutritionalInfo.fat || 0;
      }
    }
    
    // Impact of serving size
    let sizeFactor = 1; // Default for 'Regular'
    
    switch (customization.servingSize.toLowerCase()) {
      case 'small':
        sizeFactor = 0.7;
        break;
      case 'large':
        sizeFactor = 1.3;
        break;
      case 'extra large':
        sizeFactor = 1.5;
        break;
      // Default is 'regular' with factor 1
    }
    
    // Apply serving size factor to base nutrition values
    const baseCalories = menuItem?.calories || 0;
    const baseProtein = menuItem?.protein || 0;
    const baseCarbs = menuItem?.carbs || 0;
    const baseFat = menuItem?.fat || 0;
    
    impact.calories += (baseCalories * sizeFactor) - baseCalories;
    impact.protein += (baseProtein * sizeFactor) - baseProtein;
    impact.carbs += (baseCarbs * sizeFactor) - baseCarbs;
    impact.fat += (baseFat * sizeFactor) - baseFat;
    
    setNutritionalImpact(impact);
  };

  // Toggle an ingredient's removal
  const toggleIngredient = (ingredientName) => {
    setCustomization(prev => {
      const isRemoved = prev.removedIngredients.includes(ingredientName);
      
      return {
        ...prev,
        removedIngredients: isRemoved
          ? prev.removedIngredients.filter(name => name !== ingredientName)
          : [...prev.removedIngredients, ingredientName]
      };
    });
  };

  // Add an add-on ingredient
  const addIngredient = (ingredient) => {
    // Check if ingredient is already added to prevent duplicates
    const isDuplicate = customization.addedIngredients.some(
      item => item.name === ingredient.name
    );
    
    if (!isDuplicate) {
      setCustomization(prev => ({
        ...prev,
        addedIngredients: [...prev.addedIngredients, ingredient]
      }));
    }
  };

  // Remove an add-on ingredient
  const removeAddedIngredient = (ingredientIndex) => {
    setCustomization(prev => ({
      ...prev,
      addedIngredients: prev.addedIngredients.filter((_, index) => index !== ingredientIndex)
    }));
  };

  // Change serving size
  const changeServingSize = (size) => {
    setCustomization(prev => ({
      ...prev,
      servingSize: size
    }));
  };

  // Update special instructions
  const updateSpecialInstructions = (instructions) => {
    setCustomization(prev => ({
      ...prev,
      specialInstructions: instructions
    }));
  };

  // Check if the menu item has customization options
  const hasCustomizationOptions = menuItem && (
    (menuItem.ingredients && menuItem.ingredients.length > 0) ||
    (menuItem.customizationOptions?.allowAddIngredients && 
     menuItem.customizationOptions?.availableAddOns?.length > 0) ||
    (menuItem.customizationOptions?.servingSizeOptions && 
     menuItem.customizationOptions?.servingSizeOptions.length > 1)
  );

  if (!menuItem || !hasCustomizationOptions) {
    return null;
  }

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-lg font-semibold">Customize Your Order</h3>
      
      {/* Ingredient removal section */}
      {menuItem.ingredients && menuItem.ingredients.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-2 text-sm font-medium">Ingredients</h4>
          <div className="space-y-2">
            {menuItem.ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center">
                <Checkbox
                  id={`ingredient-${index}`}
                  checked={!customization.removedIngredients.includes(ingredient.name)}
                  onCheckedChange={() => toggleIngredient(ingredient.name)}
                  disabled={!ingredient.isRemovable}
                />
                <label 
                  htmlFor={`ingredient-${index}`} 
                  className="ml-2 text-sm"
                >
                  {ingredient.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Add-ons section */}
      {menuItem.customizationOptions?.allowAddIngredients && 
       menuItem.customizationOptions?.availableAddOns?.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-2 text-sm font-medium">Add Extra</h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {menuItem.customizationOptions.availableAddOns.map((addOn, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-2 border rounded"
              >
                <div>
                  <p className="text-sm font-medium">{addOn.name}</p>
                  <p className="text-xs text-gray-500">
                    +Rs. {addOn.price}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addIngredient({
                    name: addOn.name,
                    price: addOn.price,
                    nutritionalInfo: {
                      calories: addOn.calories,
                      protein: addOn.protein,
                      carbs: addOn.carbs,
                      fat: addOn.fat
                    }
                  })}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
          
          {/* Display added ingredients */}
          {customization.addedIngredients.length > 0 && (
            <div className="mt-3">
              <h5 className="mb-2 text-sm font-medium">Added Extras</h5>
              <div className="space-y-2">
                {customization.addedIngredients.map((ingredient, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800"
                  >
                    <p className="text-sm">{ingredient.name} (+Rs. {ingredient.price})</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-auto py-1 text-red-500"
                      onClick={() => removeAddedIngredient(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Serving size section */}
      {menuItem.customizationOptions?.servingSizeOptions && 
       menuItem.customizationOptions.servingSizeOptions.length > 1 && (
        <div className="mb-6">
          <h4 className="mb-2 text-sm font-medium">Size</h4>
          <RadioGroup 
            value={customization.servingSize}
            onValueChange={changeServingSize}
            className="flex flex-wrap gap-3"
          >
            {menuItem.customizationOptions.servingSizeOptions.map((size, index) => (
              <div key={index} className="flex items-center">
                <RadioGroupItem value={size} id={`size-${index}`} />
                <label 
                  htmlFor={`size-${index}`} 
                  className="ml-2 text-sm"
                >
                  {size}
                </label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}
      
      {/* Special instructions */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-medium">Special Instructions</h4>
        <Input
          placeholder="Any special requests for this item?"
          value={customization.specialInstructions}
          onChange={(e) => updateSpecialInstructions(e.target.value)}
          className="w-full"
        />
      </div>
      
      {/* Nutritional impact */}
      {(nutritionalImpact.calories !== 0 || 
        nutritionalImpact.protein !== 0 || 
        nutritionalImpact.carbs !== 0 || 
        nutritionalImpact.fat !== 0) && (
        <div className="p-3 mt-4 rounded bg-blue-50 dark:bg-blue-900">
          <h4 className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-200">
            Nutritional Changes
          </h4>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className={`text-sm font-bold ${nutritionalImpact.calories >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {nutritionalImpact.calories > 0 ? '+' : ''}{Math.round(nutritionalImpact.calories)}
              </p>
              <p className="text-xs text-gray-500">Calories</p>
            </div>
            <div>
              <p className={`text-sm font-bold ${nutritionalImpact.protein >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                {nutritionalImpact.protein > 0 ? '+' : ''}{Math.round(nutritionalImpact.protein)}g
              </p>
              <p className="text-xs text-gray-500">Protein</p>
            </div>
            <div>
              <p className={`text-sm font-bold ${nutritionalImpact.carbs >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {nutritionalImpact.carbs > 0 ? '+' : ''}{Math.round(nutritionalImpact.carbs)}g
              </p>
              <p className="text-xs text-gray-500">Carbs</p>
            </div>
            <div>
              <p className={`text-sm font-bold ${nutritionalImpact.fat >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {nutritionalImpact.fat > 0 ? '+' : ''}{Math.round(nutritionalImpact.fat)}g
              </p>
              <p className="text-xs text-gray-500">Fat</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

IngredientCustomization.propTypes = {
  menuItem: PropTypes.shape({
    ingredients: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      isRemovable: PropTypes.bool,
      calories: PropTypes.number,
      protein: PropTypes.number,
      carbs: PropTypes.number,
      fat: PropTypes.number
    })),
    customizationOptions: PropTypes.shape({
      allowRemoveIngredients: PropTypes.bool,
      allowAddIngredients: PropTypes.bool,
      availableAddOns: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        calories: PropTypes.number,
        protein: PropTypes.number,
        carbs: PropTypes.number,
        fat: PropTypes.number
      })),
      servingSizeOptions: PropTypes.arrayOf(PropTypes.string)
    }),
    calories: PropTypes.number,
    protein: PropTypes.number,
    carbs: PropTypes.number,
    fat: PropTypes.number
  }),
  onCustomizationChange: PropTypes.func,
  initialCustomization: PropTypes.shape({
    removedIngredients: PropTypes.arrayOf(PropTypes.string),
    addedIngredients: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      nutritionalInfo: PropTypes.shape({
        calories: PropTypes.number,
        protein: PropTypes.number,
        carbs: PropTypes.number,
        fat: PropTypes.number
      })
    })),
    servingSize: PropTypes.string,
    specialInstructions: PropTypes.string
  })
};

export default IngredientCustomization; 