import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaStar, FaRegStar, FaStarHalfAlt, FaShoppingCart, FaPlus, FaMinus, FaArrowLeft } from 'react-icons/fa';
import ProductZoom from '../../components/ProductZoom';
import ProductFeatures from '../../components/ProductFeatures';
import RelatedProducts from './RelatedProducts';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Container, Button, Alert, Spinner, Badge, Separator, Tabs, TabsContent, TabsList, TabsTrigger, Card } from '../../components/ui';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { getFullImageUrl, PLACEHOLDERS } from '../../utils/imageUtils';

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
                    setError(response.data.message || 'Failed to fetch product details.');
                }
            } catch (err) {
                console.error('Error fetching product details:', err);
                setError(err.response?.data?.message || 'An error occurred while loading product data.');
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

    // UPDATED: Use discounted price if available and process image URL
    const handleAddToCartClick = () => {
        if (!product) return;
        
        const priceToAdd = product.discountedPrice !== undefined ? product.discountedPrice : product.price;
        const imageUrlForCart = product.image ? getFullImageUrl(product.image) : PLACEHOLDERS.FOOD;

        const cartItem = {
            id: product.id, // Use product.id which is already formatted
            name: product.name,
            price: priceToAdd, // Use discounted or original price
            image: imageUrlForCart, // Use processed image URL
            quantity: quantity,
            specialInstructions: specialInstructions.trim() || undefined,
            restaurantId: product.restaurant?.id,
            restaurantName: product.restaurant?.name || 'Restaurant'
        };
        
        addToCart(cartItem);
        console.log(`Added ${product.name} to cart at price ${priceToAdd}`);
        // Optional: Add toast notification
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
            console.log(`Toggling favorite: ${product?.name}`);
            const response = await axios({
                method: method,
                url: isFavorite ? `${url}/${productId}` : url,
                data: body
            });

            if (response.data.success) {
                setIsFavorite(!isFavorite);
                console.log(isFavorite ? 'Removed from favorites' : 'Added to favorites');
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
        
        if (newReviewRating === 0) {
            setReviewSubmitError('Please select a rating.');
            return;
        }

        setReviewSubmitting(true);
        setReviewSubmitError(null);
        setReviewSubmitSuccess(false);
        
        try {
            // No need to check orders, backend should handle this if necessary
            const response = await axios.post('/api/reviews', {
                menuItemId: productId,
                rating: newReviewRating,
                comment: newReviewComment,
                // orderId: orderId // Backend might associate automatically or not require it
            });
            
            if (response.data.success) {
                setNewReviewRating(0);
                setNewReviewComment('');
                setReviewSubmitSuccess(true);
                fetchReviews(); // Refresh reviews list
            } else {
                throw new Error(response.data.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            setReviewSubmitError(error.response?.data?.message || 'An error occurred while submitting your review.');
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
                        <FaStar key={`full-${i}`} className={`text-yellow-400 ${starClass}`} />
                    ) : i === fullStars && hasHalfStar ? (
                        <FaStarHalfAlt key={`half-${i}`} className={`text-yellow-400 ${starClass}`} />
                    ) : (
                        <FaRegStar key={`empty-${i}`} className={`text-yellow-400 ${starClass}`} />
                    )
                ))}
            </div>
        );
    };

    // --- Main Render ---
    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner size="large" /></div>;
    }

    if (error) {
        return <div className="container py-10"><Alert variant="destructive">Error loading product: {error}</Alert></div>;
    }

    // Safety check: If loading is done but product is still null, show an error.
    if (!product) {
        return <div className="container py-10"><Alert variant="warning">Product details could not be loaded or the product does not exist.</Alert></div>;
    }

    // Process image URL with fallback
    const imageUrl = product.image ? getFullImageUrl(product.image) : PLACEHOLDERS.FOOD;

    return (
        <div className="py-10 bg-gray-50">
            <Container>
                 {/* Back Button */}
                 <Button 
                    variant="outline" 
                    onClick={() => navigate(-1)} 
                    className="mb-6"
                 >
                    <FaArrowLeft className="mr-2" /> Back
                 </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Product Image Section */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        {/* Ensure ProductZoom gets the processed URL */}
                        <ProductZoom imageUrl={imageUrl} altText={product.name || 'Product Image'} />
                    </div>

                    {/* Product Details Section */}
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name || 'Product Name'}</h1>
                        {product.restaurant && product.restaurant.id && (
                            <Link 
                                to={`/restaurant/${product.restaurant.id}`}
                                className="text-sm text-yumrun-primary hover:underline mb-3"
                            >
                                From: {product.restaurant.name || 'Restaurant'}
                            </Link>
                        )}
                        
                        {/* Rating */}
                        <div className="flex items-center mb-4">
                            {renderRatingStars(averageRating, 'lg')}
                            <span className="ml-2 text-gray-600">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
                        </div>

                        {/* Price - UPDATED */}
                        <div className="mb-4">
                            {product.offerDetails ? (
                                <>
                                    <Badge variant="destructive" className="mb-1 text-sm">{product.offerDetails.percentage}% OFF</Badge>
                                    <div>
                                        <span className="text-xl text-gray-500 line-through mr-2">
                                            ${(product.originalPrice || product.price)?.toFixed(2) ?? 'N/A'} 
                                        </span>
                                        <span className="text-3xl font-bold text-yumrun-red">
                                            ${(product.discountedPrice)?.toFixed(2) ?? 'N/A'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Offer: {product.offerDetails.title}</p>
                                </> 
                            ) : (
                                <span className="text-3xl font-bold text-gray-900">
                                    ${product.price?.toFixed(2) ?? 'N/A'}
                                </span>
                            )}
                        </div>
                        
                        <p className="text-gray-600 mb-5 leading-relaxed">{product.description || 'No description available.'}</p>
                        
                        {/* Quantity Selector */}
                        <div className="flex items-center mb-5">
                            <span className="mr-4 font-semibold text-gray-700">Quantity:</span>
                            <div className="flex items-center border border-gray-300 rounded">
                                <Button 
                                    variant="ghost" 
                                    size="icon-sm" 
                                    onClick={() => handleQuantityChange('decrease')} 
                                    className="px-3 py-1 rounded-r-none"
                                    disabled={quantity <= 1}
                                >
                                    <FaMinus />
                                </Button>
                                <span className="px-4 py-1 text-center w-12 font-semibold">{quantity}</span>
                                <Button 
                                    variant="ghost" 
                                    size="icon-sm" 
                                    onClick={() => handleQuantityChange('increase')}
                                    className="px-3 py-1 rounded-l-none"
                                >
                                    <FaPlus />
                                </Button>
                            </div>
                        </div>

                        {/* Special Instructions */}
                        <div className="mb-5">
                            <label htmlFor="specialInstructions" className="block mb-1 font-semibold text-gray-700">Special Instructions:</label>
                            <textarea
                                id="specialInstructions"
                                rows="2"
                                value={specialInstructions}
                                onChange={(e) => setSpecialInstructions(e.target.value)}
                                placeholder="Any specific requests? (e.g., no onions, extra spicy)"
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yumrun-orange"
                            ></textarea>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-4 mt-auto">
                            <Button 
                                onClick={handleAddToCartClick} 
                                variant="primary" 
                                size="lg" 
                                className="flex-1"
                                disabled={!product} // Disable if product hasn't loaded
                            >
                                <FaShoppingCart className="mr-2" /> Add to Cart
                            </Button>
                            <Button 
                                variant="outline"
                                size="lg"
                                onClick={toggleFavorite}
                                disabled={favoriteLoading || !product} // Disable if product hasn't loaded
                                className="p-2 rounded-full hover:bg-red-100"
                                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                {favoriteLoading ? <Spinner size="sm" /> : isFavorite ? <FaHeart className="text-red-500" /> : <FaRegHeart className="text-gray-600" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Separator */}
                <Separator className="my-10" />
                
                 {/* Product Features / Ingredients / Allergens (Optional Component) */}
                 {/* Add null check for product before rendering features */} 
                 {product && <ProductFeatures product={product} />} 

                {/* Separator */}
                <Separator className="my-10" />

                {/* Reviews Section */}
                <div>
                    <h2 className="text-2xl font-semibold mb-6">Reviews & Ratings</h2>
                    <Tabs defaultValue="reviews" className="w-full">
                        <TabsList>
                            <TabsTrigger value="reviews">Customer Reviews ({totalReviews})</TabsTrigger>
                            {isAuthenticated && <TabsTrigger value="add-review">Add Your Review</TabsTrigger>}
                        </TabsList>
                        <TabsContent value="reviews" className="mt-4">
                            {reviewsLoading ? (
                                <Spinner />
                            ) : reviewsError ? (
                                <Alert variant="warning">{reviewsError}</Alert>
                            ) : reviews.length === 0 ? (
                                <p className="text-gray-600">No reviews yet for this product.</p>
                            ) : (
                                <div className="space-y-6">
                                    {reviews.map(review => (
                                        <Card key={review.id} className="p-4">
                                            <div className="flex items-center mb-2">
                                                {renderRatingStars(review.rating)}
                                                <span className="ml-auto text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-800 mb-1 font-medium">{review.user?.name || 'Anonymous'}</p>
                                            <p className="text-sm text-gray-600">{review.comment}</p>
                                        </Card>
                                    ))}
                                    {/* TODO: Add Pagination if many reviews */}
                                </div>
                            )}
                        </TabsContent>
                        {isAuthenticated && (
                            <TabsContent value="add-review" className="mt-4">
                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>
                                    {reviewSubmitSuccess && <Alert variant="success" className="mb-4">Review submitted successfully!</Alert>}
                                    {reviewSubmitError && <Alert variant="destructive" className="mb-4">{reviewSubmitError}</Alert>}
                                    <div className="mb-4">
                                        <label className="block mb-2 font-medium">Your Rating:</label>
                                        <div className="flex space-x-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button 
                                                    key={star} 
                                                    onClick={() => setNewReviewRating(star)}
                                                    aria-label={`Rate ${star} stars`}
                                                >
                                                    {star <= newReviewRating ? 
                                                        <FaStar className="w-6 h-6 text-yellow-400" /> : 
                                                        <FaRegStar className="w-6 h-6 text-yellow-400" />
                                                    }
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="reviewComment" className="block mb-2 font-medium">Your Comment:</label>
                                        <textarea
                                            id="reviewComment"
                                            rows="4"
                                            value={newReviewComment}
                                            onChange={(e) => setNewReviewComment(e.target.value)}
                                            placeholder="Share your thoughts about this product..."
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yumrun-orange"
                                        ></textarea>
                                    </div>
                                    <Button onClick={submitReview} disabled={reviewSubmitting || newReviewRating === 0}>
                                        {reviewSubmitting ? <Spinner size="sm" /> : 'Submit Review'}
                                    </Button>
                                </Card>
                            </TabsContent>
                        )}
                    </Tabs>
                </div>

                {/* Related Products */}
                <Separator className="my-10" />
                 {/* Add null check for product before rendering related products */}
                {product && <RelatedProducts currentProductId={productId} />} 

            </Container>
        </div>
    );
};

export default ProductDetails;
