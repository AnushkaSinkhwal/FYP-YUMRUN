import { useState, useEffect } from 'react';
import { Button, Checkbox, Card, Label } from '../ui';
import NutritionSummary from '../NutritionTracker/NutritionSummary';

/**
 * A component for customizing menu item ingredients
 */
const IngredientCustomizer = ({ 
  menuItem, 
  onChange,
  onClose
}) => {
  const [baseNutrition, setBaseNutrition] = useState({
    calories: menuItem?.calories || 0,
    protein: menuItem?.protein || 0,
    carbs: menuItem?.carbs || 0,
    fat: menuItem?.fat || 0,
    sodium: menuItem?.sodium || 0,
    fiber: menuItem?.fiber || 0,
    sugar: menuItem?.sugar || 0
  });
  
  const [removedIngredients, setRemovedIngredients] = useState([]);
  const [addedIngredients, setAddedIngredients] = useState([]);
  const [servingSize, setServingSize] = useState('Regular');
  const [currentNutrition, setCurrentNutrition] = useState({...baseNutrition});
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Initialize with default ingredients if available
  useEffect(() => {
    if (menuItem && menuItem.ingredients) {
      setBaseNutrition({
        calories: menuItem.calories || 0,
        protein: menuItem.protein || 0,
        carbs: menuItem.carbs || 0,
        fat: menuItem.fat || 0,
        sodium: menuItem.sodium || 0,
        fiber: menuItem.fiber || 0,
        sugar: menuItem.sugar || 0
      });
      setCurrentNutrition({
        calories: menuItem.calories || 0,
        protein: menuItem.protein || 0,
        carbs: menuItem.carbs || 0,
        fat: menuItem.fat || 0,
        sodium: menuItem.sodium || 0,
        fiber: menuItem.fiber || 0,
        sugar: menuItem.sugar || 0
      });
    }
  }, [menuItem]);
  
  // Recalculate nutrition whenever customizations change
  useEffect(() => {
    let updatedNutrition = {...baseNutrition};
    
    // Subtract removed ingredients
    removedIngredients.forEach(ingredient => {
      updatedNutrition.calories -= ingredient.calories || 0;
      updatedNutrition.protein -= ingredient.protein || 0;
      updatedNutrition.carbs -= ingredient.carbs || 0;
      updatedNutrition.fat -= ingredient.fat || 0;
      updatedNutrition.sodium -= ingredient.sodium || 0;
      updatedNutrition.fiber -= ingredient.fiber || 0;
      updatedNutrition.sugar -= ingredient.sugar || 0;
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
    });
    
    // Apply serving size factor
    let sizeFactor = 1;
    switch (servingSize) {
      case 'Small':
        sizeFactor = 0.7;
        break;
      case 'Large':
        sizeFactor = 1.3;
        break;
      case 'Extra Large':
        sizeFactor = 1.5;
        break;
      default: // Regular
        sizeFactor = 1;
    }
    
    Object.keys(updatedNutrition).forEach(key => {
      updatedNutrition[key] = Math.max(0, Math.round(updatedNutrition[key] * sizeFactor));
    });
    
    setCurrentNutrition(updatedNutrition);
    
    // Notify parent component of changes
    if (onChange) {
      onChange({
        removedIngredients: removedIngredients.map(i => i.name),
        addedIngredients: addedIngredients.map(i => ({
          name: i.name,
          price: i.price || 0
        })),
        servingSize,
        specialInstructions,
        nutritionalInfo: updatedNutrition
      });
    }
  }, [baseNutrition, removedIngredients, addedIngredients, servingSize, specialInstructions, onChange]);
  
  const handleIngredientToggle = (ingredient, isRemoved) => {
    if (isRemoved) {
      // Remove ingredient
      if (removedIngredients.find(i => i.name === ingredient.name)) {
        setRemovedIngredients(prev => prev.filter(i => i.name !== ingredient.name));
      } else {
        setRemovedIngredients(prev => [...prev, ingredient]);
      }
    } else {
      // Add ingredient
      if (addedIngredients.find(i => i.name === ingredient.name)) {
        setAddedIngredients(prev => prev.filter(i => i.name !== ingredient.name));
      } else {
        setAddedIngredients(prev => [...prev, ingredient]);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Customize Your Order</h3>
      
      {/* Ingredients that can be removed */}
      {menuItem?.ingredients && menuItem.ingredients.length > 0 && (
        <Card className="p-4">
          <h4 className="mb-4 text-lg font-medium">Ingredients</h4>
          <div className="space-y-2">
            {menuItem.ingredients.map(ingredient => (
              <div key={ingredient.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id={`ingredient-${ingredient.name}`}
                    checked={!removedIngredients.find(i => i.name === ingredient.name)}
                    onCheckedChange={(checked) => {
                      if (!checked) {
                        handleIngredientToggle(ingredient, true);
                      } else {
                        handleIngredientToggle(ingredient, true);
                      }
                    }}
                    disabled={!ingredient.isRemovable}
                  />
                  <label htmlFor={`ingredient-${ingredient.name}`} className="text-sm">
                    {ingredient.name}
                  </label>
                </div>
                <div className="text-xs text-gray-500">
                  {ingredient.calories > 0 ? `${ingredient.calories} cal` : ''}
                </div>
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
                  <label htmlFor={`addon-${ingredient.name}`} className="text-sm">
                    {ingredient.name}
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
          className="w-full p-2 text-sm border rounded-md h-24"
          placeholder="E.g., Extra spicy, no onions, etc."
        />
      </Card>
      
      {/* Nutritional information */}
      <div className="mt-6">
        <NutritionSummary nutritionalInfo={currentNutrition} />
      </div>
      
      {/* Save customization */}
      <div className="flex gap-2 justify-end mt-6">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => onClose?.()}>
          Apply Changes
        </Button>
      </div>
    </div>
  );
};

export default IngredientCustomizer; 