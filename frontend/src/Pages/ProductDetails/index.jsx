import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaStar, FaRegStar, FaStarHalfAlt, FaAllergies, FaInfoCircle, FaCommentDots, FaShoppingCart, FaPlus, FaMinus, FaArrowLeft } from 'react-icons/fa';
import ProductZoom from '../../components/ProductZoom';
import ProductFeatures from '../../components/ProductFeatures';
import RelatedProducts from './RelatedProducts';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Button, Alert, Spinner, Badge, Separator, Tabs, TabsContent, TabsList, TabsTrigger, Card } from '../../components/ui';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ProductDetails = () => {
    const { id: productId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [specialInstructions, setSpecialInstructions] = useState('');
    
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState(null);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [newReviewRating, setNewReviewRating] = useState(0);
    const [newReviewComment, setNewReviewComment] = useState('');
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

    // --- Fetch Reviews ---
    const fetchReviews = useCallback(async () => {
        if (!productId) return;
        setReviewsLoading(true);
        setReviewsError(null);
        try {
            const response = await axios.get(`/api/reviews/menuItem/${productId}`);
            if (response.data.success) {
                setReviews(response.data.data.reviews || []);
                setAverageRating(response.data.data.meta?.averageRating || 0);
                setTotalReviews(response.data.data.meta?.total || 0);
            } else {
                setReviewsError(response.data.error?.message || 'Failed to load reviews.');
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setReviewsError(err.response?.data?.error?.message || 'Could not fetch reviews.');
        } finally {
            setReviewsLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    // --- Favorite Status Check ---
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (!isAuthenticated || !productId) return;
            try {
                const response = await axios.get(`/api/favorites/check/${productId}`);
                if (response.data.success) {
                    setIsFavorite(response.data.data.isFavorite);
                }
            } catch (error) {
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

    const handleAddToCartClick = () => {
        if (!product) return;
        
        // Create cart item with all necessary details
        const cartItem = {
            id: product._id || product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity,
            specialInstructions: specialInstructions.trim() || undefined,
            restaurantId: product.restaurant?._id || product.restaurantId,
            restaurantName: product.restaurant?.name || 'Restaurant'
        };
        
        addToCart(cartItem);
        
        // Optional: Add toast notification
    };

    const handleOrderNowClick = () => {
        handleAddToCartClick();
        navigate('/cart');
    };

    // Function to toggle favorite status
    const toggleFavorite = async () => {
        if (!isAuthenticated) {
            navigate('/signin', { state: { from: `/product/${productId}` } });
            return;
        }
        
        setFavoriteLoading(true);
        const url = `/api/favorites`;
        const method = isFavorite ? 'DELETE' : 'POST';
        const body = { menuItemId: productId };

        try {
            const response = await axios({
                method: method,
                url: isFavorite ? `${url}/${productId}` : url,
                data: body
            });

            if (response.data.success) {
                setIsFavorite(!isFavorite);
            }
        } catch (error) {
            console.error('Error toggling favorite status:', error);
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
            <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[60vh]">
                <Spinner size="xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container px-4 py-8 mx-auto">
                <Alert variant="error">Error loading product: {error}</Alert>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container px-4 py-8 mx-auto">
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
        <div className="min-h-screen py-8 bg-gray-50">
            <div className="container px-4 mx-auto">
                {/* Back button and Breadcrumbs */}
                <div className="mb-6">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="inline-flex items-center text-sm text-gray-600 transition-colors hover:text-gray-900"
                    >
                        <FaArrowLeft className="mr-2" /> Back
                    </button>
                    {product.restaurant && (
                        <div className="mt-2 text-sm text-gray-500">
                            <Link to="/" className="hover:underline">Home</Link>
                            <span className="mx-2">›</span>
                            <Link to={`/restaurant/${product.restaurant._id || product.restaurantId}`} className="hover:underline">
                                {product.restaurant.name}
                            </Link>
                            <span className="mx-2">›</span>
                            <span>{product.name}</span>
                        </div>
                    )}
                </div>

                {/* Product Overview Section */}
                <Card className="mb-8 overflow-hidden">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Image Gallery */}
                        <div className="p-4 md:p-8">
                            <ProductZoom images={product.image ? [product.image] : []} />
                        </div>
                        
                        {/* Product Details & Actions */}
                        <div className="p-4 space-y-6 md:p-8">
                            {/* Status Badge */}
                            {product.isAvailable === false && (
                                <Badge variant="destructive" className="mb-2">
                                    Currently Unavailable
                                </Badge>
                            )}
                            
                            {/* Name, Category, Rating, Favorite */}
                            <div>
                                <div className="flex items-start justify-between mb-2">
                                    <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">{product.name}</h1>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={toggleFavorite}
                                        disabled={favoriteLoading || !isAuthenticated}
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
                                            <FaHeart className="w-6 h-6" />
                                        ) : (
                                            <FaRegHeart className="w-6 h-6" />
                                        )}
                                    </Button>
                                </div>
                                <p className="mb-3 text-sm text-gray-500">
                                    {product.category?.name && `Category: ${product.category.name}`}
                                    {product.restaurant?.name && ` | Restaurant: ${product.restaurant.name}`}
                                </p>
                                <div className="flex items-center gap-2 mb-4">
                                    {renderRatingStars(averageRating)}
                                    <span className="text-sm text-gray-600">({totalReviews || 0} reviews)</span>
                                </div>
                            </div>

                            <Separator />

                            {/* Price Section */}
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-bold text-primary">Rs.{displayPrice.toFixed(2)}</span>
                                {product.discount > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg text-gray-500 line-through">Rs.{product.price.toFixed(2)}</span>
                                        <Badge variant="secondary" className="text-green-700 bg-green-100">
                                            {product.discount}% OFF
                                        </Badge>
                                    </div>
                                )}
                            </div>
                                
                            {/* Description */}
                            <div>
                                <h3 className="mb-1 text-lg font-semibold text-gray-700">Description</h3>
                                <p className="leading-relaxed text-gray-600">{product.description || 'No description available.'}</p>
                            </div>
                            
                            <Separator />
                                
                            {/* Quantity Selector */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <span className="font-medium text-gray-700">Quantity:</span>
                                    <div className="flex items-center border rounded-md">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="w-8 h-8" 
                                            onClick={() => handleQuantityChange('decrease')} 
                                            disabled={quantity <= 1}
                                        >
                                            <FaMinus className="w-3 h-3"/>
                                        </Button>
                                        <span className="w-8 font-medium text-center">{quantity}</span>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="w-8 h-8" 
                                            onClick={() => handleQuantityChange('increase')}
                                        >
                                            <FaPlus className="w-3 h-3"/>
                                        </Button>
                                    </div>
                                </div>
                                
                                {/* Special Instructions */}
                                <div>
                                    <label htmlFor="specialInstructions" className="block mb-1 text-sm font-medium text-gray-700">
                                        Special Instructions (Optional)
                                    </label>
                                    <textarea
                                        id="specialInstructions"
                                        rows={2}
                                        className="w-full p-2 text-sm border rounded-md" 
                                        placeholder="Any special requests or preferences?"
                                        value={specialInstructions}
                                        onChange={(e) => setSpecialInstructions(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="flex-1 gap-2"
                                    onClick={handleAddToCartClick}
                                    disabled={product.isAvailable === false}
                                >
                                    <FaShoppingCart className="w-5 h-5" />
                                    Add to Cart
                                </Button>
                                <Button
                                    size="lg"
                                    className="flex-1 gap-2"
                                    onClick={handleOrderNowClick}
                                    disabled={product.isAvailable === false}
                                >
                                    Order Now
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Tabs for Features, Nutrition, Reviews */}
                <Card className="mb-8">
                    <Tabs defaultValue="features" className="w-full p-4">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="features"><FaInfoCircle className="mr-2"/> Details</TabsTrigger>
                            <TabsTrigger value="nutrition"><FaAllergies className="mr-2"/> Nutrition & Allergens</TabsTrigger>
                            <TabsTrigger value="reviews"><FaCommentDots className="mr-2"/> Reviews ({totalReviews || 0})</TabsTrigger>
                        </TabsList>
                        
                        {/* Features/Details Tab */}
                        <TabsContent value="features">
                            <ProductFeatures product={product} />
                        </TabsContent>

                        {/* Nutrition & Allergens Tab */}
                        <TabsContent value="nutrition">
                            <div className="p-6 bg-white rounded-lg">
                                <h3 className="mb-4 text-xl font-semibold text-gray-800">Nutritional Information</h3>
                                {product.nutritionalInfo ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm md:grid-cols-3">
                                            {product.nutritionalInfo.calories !== undefined && (
                                                <div className="p-4 rounded-lg bg-gray-50">
                                                    <p className="text-sm text-gray-500">Calories</p>
                                                    <p className="text-xl font-bold text-gray-900">{product.nutritionalInfo.calories}</p>
                                                    <p className="text-xs text-gray-500">kcal</p>
                                                </div>
                                            )}
                                            {product.nutritionalInfo.fat !== undefined && (
                                                <div className="p-4 rounded-lg bg-gray-50">
                                                    <p className="text-sm text-gray-500">Fat</p>
                                                    <p className="text-xl font-bold text-gray-900">{product.nutritionalInfo.fat}g</p>
                                                    <p className="text-xs text-gray-500">Total</p>
                                                </div>
                                            )}
                                            {product.nutritionalInfo.carbs !== undefined && (
                                                <div className="p-4 rounded-lg bg-gray-50">
                                                    <p className="text-sm text-gray-500">Carbs</p>
                                                    <p className="text-xl font-bold text-gray-900">{product.nutritionalInfo.carbs}g</p>
                                                    <p className="text-xs text-gray-500">Total</p>
                                                </div>
                                            )}
                                            {product.nutritionalInfo.protein !== undefined && (
                                                <div className="p-4 rounded-lg bg-gray-50">
                                                    <p className="text-sm text-gray-500">Protein</p>
                                                    <p className="text-xl font-bold text-gray-900">{product.nutritionalInfo.protein}g</p>
                                                </div>
                                            )}
                                            {product.nutritionalInfo.sodium !== undefined && (
                                                <div className="p-4 rounded-lg bg-gray-50">
                                                    <p className="text-sm text-gray-500">Sodium</p>
                                                    <p className="text-xl font-bold text-gray-900">{product.nutritionalInfo.sodium}mg</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Allergens Section */}
                                        {product.nutritionalInfo.allergens && product.nutritionalInfo.allergens.length > 0 && (
                                            <div className="mt-6">
                                                <h3 className="mb-2 text-lg font-semibold text-gray-800">Allergens</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {product.nutritionalInfo.allergens.map((allergen, index) => (
                                                        <Badge key={index} variant="outline" className="text-yellow-800 border-yellow-200 bg-yellow-50">
                                                            {allergen}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="mb-6 text-gray-500">Nutritional information not available for this product.</p>
                                )}
                            </div>
                        </TabsContent>

                        {/* Reviews Tab */}
                        <TabsContent value="reviews">
                            <div className="p-6 bg-white rounded-lg">
                                <h3 className="mb-4 text-xl font-semibold text-gray-800">Customer Reviews</h3>
                                {/* Average Rating Display */}
                                <div className="flex items-center gap-4 pb-6 mb-6 border-b">
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
                                    <div className="mb-8 space-y-6">
                                        {reviews.map(review => (
                                            <div key={review._id || review.id} className="pb-4 border-b last:border-b-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        {renderRatingStars(review.rating, 'sm')}
                                                        <span className="font-medium text-gray-800">{review.user?.fullName || 'Anonymous'}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(review.createdAt || review.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">{review.comment || 'No comment provided.'}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mb-8 text-center text-gray-500">No reviews yet. Be the first to share your thoughts!</p>
                                )}
                                
                                {/* Write a Review Section */}
                                {isAuthenticated ? (
                                    <div className="pt-6 border-t">
                                        <h4 className="mb-3 text-lg font-semibold text-gray-800">Write Your Review</h4>
                                        {reviewSubmitSuccess && (
                                            <Alert variant="success" className="mb-4">Review submitted successfully!</Alert>
                                        )}
                                        {reviewSubmitError && (
                                            <Alert variant="error" className="mb-4">Error: {reviewSubmitError}</Alert>
                                        )}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block mb-1 text-sm font-medium text-gray-700">Your Rating *</label>
                                                <div className="flex space-x-1">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <button
                                                            key={star}
                                                            onClick={() => setNewReviewRating(star)}
                                                            className="focus:outline-none"
                                                            type="button"
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
                                                <label htmlFor="comment" className="block mb-1 text-sm font-medium text-gray-700">Your Comment</label>
                                                <textarea
                                                    id="comment"
                                                    rows={3}
                                                    value={newReviewComment}
                                                    onChange={(e) => setNewReviewComment(e.target.value)}
                                                    className="w-full p-2 text-sm border rounded-md"
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
                                    <div className="py-6 text-center border-t">
                                        <p className="mb-2 text-gray-600">Want to share your experience?</p>
                                        <Button variant="outline" onClick={() => navigate('/signin', { state: { from: `/product/${productId}` } })}>
                                            Sign in to leave a review
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </Card>

                {/* Related Products Section */}
                <RelatedProducts currentProductId={productId} />
            </div>
        </div>
    );
};

export default ProductDetails;
