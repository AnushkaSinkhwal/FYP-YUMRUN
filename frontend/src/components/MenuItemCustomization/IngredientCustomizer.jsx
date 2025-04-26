import { useState, useEffect } from 'react';
import { Button, Checkbox, Card, Label, RadioGroup, RadioGroupItem } from '../ui';
import NutritionSummary from '../NutritionTracker/NutritionSummary';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaMinus, FaShoppingCart } from 'react-icons/fa';
import PropTypes from 'prop-types';

/**
 * A component for customizing menu item ingredients at a detailed level
 */
const IngredientCustomizer = ({ 
  menuItem, 
  onChange
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
  const [servingSize, setServingSize] = useState('Regular');
  const [currentNutrition, setCurrentNutrition] = useState({...baseNutrition});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [cookingMethod, setCookingMethod] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
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
    if (isRemoved) {
      // Toggle removal of an ingredient
      if (removedIngredients.find(i => i.name === ingredient.name)) {
        setRemovedIngredients(prev => prev.filter(i => i.name !== ingredient.name));
      } else {
        setRemovedIngredients(prev => [...prev, ingredient]);
      }
    } else {
      // Toggle addition of an ADD-ON ingredient
      // Expect `ingredient` here to be an object from availableAddOns (including _id)
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
        setAddedIngredients(prev => [...prev, ingredient]); 
      }
    }
  };
  
  const handleQuantityChange = (amount) => {
     setQuantity(prev => Math.max(1, prev + amount)); // Ensure quantity is at least 1
  };

  // Function to call when the user confirms adding the customized item
  const handleConfirm = () => {
    if (!menuItem) return;

    // Construct the data object expected by the cart context
    const cartItemData = {
      id: menuItem.id || menuItem._id, // Ensure we have the ID
      name: menuItem.name || menuItem.item_name,
      image: menuItem.image || menuItem.imageUrl, // Get the best image
      quantity: quantity,
      price: currentPrice, // This is the FINAL calculated price for the quantity
      basePrice: basePrice, // Store the original single item base price
      selectedAddOns: addedIngredients.map(addOn => ({
         id: addOn._id || addOn.id, // Map to the expected structure { id: '...' }
         name: addOn.name, // Include name and price for display in cart perhaps
         price: addOn.price 
      })),
      // Include other customization details if needed by the cart/order summary
      customizationDetails: {
        removedIngredients: removedIngredients.map(i => i.name), // Just send names maybe
        servingSize: servingSize,
        cookingMethod: cookingMethod,
        specialInstructions: specialInstructions
      }
    };

    console.log('Confirming add to cart with data:', cartItemData);
    
    // Call the onChange prop (passed from RestaurantDetails) with the data
    if (onChange) {
      onChange(cartItemData);
    }
  };
  
  return (
    <div className="space-y-6 pb-20">
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
              <div key={ingredient.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id={`ingredient-${ingredient.name}`}
                    checked={!removedIngredients.find(i => i.name === ingredient.name)}
                    onCheckedChange={() => handleIngredientToggle(ingredient, true)}
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
            {menuItem.customizationOptions.availableAddOns.map(addOn => {
                const addOnId = addOn._id || addOn.id;
                const isChecked = !!addedIngredients.find(i => (i._id || i.id) === addOnId);
                return (
                    <div key={addOnId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                        <Checkbox 
                            id={`addon-${addOnId}`}
                            checked={isChecked}
                            onCheckedChange={() => handleIngredientToggle(addOn, false)} // Pass the addOn object
                        />
                        <label htmlFor={`addon-${addOnId}`} className="flex flex-col text-sm">
                            <span>{addOn.name}</span>
                            {/* Optional: Show health tags */}
                        </label>
                        </div>
                        <div className="flex items-center gap-2">
                        {/* Optional: Show calorie info */}
                        {addOn.price > 0 && (
                            <span className="text-xs font-medium text-gray-700">
                            +Rs.{addOn.price.toFixed(2)}
                            </span>
                        )}
                        </div>
                    </div>
                );
            })}
          </div>
        </Card>
      )}
      
      {/* Quantity Selector */}
      <Card className="p-4">
           <h4 className="mb-4 text-lg font-medium">Quantity</h4>
            <div className="flex items-center justify-center space-x-4">
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleQuantityChange(-1)} 
                    disabled={quantity <= 1}
                >
                    <FaMinus />
                </Button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleQuantityChange(1)}
                 >
                    <FaPlus />
                </Button>
            </div>
      </Card>
      
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
      
      {/* Price summary and Add to Cart button - Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-10 p-4 bg-white border-t shadow-lg dark:bg-gray-800 sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:shadow-none sm:border-t-0 sm:p-0 sm:mt-6">
          <div className="flex items-center justify-between mb-4 sm:mb-0">
              <div>
                  <h4 className="text-lg font-semibold">Total Price:</h4>
                  <span className="text-xl font-bold text-yumrun-orange">Rs.{currentPrice.toFixed(2)}</span>
              </div>
              <Button onClick={handleConfirm} size="lg" className="gap-2">
                  <FaShoppingCart className="w-5 h-5" /> Add to Cart
              </Button>
          </div>
      </div>
    </div>
  );
};

// Basic Prop Types Validation
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
      servingSizeOptions: PropTypes.arrayOf(PropTypes.string)
    })
  }).isRequired,
  onChange: PropTypes.func.isRequired, // Callback function when adding to cart
};

export default IngredientCustomizer; 