import { useState, useEffect } from 'react';
import { Button, Checkbox, Label, RadioGroup, RadioGroupItem, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui';
import { FaPlus, FaMinus, FaShoppingCart, FaInfoCircle } from 'react-icons/fa';
import PropTypes from 'prop-types';

/**
 * A component for customizing menu item ingredients at a detailed level
 * Now designed to work directly on the product page
 */
const IngredientCustomizer = ({ 
  menuItem, 
  onChange
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
  
  const [quantity, setQuantity] = useState(1);
  
  // Use discounted price if available, otherwise original price for initial state
  const initialStartingPrice = menuItem?.discountedPrice !== undefined ? menuItem.discountedPrice : (menuItem?.price || menuItem?.item_price || 0);
  
  // State for the base price of the item (potentially discounted)
  const [basePrice, setBasePrice] = useState(initialStartingPrice);
  const [currentPrice, setCurrentPrice] = useState(initialStartingPrice);
  const [removedIngredients, setRemovedIngredients] = useState([]);
  const [addedIngredients, setAddedIngredients] = useState([]);
  const [servingSize] = useState('Regular');
  const [currentNutrition, setCurrentNutrition] = useState({...baseNutrition});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [cookingMethod, setCookingMethod] = useState(null);
  
  // Dynamic cooking methods from menuItem.customizationOptions.cookingOptions
  const dynamicCooking = menuItem?.customizationOptions?.cookingOptions || [];
  const cookingMethods = [
    // Default option
    { id: 'default', name: 'Default', price: 0, impact: {} },
    ...dynamicCooking.map(opt => ({
      id: opt._id?.toString() || opt.id,
      name: opt.name,
      price: opt.price || 0,
      impact: opt.impact || {}
    }))
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
      
      // Set base and current price using potentially discounted price
      const startingPrice = menuItem.discountedPrice !== undefined ? menuItem.discountedPrice : (menuItem.price || menuItem.item_price || 0);
      setBasePrice(startingPrice); // basePrice state now holds the potentially discounted price
      setCurrentPrice(startingPrice);
      
      // Initialize default cooking method
      setCookingMethod('default');
      
      // Reset other states when menu item changes
      setAddedIngredients([]);
      setRemovedIngredients([]);
      setSpecialInstructions('');
      setQuantity(1);
    }
  }, [menuItem]);
  
  // Recalculate nutrition and price whenever customizations change
  useEffect(() => {
    let updatedNutrition = {...baseNutrition};
    let itemPrice = basePrice;
    
    // Subtract removed ingredients based on portion size
    removedIngredients.forEach(ingredient => {
      updatedNutrition.calories -= (ingredient.calories || 0);
      updatedNutrition.protein -= (ingredient.protein || 0);
      updatedNutrition.carbs -= (ingredient.carbs || 0);
      updatedNutrition.fat -= (ingredient.fat || 0);
      updatedNutrition.sodium -= (ingredient.sodium || 0);
      updatedNutrition.fiber -= (ingredient.fiber || 0);
      updatedNutrition.sugar -= (ingredient.sugar || 0);
      
      // Adjust price if ingredient removal affects price
      if (ingredient.price) {
        itemPrice -= ingredient.price;
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
      itemPrice += ingredient.price || 0;
    });
    
    // Apply cooking method impacts and price if selected
    const selectedMethod = cookingMethods.find(method => method.id === cookingMethod);
    if (selectedMethod) {
      // Nutritional impact
      Object.entries(selectedMethod.impact || {}).forEach(([nutrient, value]) => {
        if (updatedNutrition[nutrient] !== undefined) {
          updatedNutrition[nutrient] = Math.max(0, updatedNutrition[nutrient] + value);
        }
      });
      // Price impact
      itemPrice += selectedMethod.price || 0;
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
    
    // Apply price adjustment based on serving size
    itemPrice = Math.max(0, itemPrice * (1 + priceAdjustment));
    
    // Calculate FINAL price including quantity
    const finalPrice = Math.max(0, itemPrice * quantity);
    const roundedFinalPrice = Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
    
    setCurrentNutrition(updatedNutrition);
    setCurrentPrice(roundedFinalPrice);
    
    // DO NOT Notify parent component here anymore
  }, [baseNutrition, basePrice, removedIngredients, addedIngredients, cookingMethod, servingSize, specialInstructions, quantity]);
  
  const handleIngredientToggle = (ingredient, isRemoved) => {
    console.log('[handleIngredientToggle] Called for:', ingredient.name, 'isRemoved:', isRemoved);
    console.log('[handleIngredientToggle] Current addedIngredients:', addedIngredients);

    if (isRemoved) {
      // Toggle removal of an ingredient
      if (removedIngredients.find(i => i.name === ingredient.name)) {
        setRemovedIngredients(prev => prev.filter(i => i.name !== ingredient.name));
      } else {
        setRemovedIngredients(prev => [...prev, ingredient]);
      }
    } else {
      // Toggle addition of an ADD-ON ingredient
      const ingredientId = ingredient._id || ingredient.id; // Get the ID
      if (!ingredientId) {
        console.error("Add-on ingredient missing ID:", ingredient);
        return; 
      }

      if (addedIngredients.find(i => (i._id || i.id) === ingredientId)) {
        // Remove if already added
        setAddedIngredients(prev => prev.filter(i => (i._id || i.id) !== ingredientId));
      } else {
        // Add the add-on object (which includes the ID)
        setAddedIngredients(prev => {
           const newState = [...prev, ingredient];
           console.log('[handleIngredientToggle] New addedIngredients state (added):', newState);
           return newState;
        }); 
      }
    }
  };
  
  const handleQuantityChange = (amount) => {
     setQuantity(prev => Math.max(1, prev + amount)); // Ensure quantity is at least 1
  };

  // Function to call when adding to cart
  const handleAddToCart = () => {
    if (!menuItem) return;

    // Determine the correct original base price (before discounts/addons)
    const originalItemBasePrice = menuItem?.originalPrice || menuItem?.price || menuItem?.item_price || 0;

    // Construct the data object expected by the cart context
    const cartItemData = {
      id: menuItem.id || menuItem._id, // Ensure we have the ID
      name: menuItem.name || menuItem.item_name,
      image: menuItem.image || menuItem.imageUrl, // Get the best image
      quantity: quantity,
      price: currentPrice, // This is the FINAL calculated price for the quantity
      unitPrice: currentPrice / quantity, // Unit price with customizations
      basePrice: originalItemBasePrice, // Store the NON-discounted base price of the item itself
      selectedAddOns: addedIngredients.map(addOn => ({
         id: addOn._id || addOn.id, 
         name: addOn.name, 
         price: addOn.price,
         // Include nutrition information for each addon
         nutrition: {
           calories: addOn.calories || 0,
           protein: addOn.protein || 0,
           carbs: addOn.carbs || 0,
           fat: addOn.fat || 0
         }
      })),
      // Include other customization details if needed by the cart/order summary
      customizationDetails: {
        removedIngredients: removedIngredients.map(i => i.name),
        servingSize: servingSize,
        cookingMethod: cookingMethod,
        specialInstructions: specialInstructions,
        // Include total nutrition values for the customized item
        nutrition: {...currentNutrition}
      }
    };

    // Call the onChange prop (passed from ProductDetails)
    if (onChange) {
      onChange(cartItemData);
    }
  };

  // Updated compact layout for inline display
  return (
    <div className="space-y-4">
      {/* Add-on ingredients (most important customization) */}
      {menuItem?.customizationOptions?.availableAddOns && menuItem.customizationOptions.availableAddOns.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Additional Ingredients</h4>
          <div className="space-y-2">
            {menuItem.customizationOptions.availableAddOns.map(addOn => (
              <div key={addOn._id || addOn.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <div className="flex items-center gap-2 flex-1">
                  <Checkbox 
                    id={`addon-${addOn._id || addOn.id}`}
                    checked={!!addedIngredients.find(i => (i._id || i.id) === (addOn._id || addOn.id))}
                    onCheckedChange={() => handleIngredientToggle(addOn, false)}
                  />
                  <label htmlFor={`addon-${addOn._id || addOn.id}`} className="text-sm font-medium flex-1">
                    {addOn.name}
                    {addOn.price > 0 && <span className="ml-1 text-gray-500">+Rs. {addOn.price.toFixed(2)}</span>}
                  </label>
                </div>
                
                {/* Nutrition tooltip for addon */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <FaInfoCircle size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs p-1">
                        <div className="font-semibold mb-1">Nutrition Info:</div>
                        <div>Calories: +{addOn.calories || 0} kcal</div>
                        <div>Protein: +{addOn.protein || 0}g</div>
                        <div>Carbs: +{addOn.carbs || 0}g</div>
                        <div>Fat: +{addOn.fat || 0}g</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
          </div>
          
          {/* Summary of selected addons */}
          {addedIngredients.length > 0 && (
            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
              <p className="font-medium">Selected add-ons nutrition impact:</p>
              <div className="grid grid-cols-4 gap-2 mt-1">
                <div>
                  <span className="text-xs text-gray-500">Cal</span><br />
                  <span>+{addedIngredients.reduce((sum, addon) => sum + (addon.calories || 0), 0)} kcal</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Protein</span><br />
                  <span>+{addedIngredients.reduce((sum, addon) => sum + (addon.protein || 0), 0)}g</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Carbs</span><br />
                  <span>+{addedIngredients.reduce((sum, addon) => sum + (addon.carbs || 0), 0)}g</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Fat</span><br />
                  <span>+{addedIngredients.reduce((sum, addon) => sum + (addon.fat || 0), 0)}g</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Quantity selector */}
      <div>
        <h4 className="font-medium mb-2">Quantity</h4>
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
            className="h-9 px-3"
          >
            <FaMinus className="h-3 w-3" />
          </Button>
          <div className="px-4 py-2 w-12 text-center font-medium">
            {quantity}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuantityChange(1)}
            className="h-9 px-3"
          >
            <FaPlus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Cooking Method - important for health and taste */}
      <div>
        <h4 className="font-medium mb-2">Cooking Method</h4>
        <RadioGroup value={cookingMethod} onValueChange={setCookingMethod} className="flex flex-wrap gap-2">
          {cookingMethods.map(method => (
            <div key={method.id} className="flex items-center">
              <RadioGroupItem id={`cooking-${method.id}`} value={method.id} className="mr-1" />
              <Label htmlFor={`cooking-${method.id}`} className="text-sm flex-1">
                {method.name}
                {method.id !== 'default' && method.price > 0 && (
                  <span className="ml-1 text-xs text-gray-500">+Rs. {method.price.toFixed(2)}</span>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {/* Optional: Special instructions if not already handled by parent */}
      <div>
        <h4 className="font-medium mb-2">Special Instructions</h4>
        <textarea
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded resize-none focus:ring-1 focus:ring-yumrun-primary focus:outline-none"
          placeholder="Add any special requests or preparation instructions here"
          rows={2}
        />
      </div>
      
      {/* Price and Nutrition Summary */}
      <div className="border-t border-gray-200 pt-4 space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total Price:</span>
          <span className="text-xl font-bold text-yumrun-primary">Rs. {currentPrice.toFixed(2)}</span>
        </div>
        
        {/* Expanded nutrition details */}
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-medium text-sm mb-2">Nutritional Information (per serving)</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Calories</div>
              <div className="font-medium">{currentNutrition.calories} kcal</div>
              <div className="text-xs text-gray-500">{Math.round(currentNutrition.calories / 2000 * 100)}% of daily value</div>
            </div>
            <div>
              <div className="text-gray-500">Protein</div>
              <div className="font-medium">{currentNutrition.protein}g</div>
              <div className="text-xs text-gray-500">{Math.round(currentNutrition.protein / 50 * 100)}% of daily value</div>
            </div>
            <div>
              <div className="text-gray-500">Carbs</div>
              <div className="font-medium">{currentNutrition.carbs}g</div>
              <div className="text-xs text-gray-500">{Math.round(currentNutrition.carbs / 275 * 100)}% of daily value</div>
            </div>
            <div>
              <div className="text-gray-500">Fat</div>
              <div className="font-medium">{currentNutrition.fat}g</div>
              <div className="text-xs text-gray-500">{Math.round(currentNutrition.fat / 78 * 100)}% of daily value</div>
            </div>
            <div>
              <div className="text-gray-500">Sodium</div>
              <div className="font-medium">{currentNutrition.sodium}mg</div>
              <div className="text-xs text-gray-500">{Math.round(currentNutrition.sodium / 2300 * 100)}% of daily value</div>
            </div>
            <div>
              <div className="text-gray-500">Sugar</div>
              <div className="font-medium">{currentNutrition.sugar}g</div>
              <div className="text-xs text-gray-500">{Math.round(currentNutrition.sugar / 50 * 100)}% of daily value</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add to Cart Button */}
      <Button 
        onClick={handleAddToCart} 
        className="w-full mt-4" 
        size="lg"
        variant="primary"
      >
        <FaShoppingCart className="mr-2" />
        Add to Cart
      </Button>
    </div>
  );
};

// PropTypes remain the same
IngredientCustomizer.propTypes = {
  menuItem: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    name: PropTypes.string,
    item_name: PropTypes.string,
    image: PropTypes.string,
    imageUrl: PropTypes.string,
    price: PropTypes.number,
    item_price: PropTypes.number,
    discountedPrice: PropTypes.number,
    originalPrice: PropTypes.number,
    calories: PropTypes.number,
    protein: PropTypes.number,
    carbs: PropTypes.number,
    fat: PropTypes.number,
    sodium: PropTypes.number,
    fiber: PropTypes.number,
    sugar: PropTypes.number,
    ingredients: PropTypes.array,
    customizationOptions: PropTypes.shape({
      availableAddOns: PropTypes.arrayOf(PropTypes.shape({
        _id: PropTypes.string,
        id: PropTypes.string,
        name: PropTypes.string.isRequired,
        price: PropTypes.number,
        calories: PropTypes.number,
        protein: PropTypes.number,
        carbs: PropTypes.number,
        fat: PropTypes.number,
        sodium: PropTypes.number,
        fiber: PropTypes.number,
        sugar: PropTypes.number
      })),
      servingSizeOptions: PropTypes.arrayOf(PropTypes.string),
      cookingOptions: PropTypes.arrayOf(PropTypes.shape({
        _id: PropTypes.string,
        id: PropTypes.string,
        name: PropTypes.string.isRequired,
        price: PropTypes.number,
        impact: PropTypes.object
      }))
    })
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default IngredientCustomizer; 