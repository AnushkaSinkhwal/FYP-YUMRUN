import { useState } from "react";
import { Rating, Button, TextField, Tabs, Tab, Box, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { BsCartFill, BsHeartFill } from "react-icons/bs";
import ProductZoom from "../../components/ProductZoom";
import QuantityBox from "../../components/QuantityBox";
import RelatedProducts from "./RelatedProducts";

const ProductDetails = () => {
  const [value, setValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [servingSize, setServingSize] = useState(2);
  const [cookingMethod, setCookingMethod] = useState("Firewood Oven");
  const [selectedIngredients, setSelectedIngredients] = useState([
    "Fresh Dough",
    "Tomato Sauce",
    "Mozzarella Cheese",
    "Pepperoni",
  ]);

  const basePrice = 520;
  const discountPercentage = 0.15;
  const originalPrice = Math.round(basePrice / (1 - discountPercentage));

  const ingredientPrices = {
    Pepperoni: 50,
    Olives: 30,
    BellPeppers: 20,
    Onions: 20,
    ItalianSausage: 40,
  };

  const nutritionalValues = {
    "Fresh Dough": { calories: 200, protein: 5, carbs: 30, fat: 5 },
    "Tomato Sauce": { calories: 50, protein: 2, carbs: 10, fat: 1 },
    "Mozzarella Cheese": { calories: 150, protein: 10, carbs: 2, fat: 12 },
    "Pepperoni": { calories: 180, protein: 8, carbs: 1, fat: 15 },
    "Olives": { calories: 40, protein: 1, carbs: 4, fat: 3 },
    "BellPeppers": { calories: 25, protein: 1, carbs: 5, fat: 0 },
    "Onions": { calories: 20, protein: 0, carbs: 5, fat: 0 },
    "ItalianSausage": { calories: 160, protein: 10, carbs: 2, fat: 13 },
  };

  const cookingMethods = {
    "Firewood Oven": { caloriesAdjustment: 1.0, description: "Traditional cooking method for authentic taste" },
    "Electric Oven": { caloriesAdjustment: 0.9, description: "Energy-efficient cooking with consistent results" },
    "Air Fryer": { caloriesAdjustment: 0.8, description: "Low-fat cooking method, reduces calories" },
    "Stovetop": { caloriesAdjustment: 1.1, description: "Quick cooking method for thin-crust pizzas" },
  };

  const calculatePrice = () => {
    let extraCost = selectedIngredients.reduce(
      (sum, ingredient) => sum + (ingredientPrices[ingredient] || 0),
      0
    );
    return (basePrice + extraCost) * (servingSize / 2);
  };

  const calculateNutrition = () => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    selectedIngredients.forEach((ingredient) => {
      const nutrient = nutritionalValues[ingredient] || {};
      totalCalories += nutrient.calories || 0;
      totalProtein += nutrient.protein || 0;
      totalCarbs += nutrient.carbs || 0;
      totalFat += nutrient.fat || 0;
    });

    // Adjust according to serving size
    totalCalories = totalCalories * (servingSize / 2);
    totalProtein = totalProtein * (servingSize / 2);
    totalCarbs = totalCarbs * (servingSize / 2);
    totalFat = totalFat * (servingSize / 2);
    
    // Apply cooking method adjustment
    const cookingAdjustment = cookingMethods[cookingMethod]?.caloriesAdjustment || 1.0;
    totalCalories = Math.round(totalCalories * cookingAdjustment);
    
    // Round values for better display
    totalProtein = Math.round(totalProtein);
    totalCarbs = Math.round(totalCarbs);
    totalFat = Math.round(totalFat);

    return { totalCalories, totalProtein, totalCarbs, totalFat };
  };

  const toggleIngredient = (ingredient) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((item) => item !== ingredient)
        : [...prev, ingredient]
    );
  };

  return (
    <section className="productDetails section">
      <div className="container">
        <div className="row">
          <div className="col-md-4 pl-5">
            <ProductZoom />
          </div>

          <div className="col-md-7 pl-5 pr-5">
            <h2 className="hd text-capitalize">All Natural Italian-Style Fire and Meat Pizza</h2>

            <ul className="list list-inline">
              <li className="list-inline-item">
                <span className="text-light mr-2">Restaurant: </span><span>Namaste</span>
              </li>
              <li className="list-inline-item">
                <Rating name="read-only" value={4.5} precision={0.5} readOnly size="small" />
                <span className="text-light cursor"> 1 Review </span>
              </li>
            </ul>

            <div className="d-flex info">
              <span className="oldPrice">Rs.{originalPrice}</span>
              <span className="netPrice text-danger ml-2">Rs.520</span>
            </div>
            <span className="badge badge-success">IN STOCK</span>

            <p className="mt-3">
              Customize your pizza with your favorite ingredients and preferred cooking method. You can also monitor your daily intake by viewing comprehensive macronutrient and calorie breakdowns for each meal.
            </p>

            <FormControl fullWidth className="mt-3">
              <InputLabel sx={{ top: '-8px' }}>Cooking Method</InputLabel>
              <Select value={cookingMethod} onChange={(e) => setCookingMethod(e.target.value)}>
                {Object.keys(cookingMethods).map((method) => (
                  <MenuItem key={method} value={method}>
                    {method} - {cookingMethods[method].description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth className="mt-5">
              <InputLabel sx={{ top: '-8px' }}>Serving Size</InputLabel>
              <Select value={servingSize} onChange={(e) => setServingSize(e.target.value)}>
                <MenuItem value={1}>1 Person</MenuItem>
                <MenuItem value={2}>2-3 People</MenuItem>
                <MenuItem value={3}>4-5 People</MenuItem>
              </Select>
            </FormControl>

            <div className="mt-3">
              <h5>Choose Ingredients:</h5>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(ingredientPrices).map((ingredient) => (
                  <div key={ingredient} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={selectedIngredients.includes(ingredient)}
                      onChange={() => toggleIngredient(ingredient)}
                      id={`ingredient-${ingredient}`}
                    />
                    <label className="ml-2" htmlFor={`ingredient-${ingredient}`}>
                      {ingredient} (+Rs.{ingredientPrices[ingredient]})
                      {nutritionalValues[ingredient] && (
                        <span className="text-xs block text-gray-500">
                          {nutritionalValues[ingredient].calories} kcal
                        </span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 p-4 bg-gray-50 rounded-lg">
              <h5 className="font-bold mb-2">Nutritional Information</h5>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="font-bold text-xl">{calculateNutrition().totalCalories}</div>
                  <div className="text-sm text-gray-500">Calories</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl">{calculateNutrition().totalProtein}g</div>
                  <div className="text-sm text-gray-500">Protein</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl">{calculateNutrition().totalCarbs}g</div>
                  <div className="text-sm text-gray-500">Carbs</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl">{calculateNutrition().totalFat}g</div>
                  <div className="text-sm text-gray-500">Fat</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                * Nutritional values update dynamically based on your customizations
              </div>
            </div>

            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              placeholder="Write any special requests for your order here..."
              className="mt-3"
            />

            <div className="mt-3">
              <h5>Updated Price:</h5>
              <span className="netPrice text-danger">Rs.{calculatePrice()}</span>
            </div>

            <div className="d-flex align-items-center mt-4">
              <QuantityBox />
              <Button className="btn-blue btn-lg btn-bog btn-round ml-3">
                <BsCartFill /> &nbsp; Add to Cart
              </Button>
              <Button className="btn-blue btn-lg btn-bog btn-round ml-3">Order Now</Button>
              <div
                className="favorite-container ml-3 position-relative"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <BsHeartFill className="favorite-icon" />
                {isHovered && (
                  <span className="favorite-text position-absolute" style={{ left: "50%", transform: "translateX(-50%)", background: "#000", color: "#fff", padding: "5px", borderRadius: "5px" }}>
                    Add to Favorite
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Box sx={{ width: "100%" }} className="tabs">
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={value} onChange={(event, newValue) => setValue(newValue)} aria-label="product details tabs">
              <Tab label="Description" className="itemTab" />
              <Tab label="Reviews" className="itemTab" />
            </Tabs>
          </Box>

          {/* Description Tab */}
          {value === 0 && (
            <Box p={3}>
              <h4 className="text-2xl font-bold mb-3">Description</h4>
              <p>Detailed description of the product...</p>
            </Box>
          )}

          {/* Reviews Tab */}
          {value === 1 && (
            <Box p={3}>
              <h4 className="text-2xl font-bold mb-3">Reviews</h4>
              <p>There are no reviews yet.</p>
              <h4 className="text-2xl mt-3 font-light">Be the first one.</h4>
              <p className="font-bold text-sm">
                Your email address will not be published. Required fields are marked *
              </p>
              <p className="font-light text-sm mb-3">Your Rating *</p>
              <Rating
                name="simple-controlled"
                value={value}
                onChange={(event, newValue) => {
                  setValue(newValue);
                }}
              />

              {/* Review Form */}
              <p className="mt-2 font-bold">Your Review *</p>
              <form className="mt-4 w-full">
                <div className="form-group w-full">
                  <TextField
                    id="review"
                    label="Review"
                    variant="outlined"
                    className="w-full"
                    multiline
                    rows={5}
                    sx={{ width: "82%", mb: 3 }}
                  />
                </div>

                <div className="form-group d-flex" style={{ gap: "20px", marginBottom: "10px" }}>
                  <TextField id="name" label="Name" variant="outlined" sx={{ width: "40%" }} />
                  <TextField id="email" label="Email" variant="outlined" sx={{ width: "40%" }} />
                </div>
              </form>

              <Button className="btn-bog" variant="contained">
                Submit Review
              </Button>
            </Box>
          )}
        </Box>

        <RelatedProducts />
      </div>
    </section>
  );
};

export default ProductDetails;
