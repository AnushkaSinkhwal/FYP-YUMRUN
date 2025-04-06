import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaUtensils, FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import ProductZoom from '../../components/ProductZoom';
import ProductSummary from '../../components/ProductSummary';
import ProductFeatures from '../../components/ProductFeatures';
import RelatedProducts from './RelatedProducts';
import { useAuth } from '../../context/AuthContext';
import { Button, Alert, Spinner } from '../../components/ui';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [servingSize, setServingSize] = useState('medium');
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('features');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [selectedToppings, setSelectedToppings] = useState([]);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [removedIngredients, setRemovedIngredients] = useState([]);
    
    // New state for favorites and reviews
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState(null);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [newReviewRating, setNewReviewRating] = useState(0);
    const [newReviewComment, setNewReviewComment] = useState('');
    const [newReviewOrderId, setNewReviewOrderId] = useState('');
    const [reviewError, setReviewError] = useState(null);
    const [reviewSubmitError, setReviewSubmitError] = useState(null);
    const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState(false);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    // Fetch product data when component mounts
    useEffect(() => {
        // Simulate API call with setTimeout
        setTimeout(() => {
            // Mock product data
            const mockProduct = {
                id: id,
                name: "Classic Margherita Pizza",
                category: "Italian",
                rating: 4.5,
                ratingCount: 128,
                price: 12.99,
                description: "Our authentic Margherita pizza features a thin, crispy crust topped with fresh tomato sauce, mozzarella cheese, and basil leaves. Made with the finest ingredients and baked to perfection.",
                availability: true,
                discount: 10,
                features: [
                    "Fresh ingredients sourced locally",
                    "Made-to-order for maximum freshness",
                    "No artificial preservatives",
                    "Gluten-free options available",
                    "Customizable toppings and ingredients"
                ],
                nutritionalInfo: {
                    calories: 285,
                    fat: 10.5,
                    carbs: 34,
                    protein: 15,
                    sodium: 520,
                    allergens: ["Wheat", "Dairy"]
                },
                servingSizes: [
                    { id: 'small', name: 'Small (8")', priceMultiplier: 0.8 },
                    { id: 'medium', name: 'Medium (12")', priceMultiplier: 1 },
                    { id: 'large', name: 'Large (16")', priceMultiplier: 1.2 },
                ],
                // Add available toppings and ingredients
                availableToppings: [
                    { id: 'pepperoni', name: 'Pepperoni', price: 1.50 },
                    { id: 'mushrooms', name: 'Mushrooms', price: 1.00 },
                    { id: 'olives', name: 'Black Olives', price: 0.75 },
                    { id: 'onions', name: 'Red Onions', price: 0.50 },
                    { id: 'bellPeppers', name: 'Bell Peppers', price: 0.75 },
                    { id: 'extraCheese', name: 'Extra Cheese', price: 1.50 },
                    { id: 'bacon', name: 'Bacon', price: 1.75 },
                    { id: 'pineapple', name: 'Pineapple', price: 0.75 }
                ],
                baseIngredients: [
                    { id: 'sauce', name: 'Tomato Sauce' },
                    { id: 'cheese', name: 'Mozzarella Cheese' },
                    { id: 'basil', name: 'Fresh Basil' },
                    { id: 'oliveOil', name: 'Olive Oil' }
                ]
            };
            
            setProduct(mockProduct);
            // Initialize selected ingredients with all base ingredients
            setSelectedIngredients(mockProduct.baseIngredients.map(ing => ing.id));
            setLoading(false);
        }, 500);
    }, [id]);

    const handleQuantityChange = (action) => {
        if (action === 'decrease' && quantity > 1) {
            setQuantity(quantity - 1);
        } else if (action === 'increase') {
            setQuantity(quantity + 1);
        }
    };

    const handleServingSizeChange = (size) => {
        setServingSize(size);
    };

    // Handle topping selection
    const handleToppingToggle = (toppingId) => {
        setSelectedToppings(prevToppings => {
            if (prevToppings.includes(toppingId)) {
                return prevToppings.filter(id => id !== toppingId);
            } else {
                return [...prevToppings, toppingId];
            }
        });
    };

    // Handle ingredient toggling
    const handleIngredientToggle = (ingredientId) => {
        if (selectedIngredients.includes(ingredientId)) {
            // If ingredient is currently selected, remove it
            setSelectedIngredients(prev => prev.filter(id => id !== ingredientId));
            // Add to removed list
            setRemovedIngredients(prev => [...prev, ingredientId]);
        } else {
            // If ingredient was removed, add it back
            setSelectedIngredients(prev => [...prev, ingredientId]);
            // Remove from removed list
            setRemovedIngredients(prev => prev.filter(id => id !== ingredientId));
        }
    };

    const addToCart = () => {
        // Logic to add to cart
        console.log('Added to order:', { 
            product, 
            quantity, 
            servingSize,
            specialInstructions,
            selectedToppings,
            removedIngredients,
            total: calculateTotalPrice()
        });
        
        // Here you would dispatch to your cart state/store
    };

    const calculateTotalPrice = () => {
        if (!product) return 0;
        
        // Base price calculation
        const basePrice = product.discount > 0 
            ? product.price * (1 - product.discount / 100) 
            : product.price;
            
        const sizeMultiplier = product.servingSizes.find(size => size.id === servingSize)?.priceMultiplier || 1;
        
        // Calculate toppings price
        const toppingsPrice = selectedToppings.reduce((total, toppingId) => {
            const topping = product.availableToppings.find(t => t.id === toppingId);
            return total + (topping ? topping.price : 0);
        }, 0);
        
        // Calculate total
        return (((basePrice * sizeMultiplier) + toppingsPrice) * quantity).toFixed(2);
    };

    // Calculate nutritional information based on selections
    const calculateNutritionalInfo = () => {
        if (!product) return product?.nutritionalInfo;
        
        // Start with base nutritional info
        const baseNutrition = { ...product.nutritionalInfo };
        
        // Adjust based on ingredients removed
        removedIngredients.forEach(ingredientId => {
            // In a real app, each ingredient would have nutritional data
            // This is a simplified example assuming 10% reduction per ingredient removed
            const reductionFactor = 0.1;
            // Adjust reduction based on specific ingredient type
            let adjustedReductionFactor = reductionFactor;
            if (ingredientId === 'cheese') {
                adjustedReductionFactor = 0.15; // Higher impact for cheese removal
            } else if (ingredientId === 'sauce') {
                adjustedReductionFactor = 0.05; // Lower impact for sauce removal
            }
            
            baseNutrition.calories = Math.round(baseNutrition.calories * (1 - adjustedReductionFactor));
            baseNutrition.protein = +(baseNutrition.protein * (1 - adjustedReductionFactor)).toFixed(1);
            baseNutrition.carbs = +(baseNutrition.carbs * (1 - adjustedReductionFactor)).toFixed(1);
            baseNutrition.fat = +(baseNutrition.fat * (1 - adjustedReductionFactor)).toFixed(1);
        });
        
        // Add nutrition from toppings (simplified example)
        selectedToppings.forEach(toppingId => {
            const topping = product.availableToppings.find(t => t.id === toppingId);
            
            // Sample nutritional impact based on topping type
            if (topping) {
                switch(topping.id) {
                    case 'pepperoni':
                        baseNutrition.calories += 40;
                        baseNutrition.protein += 2.0;
                        baseNutrition.fat += 3.5;
                        break;
                    case 'extraCheese':
                        baseNutrition.calories += 50;
                        baseNutrition.protein += 3.0;
                        baseNutrition.fat += 4.0;
                        break;
                    case 'mushrooms':
                    case 'onions':
                    case 'bellPeppers':
                        baseNutrition.calories += 10;
                        baseNutrition.carbs += 2.0;
                        baseNutrition.fiber = (baseNutrition.fiber || 0) + 0.5;
                        break;
                    case 'bacon':
                        baseNutrition.calories += 45;
                        baseNutrition.protein += 2.5;
                        baseNutrition.fat += 3.8;
                        break;
                    default:
                        baseNutrition.calories += 15;
                        baseNutrition.carbs += 1.0;
                }
            }
        });
        
        // Adjust based on serving size
        const sizeMultiplier = product.servingSizes.find(size => size.id === servingSize)?.priceMultiplier || 1;
        baseNutrition.calories = Math.round(baseNutrition.calories * sizeMultiplier);
        baseNutrition.protein = +(baseNutrition.protein * sizeMultiplier).toFixed(1);
        baseNutrition.carbs = +(baseNutrition.carbs * sizeMultiplier).toFixed(1);
        baseNutrition.fat = +(baseNutrition.fat * sizeMultiplier).toFixed(1);
        
        return baseNutrition;
    };

    // Check if item is in favorites
    useEffect(() => {
        if (isAuthenticated && id) {
            checkFavoriteStatus();
        }
    }, [isAuthenticated, id]);

    // Fetch reviews
    useEffect(() => {
        if (id) {
            fetchReviews();
        }
    }, [id]);

    // Function to check favorite status
    const checkFavoriteStatus = async () => {
        try {
            const response = await fetch(`/api/favorites/${id}/check`);
            
            if (response.ok) {
                const data = await response.json();
                setIsFavorite(data.data.isFavorite);
            }
        } catch (error) {
            console.error('Error checking favorite status:', error);
        }
    };

    // Function to toggle favorite status
    const toggleFavorite = async () => {
        if (!isAuthenticated) {
            navigate('/signin', { state: { from: `/product/${id}` } });
            return;
        }
        
        setFavoriteLoading(true);
        
        try {
            let response;
            
            if (isFavorite) {
                // Remove from favorites
                response = await fetch(`/api/favorites/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                // Add to favorites
                response = await fetch('/api/favorites', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        menuItemId: id
                    })
                });
            }
            
            if (response.ok) {
                setIsFavorite(!isFavorite);
            }
        } catch (error) {
            console.error('Error toggling favorite status:', error);
        } finally {
            setFavoriteLoading(false);
        }
    };

    // Function to fetch reviews
    const fetchReviews = async () => {
        setReviewsLoading(true);
        setReviewsError(null);
        
        try {
            const response = await fetch(`/api/reviews/menuItem/${id}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch reviews');
            }
            
            const data = await response.json();
            
            if (data.success) {
                setReviews(data.data.reviews);
                setAverageRating(data.data.meta.averageRating);
                setTotalReviews(data.data.meta.total);
            } else {
                throw new Error(data.error.message || 'Failed to fetch reviews');
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setReviewsError('Unable to load reviews');
        } finally {
            setReviewsLoading(false);
        }
    };

    // Function to render star rating
    const renderStarRating = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        // Add full stars
        for (let i = 0; i < fullStars; i++) {
            stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
        }
        
        // Add half star if needed
        if (hasHalfStar) {
            stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
        }
        
        // Add empty stars
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
        }
        
        return stars;
    };

    const submitReview = async () => {
        if (!isAuthenticated) {
            navigate('/signin', { state: { from: `/product/${id}` } });
            return;
        }

        // Check if user is allowed to review
        if (user?.role !== 'customer') {
            setReviewSubmitError('Only customers can leave reviews');
            return;
        }
        
        // Validate inputs
        const errors = {};
        if (!newReviewRating) {
            errors.rating = 'Please select a rating';
        }
        if (!newReviewOrderId) {
            errors.orderId = 'Order ID is required';
        }
        
        if (Object.keys(errors).length > 0) {
            setReviewError(errors);
            return;
        }
        
        setReviewSubmitting(true);
        setReviewSubmitError(null);
        setReviewSubmitSuccess(false);
        setReviewError(null);
        
        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    menuItemId: id,
                    rating: newReviewRating,
                    comment: newReviewComment,
                    orderId: newReviewOrderId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setNewReviewRating(0);
                setNewReviewComment('');
                setNewReviewOrderId('');
                setReviewSubmitSuccess(true);
                
                // Refresh reviews list
                fetchReviews();
            } else {
                throw new Error(data.error?.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            setReviewSubmitError('Unable to submit review. ' + (error.message || ''));
        } finally {
            setReviewSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-5">
                <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yumrun-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="product-details py-8 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="mb-6 lg:mb-0">
                            <ProductZoom />
                        </div>
                        <div>
                            <div className="flex justify-between items-start">
                            <ProductSummary product={product} />
                                <button 
                                    onClick={toggleFavorite}
                                    disabled={favoriteLoading}
                                    className={`p-2 rounded-full transition-colors ${
                                        isFavorite 
                                            ? 'bg-red-50 text-red-500' 
                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                    }`}
                                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    {favoriteLoading ? (
                                        <Spinner size="sm" />
                                    ) : isFavorite ? (
                                        <FaHeart className="text-xl" />
                                    ) : (
                                        <FaRegHeart className="text-xl" />
                                    )}
                                </button>
                            </div>
                            
                            {/* Rating Summary */}
                            <div className="mt-4 flex items-center">
                                <div className="flex mr-2">
                                    {renderStarRating(averageRating)}
                                </div>
                                <span className="text-sm text-gray-600">
                                    {averageRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                                </span>
                            </div>
                            
                            {/* Size Selection */}
                            <div className="mt-6 mb-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Size</h3>
                                <div className="flex flex-wrap gap-2">
                                    {product.servingSizes.map((size) => (
                                        <button
                                            key={size.id}
                                            className={`px-4 py-2 rounded-md font-medium transition-all ${
                                                servingSize === size.id
                                                    ? 'bg-yumrun-primary text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                            onClick={() => handleServingSizeChange(size.id)}
                                        >
                                            {size.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Ingredients Customization */}
                            <div className="my-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Customize Ingredients</h3>
                                <div className="space-y-2 mb-4">
                                    <p className="text-sm text-gray-600">Base ingredients (toggle to remove):</p>
                                    <div className="flex flex-wrap gap-2">
                                        {product.baseIngredients.map((ingredient) => (
                                            <button
                                                key={ingredient.id}
                                                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                                    selectedIngredients.includes(ingredient.id)
                                                        ? 'bg-green-100 text-green-800 border border-green-300'
                                                        : 'bg-red-100 text-red-800 border border-red-300'
                                                }`}
                                                onClick={() => handleIngredientToggle(ingredient.id)}
                                            >
                                                {selectedIngredients.includes(ingredient.id) ? '✓ ' : '✕ '}
                                                {ingredient.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Toppings Selection */}
                            <div className="my-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Toppings</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {product.availableToppings.map((topping) => (
                                        <div 
                                            key={topping.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                                selectedToppings.includes(topping.id)
                                                    ? 'border-yumrun-primary bg-yumrun-primary bg-opacity-10'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => handleToppingToggle(topping.id)}
                                        >
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-yumrun-primary border-gray-300 rounded focus:ring-yumrun-primary"
                                                    checked={selectedToppings.includes(topping.id)}
                                                    onChange={() => {}} // Handled by parent div click
                                                />
                                                <label className="ml-2 text-sm font-medium text-gray-700">
                                                    {topping.name}
                                                </label>
                                            </div>
                                            <span className="text-sm font-medium text-yumrun-primary">
                                                +${topping.price.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Quantity Selector */}
                            <div className="my-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Quantity</h3>
                                <div className="flex items-center">
                                    <button
                                        className="w-10 h-10 rounded-l-lg bg-gray-100 flex items-center justify-center border border-gray-300 hover:bg-gray-200"
                                        onClick={() => handleQuantityChange('decrease')}
                                        disabled={quantity <= 1}
                                    >
                                        <span className="text-xl">-</span>
                                    </button>
                                    <input
                                        type="number"
                                        className="w-16 h-10 border-t border-b border-gray-300 text-center font-medium text-gray-700"
                                        value={quantity}
                                        readOnly
                                    />
                                    <button
                                        className="w-10 h-10 rounded-r-lg bg-gray-100 flex items-center justify-center border border-gray-300 hover:bg-gray-200"
                                        onClick={() => handleQuantityChange('increase')}
                                    >
                                        <span className="text-xl">+</span>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Special Instructions */}
                            <div className="my-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Special Instructions</h3>
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yumrun-primary"
                                    placeholder="Any special requests for your order? (e.g., no onions, extra spicy, etc.)"
                                    rows="3"
                                    value={specialInstructions}
                                    onChange={(e) => setSpecialInstructions(e.target.value)}
                                ></textarea>
                            </div>

                            {/* Nutritional Information */}
                            <div className="my-6 p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Nutritional Information</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <span className="block text-lg font-semibold text-gray-900">{calculateNutritionalInfo().calories}</span>
                                        <span className="text-sm text-gray-600">Calories</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-lg font-semibold text-gray-900">{calculateNutritionalInfo().protein}g</span>
                                        <span className="text-sm text-gray-600">Protein</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-lg font-semibold text-gray-900">{calculateNutritionalInfo().carbs}g</span>
                                        <span className="text-sm text-gray-600">Carbs</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-lg font-semibold text-gray-900">{calculateNutritionalInfo().fat}g</span>
                                        <span className="text-sm text-gray-600">Fat</span>
                                    </div>
                                </div>
                                {calculateNutritionalInfo().allergens?.length > 0 && (
                                    <div className="mt-3">
                                        <span className="text-sm font-medium text-gray-600">Allergens: </span>
                                        <span className="text-sm text-gray-600">{calculateNutritionalInfo().allergens.join(', ')}</span>
                                    </div>
                                )}
                                {servingSize !== 'medium' && (
                                    <p className="mt-3 text-xs text-gray-500 italic">
                                        *Nutritional values adjusted for selected serving size
                                    </p>
                                )}
                                {selectedToppings.length > 0 && (
                                    <p className="mt-1 text-xs text-gray-500 italic">
                                        *Values include selected toppings
                                    </p>
                                )}
                            </div>
                            
                            {/* Total Price */}
                            <div className="my-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-medium text-gray-900">Total:</span>
                                    <span className="text-2xl font-bold text-yumrun-primary">
                                        ${calculateTotalPrice()}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <button
                                    onClick={addToCart}
                                    className="px-6 py-3 flex-1 bg-yumrun-primary text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-yumrun-primary-dark transition-colors"
                                >
                                    <FaUtensils /> Add to Order
                                </button>
                                <button 
                                    onClick={toggleFavorite}
                                    className={`px-6 py-3 flex-1 border-2 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${
                                        isFavorite 
                                            ? 'border-red-500 text-red-500 hover:bg-red-50' 
                                            : 'border-yumrun-primary text-yumrun-primary hover:bg-yumrun-primary hover:text-white'
                                    }`}
                                >
                                    {isFavorite ? (
                                        <>
                                            <FaHeart /> Saved to Favorites
                                        </>
                                    ) : (
                                        <>
                                            <FaRegHeart /> Save for Later
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rest of the component */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8">
                                <button
                                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'features'
                                        ? 'border-yumrun-primary text-yumrun-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                    onClick={() => setActiveTab('features')}
                                >
                                Features & Details
                                </button>
                                <button
                                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'reviews'
                                        ? 'border-yumrun-primary text-yumrun-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                    onClick={() => setActiveTab('reviews')}
                                >
                                Reviews ({totalReviews})
                                </button>
                        </nav>
                    </div>
                    
                    <div className="py-6">
                        {activeTab === 'features' ? (
                            <ProductFeatures product={product} />
                        ) : (
                            <div>
                                {reviewsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Spinner size="lg" />
                                    </div>
                                ) : reviewsError ? (
                                    <Alert variant="error">{reviewsError}</Alert>
                                ) : reviews.length > 0 ? (
                                    <div className="space-y-6">
                                        {reviews.map(review => (
                                            <div key={review.id} className="p-4 border rounded-lg">
                                                <div className="flex justify-between">
                                                    <div>
                                                        <div className="flex items-center mb-1">
                                                            <div className="flex text-sm mr-2">
                                                                {renderStarRating(review.rating)}
                                                            </div>
                                                            <span className="font-medium">{review.user.name}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(review.date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    {review.isVerified && (
                                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                            Verified Purchase
                                                        </span>
                                                    )}
                                                </div>
                                                {review.comment && (
                                                    <p className="mt-3 text-gray-700">{review.comment}</p>
                                                )}
                                                <div className="mt-3 text-sm text-gray-500">
                                                    <button className="text-yumrun-primary hover:underline">
                                                        Helpful ({review.helpful})
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {totalReviews > reviews.length && (
                                            <div className="text-center mt-6">
                                                <Button variant="outline">Load More Reviews</Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 mb-4">No reviews yet</p>
                                        <Button variant="brand">Be the first to review</Button>
                                    </div>
                                )}
                                
                                {isAuthenticated && (
                                    <div className="mt-8 border-t pt-8">
                                        <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
                                        <div className="mb-4">
                                            <p className="mb-2 text-sm text-gray-700">Rating</p>
                                            <div className="flex text-2xl">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        className={`mr-1 ${newReviewRating >= star ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                                                        title={`Rate ${star} out of 5`}
                                                        onClick={() => setNewReviewRating(star)}
                                                    >
                                                        <FaStar />
                                                    </button>
                                                ))}
                                            </div>
                                            {reviewError && reviewError.rating && (
                                                <p className="text-red-500 text-sm mt-1">{reviewError.rating}</p>
                                            )}
                                        </div>
                                        <div className="mb-4">
                                            <p className="mb-2 text-sm text-gray-700">Review (optional)</p>
                                            <textarea
                                                className="w-full p-3 border border-gray-300 rounded-lg"
                                                rows="4"
                                                placeholder="Share your experience with this item..."
                                                value={newReviewComment}
                                                onChange={(e) => setNewReviewComment(e.target.value)}
                                            ></textarea>
                                        </div>
                                        <div className="mb-4">
                                            <label className="text-sm text-gray-700">
                                                <p className="mb-2">Order ID (required)</p>
                                                <input
                                                    type="text"
                                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                                    placeholder="Enter your order ID"
                                                    value={newReviewOrderId}
                                                    onChange={(e) => setNewReviewOrderId(e.target.value)}
                                                />
                                                {reviewError && reviewError.orderId && (
                                                    <p className="text-red-500 text-sm mt-1">{reviewError.orderId}</p>
                                                )}
                                            </label>
                                        </div>
                                        {reviewSubmitError && (
                                            <Alert variant="error" className="mb-4">
                                                {reviewSubmitError}
                                            </Alert>
                                        )}
                                        {reviewSubmitSuccess && (
                                            <Alert variant="success" className="mb-4">
                                                Review submitted successfully!
                                            </Alert>
                                        )}
                                        <Button 
                                            variant="brand" 
                                            onClick={submitReview}
                                            disabled={reviewSubmitting}
                                        >
                                            {reviewSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
                                            Submit Review
                                        </Button>
                                        <p className="mt-2 text-xs text-gray-500">
                                            Note: You must have purchased this item to leave a review.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                    <RelatedProducts />
            </div>
        </div>
    );
};

export default ProductDetails;
