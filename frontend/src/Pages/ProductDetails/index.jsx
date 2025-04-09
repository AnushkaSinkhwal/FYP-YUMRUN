import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaStar, FaRegStar, FaStarHalfAlt, FaAllergies, FaInfoCircle, FaCommentDots, FaShoppingCart, FaPlus, FaMinus } from 'react-icons/fa';
import ProductZoom from '../../components/ProductZoom';
import ProductFeatures from '../../components/ProductFeatures';
import RelatedProducts from './RelatedProducts';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Button, Alert, Spinner, Badge, Separator, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui';
import axios from 'axios';

const ProductDetails = () => {
    const { id: productId } = useParams(); // Renamed for clarity
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // const [servingSize, setServingSize] = useState('medium'); // Will use base product size for now
    const [quantity, setQuantity] = useState(1);
    // const [activeTab, setActiveTab] = useState('features'); // Using shadcn Tabs
    // const [specialInstructions, setSpecialInstructions] = useState('');
    // const [selectedToppings, setSelectedToppings] = useState([]); // Placeholder
    // const [removedIngredients, setRemovedIngredients] = useState([]); // Placeholder
    
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState(null);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [newReviewRating, setNewReviewRating] = useState(0);
    const [newReviewComment, setNewReviewComment] = useState('');
    // const [newReviewOrderId, setNewReviewOrderId] = useState(''); // Keep state if needed later
    const [reviewSubmitError, setReviewSubmitError] = useState(null);
    const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState(false);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    // --- Fetch Product Data ---
    useEffect(() => {
        const fetchProductData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`/api/menu/${productId}`);
                if (response.data.success) {
                    setProduct(response.data.data);
                    // Initialize based on fetched product if needed
                } else {
                    setError(response.data.error?.message || 'Failed to fetch product details.');
                }
            } catch (err) {
                console.error('Error fetching product details:', err);
                setError(err.response?.data?.error?.message || 'An error occurred while loading product data.');
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchProductData();
        }
    }, [productId]);
    // Remove mock data timeout
    // useEffect(() => {
    //     // Simulate API call with setTimeout
    //     setTimeout(() => {
    //         // Mock product data
    //         const mockProduct = {
    //             id: productId,
    //             name: "Classic Margherita Pizza",
    //             category: "Italian",
    //             rating: 4.5,
    //             ratingCount: 128,
    //             price: 12.99,
    //             description: "Our authentic Margherita pizza features a thin, crispy crust topped with fresh tomato sauce, mozzarella cheese, and basil leaves. Made with the finest ingredients and baked to perfection.",
    //             availability: true,
    //             discount: 10,
    //             features: [
    //                 "Fresh ingredients sourced locally",
    //                 "Made-to-order for maximum freshness",
    //                 "No artificial preservatives",
    //                 "Gluten-free options available",
    //                 "Customizable toppings and ingredients"
    //             ],
    //             nutritionalInfo: {
    //                 calories: 285,
    //                 fat: 10.5,
    //                 carbs: 34,
    //                 protein: 15,
    //                 sodium: 520,
    //                 allergens: ["Wheat", "Dairy"]
    //             },
    //             servingSizes: [
    //                 { id: 'small', name: 'Small (8")', priceMultiplier: 0.8 },
    //                 { id: 'medium', name: 'Medium (12")', priceMultiplier: 1 },
    //                 { id: 'large', name: 'Large (16")', priceMultiplier: 1.2 },
    //             ],
    //             availableToppings: [
    //                 { id: 'pepperoni', name: 'Pepperoni', price: 1.50 },
    //                 { id: 'mushrooms', name: 'Mushrooms', price: 1.00 },
    //                 { id: 'olives', name: 'Black Olives', price: 0.75 },
    //                 { id: 'onions', name: 'Red Onions', price: 0.50 },
    //                 { id: 'bellPeppers', name: 'Bell Peppers', price: 0.75 },
    //                 { id: 'extraCheese', name: 'Extra Cheese', price: 1.50 },
    //                 { id: 'bacon', name: 'Bacon', price: 1.75 },
    //                 { id: 'pineapple', name: 'Pineapple', price: 0.75 }
    //             ],
    //             baseIngredients: [
    //                 { id: 'sauce', name: 'Tomato Sauce' },
    //                 { id: 'cheese', name: 'Mozzarella Cheese' },
    //                 { id: 'basil', name: 'Fresh Basil' },
    //                 { id: 'oliveOil', name: 'Olive Oil' }
    //             ],
    //             image: "/placeholder-pizza.jpg" // Added placeholder image
    //         };
            
    //         setProduct(mockProduct);
    //         // Initialize selected ingredients with all base ingredients
    //         // setSelectedIngredients(mockProduct.baseIngredients.map(ing => ing.id));
    //         setLoading(false);
    //     }, 500);
    // }, [productId]);

    // --- Fetch Reviews (moved function definition out) ---
    const fetchReviews = useCallback(async () => { // Use useCallback
        if (!productId) return;
        setReviewsLoading(true);
        setReviewsError(null);
        try {
            const response = await axios.get(`/api/reviews/menuItem/${productId}`);
            if (response.data.success) {
                setReviews(response.data.data.reviews);
                setAverageRating(response.data.data.meta.averageRating || 0);
                setTotalReviews(response.data.data.meta.total || 0);
            } else {
                setReviewsError(response.data.error?.message || 'Failed to load reviews.');
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setReviewsError(err.response?.data?.error?.message || 'Could not fetch reviews.');
        } finally {
            setReviewsLoading(false);
        }
    }, [productId]); // Add productId as dependency

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]); // Call fetchReviews when it changes (due to productId change)

    // --- Favorite Status Check ---
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (!isAuthenticated || !productId) return;
            try {
                // Assuming check endpoint exists as `/api/favorites/check/:menuItemId`
                const response = await axios.get(`/api/favorites/check/${productId}`);
                if (response.data.success) {
                    setIsFavorite(response.data.data.isFavorite);
                } else {
                    console.warn('Could not check favorite status:', response.data.error?.message);
                }
            } catch (error) {
                // Don't show error to user, just log it
                console.error('Error checking favorite status:', error);
            }
        };
        checkFavoriteStatus();
    }, [isAuthenticated, productId]);

    // --- Handlers ---
    const handleQuantityChange = (action) => {
        if (action === 'decrease' && quantity > 1) {
            setQuantity(quantity - 1);
        } else if (action === 'increase') {
            setQuantity(quantity + 1);
        }
    };

    // const handleServingSizeChange = (size) => {
    //     setServingSize(size);
    // };

    const handleAddToCartClick = () => {
        if (!product) return;
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price, // TODO: Add logic for size/topping price adjustments
            image: product.image,
            rating: averageRating || 0,
            restaurant: product.restaurant?.name || ''
        }, quantity);
        // TODO: Add toast notification
        console.log(`Added ${quantity} ${product.name} to cart`);
    };

    const handleOrderNowClick = () => {
        handleAddToCartClick();
        navigate('/cart');
    };

    // Handle topping selection
    // const handleToppingToggle = (toppingId) => {
    //     setSelectedToppings(prevToppings => {
    //         if (prevToppings.includes(toppingId)) {
    //             return prevToppings.filter(id => id !== toppingId);
    //         } else {
    //             return [...prevToppings, toppingId];
    //         }
    //     });
    // };

    // Handle ingredient toggling
    // const handleIngredientToggle = (ingredientId) => {
    //     setSelectedIngredients(prevIngredients => {
    //         if (prevIngredients.includes(ingredientId)) {
    //             return prevIngredients.filter(id => id !== ingredientId);
    //         } else {
    //             return [...prevIngredients, ingredientId];
    //         }
    //     });
    // };

    // Handle ingredient removal
    // const handleRemoveIngredientToggle = (ingredientId) => {
    //     setRemovedIngredients(prevRemoved => {
    //         if (prevRemoved.includes(ingredientId)) {
    //             return prevRemoved.filter(id => id !== ingredientId);
    //         } else {
    //             return [...prevRemoved, ingredientId];
    //         }
    //     });
    // };

    // Function to toggle favorite status
    const toggleFavorite = async () => {
        if (!isAuthenticated) {
            navigate('/signin', { state: { from: `/product/${productId}` } });
            return;
        }
        
        setFavoriteLoading(true);
        const url = `/api/favorites`;
        const method = isFavorite ? 'DELETE' : 'POST';
        const body = isFavorite ? { menuItemId: productId } : { menuItemId: productId }; // Backend might need ID in body for DELETE too

        try {
            const response = await axios({
                method: method,
                url: isFavorite ? `${url}/${productId}` : url, // Adjust URL based on method if needed
                data: body
            });

            if (response.data.success) {
                setIsFavorite(!isFavorite);
            } else {
                console.error('Failed to update favorite status:', response.data.error?.message);
                // TODO: Show error toast
            }
        } catch (error) {
            console.error('Error toggling favorite status:', error);
            // TODO: Show error toast
        } finally {
            setFavoriteLoading(false);
        }
    };

    // Function to submit a review
    const submitReview = async () => {
        if (!isAuthenticated) {
            navigate('/signin', { state: { from: `/product/${productId}` } });
            return;
        }
        
        // Basic validation
        if (newReviewRating === 0) {
            setReviewSubmitError('Please select a rating.');
            return;
        }
        // TODO: Need a way to get order ID. Temporarily disabling this check or allowing submit without it.
        // if (!newReviewOrderId) {
        //     setReviewSubmitError('Order ID is required to leave a review.');
        //     return;
        // }
        
        setReviewSubmitting(true);
        setReviewSubmitError(null);
        setReviewSubmitSuccess(false);
        
        try {
            const response = await axios.post('/api/reviews', {
                menuItemId: productId,
                    rating: newReviewRating,
                    comment: newReviewComment,
            });
            
            if (response.data.success) {
                setNewReviewRating(0);
                setNewReviewComment('');
                // setNewReviewOrderId(''); // Commented out as state setter is not used
                setReviewSubmitSuccess(true);
                fetchReviews(); // Refresh reviews list
            } else {
                throw new Error(response.data.error?.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            setReviewSubmitError(error.response?.data?.error?.message || 'An error occurred.');
        } finally {
            setReviewSubmitting(false);
        }
    };

    // --- Render Helpers ---
    const renderRatingStars = (rating, size = 'md') => {
        const starClasses = {
            sm: 'w-3 h-3',
            md: 'w-4 h-4',
            lg: 'w-5 h-5'
        };
        const starClass = starClasses[size] || starClasses.md;
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    i < fullStars ? (
                        <FaStar key={i} className={`text-yellow-400 ${starClass}`} />
                    ) : i === fullStars && hasHalfStar ? (
                        <FaStarHalfAlt key={i} className={`text-yellow-400 ${starClass}`} />
                    ) : (
                        <FaRegStar key={i} className={`text-yellow-400 ${starClass}`} />
                    )
                ))}
            </div>
        );
    };

    // --- Loading and Error States ---
    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
                <Spinner size="xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="error">Error loading product: {error}</Alert>
                </div>
        );
    }

    if (!product) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="warning">Product not found.</Alert>
            </div>
        );
    }

    // Calculate display price based on potential discounts
    const displayPrice = product.discount > 0 
        ? product.price * (1 - product.discount / 100) 
        : product.price;

    // --- Main Render ---
    return (
        <div className="bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Product Overview Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Image Gallery */}
                    <div>
                        <ProductZoom images={product.image ? [product.image] : []} />
                        </div>
                    
                    {/* Product Details & Actions */}
                    <div className="space-y-6">
                        {/* Name, Category, Rating, Favorite */}
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={toggleFavorite}
                                    disabled={favoriteLoading}
                                    className={`rounded-full transition-colors ${
                                        isFavorite 
                                            ? 'text-red-500 hover:bg-red-50' 
                                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                    }`}
                                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    {favoriteLoading ? (
                                        <Spinner size="sm" />
                                    ) : isFavorite ? (
                                        <FaHeart className="h-6 w-6" />
                                    ) : (
                                        <FaRegHeart className="h-6 w-6" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-sm text-gray-500 mb-3">
                                Category: {product.category?.name || 'Uncategorized'}
                                {product.restaurant?.name && ` | Restaurant: ${product.restaurant.name}`}
                            </p>
                            <div className="flex items-center gap-2 mb-4">
                                {renderRatingStars(averageRating)}
                                <span className="text-sm text-gray-600">({totalReviews} reviews)</span>
                            </div>
                            {!product.isAvailable && (
                                <Badge variant="destructive" className="mb-4">
                                    Currently Unavailable
                                </Badge>
                            )}
                            </div>

                        <Separator />

                        {/* Price Section */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-primary">Rs.{displayPrice.toFixed(2)}</span>
                            {product.discount > 0 && product.oldPrice && (
                                <span className="text-lg text-gray-500 line-through">Rs.{product.oldPrice.toFixed(2)}</span>
                            )}
                            {product.discount > 0 && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    {product.discount}% OFF
                                </Badge>
                            )}
                            </div>
                            
                        {/* Description */}
                        <div>
                            <h3 className="text-lg font-semibold mb-1 text-gray-700">Description</h3>
                            <p className="text-gray-600 leading-relaxed">{product.description || 'No description available.'}</p>
                            </div>
                        
                        <Separator />
                            
                            {/* Quantity Selector */}
                        <div className="flex items-center gap-4">
                            <span className="font-medium text-gray-700">Quantity:</span>
                            <div className="flex items-center border rounded-md">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange('decrease')} disabled={quantity <= 1}>
                                    <FaMinus className="h-3 w-3"/>
                                </Button>
                                <span className="w-10 text-center font-medium">{quantity}</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange('increase')}>
                                    <FaPlus className="h-3 w-3"/>
                                </Button>
                                </div>
                            </div>
                            
                        {/* Special Instructions (Optional) */}
                        {/* Consider adding if applicable */}
                        {/* <div>
                            <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                                <textarea
                                id="specialInstructions"
                                rows={2}
                                className="w-full border rounded-md p-2 text-sm" 
                                placeholder="e.g., Extra spicy, no onions"
                                    value={specialInstructions}
                                    onChange={(e) => setSpecialInstructions(e.target.value)}
                            />
                        </div> */} 
                            
                            {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button
                                size="lg"
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={handleAddToCartClick}
                                disabled={!product.isAvailable}
                                >
                                <FaShoppingCart className="h-5 w-5" />
                                Add to Cart
                            </Button>
                            <Button
                                size="lg"
                                className="flex-1 gap-2"
                                onClick={handleOrderNowClick}
                                disabled={!product.isAvailable}
                                >
                                Order Now
                            </Button>
                        </div>

                    </div>
                </div>

                {/* Tabs for Features, Nutrition, Reviews */}
                <Tabs defaultValue="features" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="features"><FaInfoCircle className="mr-2"/> Details</TabsTrigger>
                        <TabsTrigger value="nutrition"><FaAllergies className="mr-2"/> Nutrition & Allergens</TabsTrigger>
                        <TabsTrigger value="reviews"><FaCommentDots className="mr-2"/> Reviews ({totalReviews})</TabsTrigger>
                    </TabsList>
                    
                    {/* Features/Details Tab */}
                    <TabsContent value="features">
                            <ProductFeatures product={product} />
                    </TabsContent>

                    {/* Nutrition & Allergens Tab */}
                    <TabsContent value="nutrition">
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">Nutritional Information</h3>
                            {product.nutritionalInfo ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-6">
                                    <p><strong>Calories:</strong> {product.nutritionalInfo.calories || 'N/A'}</p>
                                    <p><strong>Fat:</strong> {product.nutritionalInfo.fat || 'N/A'}g</p>
                                    <p><strong>Carbs:</strong> {product.nutritionalInfo.carbs || 'N/A'}g</p>
                                    <p><strong>Protein:</strong> {product.nutritionalInfo.protein || 'N/A'}g</p>
                                    <p><strong>Sodium:</strong> {product.nutritionalInfo.sodium || 'N/A'}mg</p>
                                </div>
                            ) : (
                                <p className="text-gray-500 mb-6">Nutritional information not available.</p>
                            )}

                            <h3 className="text-xl font-semibold mb-2 text-gray-800">Allergens</h3>
                            {product.allergens && product.allergens.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {product.allergens.map((allergen, index) => (
                                        <Badge key={index} variant="warning">{allergen}</Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">No allergen information provided.</p>
                            )}
                        </div>
                    </TabsContent>

                    {/* Reviews Tab */}
                    <TabsContent value="reviews">
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">Customer Reviews</h3>
                            {/* Average Rating Display */}
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                                <div className="text-4xl font-bold text-gray-800">{averageRating.toFixed(1)}</div>
                                <div className="flex flex-col">
                                    {renderRatingStars(averageRating, 'lg')}
                                    <span className="text-sm text-gray-500">Based on {totalReviews} reviews</span>
                                </div>
                            </div>

                            {/* Existing Reviews List */}
                                {reviewsLoading ? (
                                <div className="flex justify-center py-8"><Spinner size="lg" /></div>
                                ) : reviewsError ? (
                                    <Alert variant="error">{reviewsError}</Alert>
                                ) : reviews.length > 0 ? (
                                <div className="space-y-6 mb-8">
                                        {reviews.map(review => (
                                        <div key={review.id} className="pb-4 border-b last:border-b-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    {renderRatingStars(review.rating, 'sm')}
                                                    <span className="font-medium text-gray-800">{review.user?.name || 'Anonymous'}</span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(review.date).toLocaleDateString()}
                                                </span>
                                                </div>
                                            <p className="text-gray-600 text-sm">{review.comment || 'No comment provided.'}</p>
                                            {/* Add helpful votes, verified purchase etc. if available */}
                                            </div>
                                        ))}
                                    {/* TODO: Add Pagination if many reviews */}
                                    </div>
                                ) : (
                                <p className="text-gray-500 mb-8 text-center">No reviews yet. Be the first to share your thoughts!</p>
                                )}
                                
                            {/* Write a Review Section */}
                            {isAuthenticated ? (
                                <div className="pt-6 border-t">
                                    <h4 className="text-lg font-semibold mb-3 text-gray-800">Write Your Review</h4>
                                    {reviewSubmitSuccess && (
                                        <Alert variant="success" className="mb-4">Review submitted successfully!</Alert>
                                    )}
                                    {reviewSubmitError && (
                                        <Alert variant="error" className="mb-4">Error: {reviewSubmitError}</Alert>
                                    )}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Rating *</label>
                                            <div className="flex space-x-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        onClick={() => setNewReviewRating(star)}
                                                        className="focus:outline-none"
                                                    >
                                                        {star <= newReviewRating ? (
                                                            <FaStar className="w-6 h-6 text-yellow-400" />
                                                        ) : (
                                                            <FaRegStar className="w-6 h-6 text-yellow-400" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Your Comment</label>
                                            <textarea
                                                id="comment"
                                                rows={3}
                                                value={newReviewComment}
                                                onChange={(e) => setNewReviewComment(e.target.value)}
                                                className="w-full border rounded-md p-2 text-sm"
                                                placeholder="Share your experience..."
                                            />
                                        </div>
                                        <Button 
                                            variant="brand" 
                                            onClick={submitReview}
                                            disabled={reviewSubmitting}
                                        >
                                            {reviewSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
                                            Submit Review
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 border-t">
                                    <p className="text-gray-600 mb-2">Want to share your experience?</p>
                                    <Button variant="outline" onClick={() => navigate('/signin', { state: { from: `/product/${productId}` } })}>Sign in to leave a review</Button>
                            </div>
                        )}
                    </div>
                    </TabsContent>
                </Tabs>

                {/* Related Products Section */}
                <RelatedProducts currentProductId={productId} />
            </div>
        </div>
    );
};

export default ProductDetails;
