import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaStar, FaRegStar, FaStarHalfAlt, FaShoppingCart, FaPlus, FaMinus, FaArrowLeft, FaTag } from 'react-icons/fa';
import ProductZoom from '../../components/ProductZoom';
import ProductFeatures from '../../components/ProductFeatures';
import RelatedProducts from './RelatedProducts';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Container, Button, Alert, Spinner, Separator, Tabs, TabsContent, TabsList, TabsTrigger, Card } from '../../components/ui';
import api, { reviewAPI } from '../../utils/api';
import { Link } from 'react-router-dom';
import { getBestImageUrl } from '../../utils/imageUtils';
import IngredientCustomizer from '../../components/MenuItemCustomization/IngredientCustomizer';

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
    const [restaurantOffers, setRestaurantOffers] = useState([]);

    // --- Fetch Product Data ---
    useEffect(() => {
        const fetchProductData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/menu/${productId}`);
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

    // Fetch public restaurant offers for display
    useEffect(() => {
        if (!product || !product.restaurant?.id) return;
        console.log(`[ProductDetails] Fetching offers for restaurant ID: ${product.restaurant.id}`);
        const fetchOffers = async () => {
            try {
                const res = await api.get(`/offers/public/restaurant/${product.restaurant.id}`);
                console.log('[ProductDetails] Offers endpoint response:', res);
                if (res.data.success) {
                    console.log('[ProductDetails] Offers data received:', res.data.data);
                    setRestaurantOffers(res.data.data);
                } else {
                    console.warn('[ProductDetails] Fetch offers responded with success=false:', res.data.message);
                }
            } catch (err) {
                console.error('[ProductDetails] Error fetching restaurant offers:', err);
            }
        };
        fetchOffers();
    }, [product]);

    // --- Fetch Reviews ---
    const fetchReviews = useCallback(async () => {
        if (!productId) return;
        setReviewsLoading(true);
        setReviewsError(null);
        try {
            const response = await reviewAPI.getMenuItemReviews(productId);
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
                const response = await api.get(`/user/favorites/${productId}/check`);
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

    // UPDATED: Handle direct add to cart with customization
    const handleAddToCartOrCustomize = (customizedItemData) => {
        if (!product) return;
        
        // If customizedItemData is provided, it means the customizer component has sent data
        if (customizedItemData) {
            console.log("Adding customized item to cart from ProductDetails:", customizedItemData);
            addToCart({
              ...customizedItemData,
              restaurantId: product.restaurant?.id,
              restaurantName: product.restaurant?.name || 'Restaurant',
              // Ensure special instructions from the main page are included if applicable
              customizationDetails: {
                 ...customizedItemData.customizationDetails,
                 specialInstructions: customizedItemData.customizationDetails?.specialInstructions || specialInstructions.trim() || undefined
              }
            });
            return;
        }

        // If there's no customization data, use simple add with just quantity and special instructions
        let unitPriceToAdd;
        let basePriceToAdd = product.price; // Base price is usually the non-discounted price

        // 1. Check for active offerDetails
        if (product.offerDetails && product.offerDetails.percentage > 0 && product.price > 0) {
            unitPriceToAdd = parseFloat((product.price * (1 - product.offerDetails.percentage / 100)).toFixed(2));
        } 
        // 2. Check for discountedPrice prop (could be a manual discount)
        else if (product.discountedPrice !== undefined && product.discountedPrice < product.price) {
            unitPriceToAdd = product.discountedPrice;
        } 
        // 3. Default to the standard price
        else {
            unitPriceToAdd = product.price;
            basePriceToAdd = product.price; // In this case, base and unit are the same
        }

        const imageUrlForCart = getBestImageUrl(product);
        const finalPriceForQuantity = parseFloat((unitPriceToAdd * quantity).toFixed(2));

        const cartItem = {
            id: product.id, 
            name: product.name,
            price: finalPriceForQuantity, // Total price for the initial quantity
            unitPrice: unitPriceToAdd,     // Calculated price per single unit
            basePrice: basePriceToAdd,     // Original base price before any discount
            image: imageUrlForCart,
            quantity: quantity,
            selectedAddOns: [], // No add-ons for simple add
            customizationDetails: { specialInstructions: specialInstructions.trim() || undefined },
            restaurantId: product.restaurant?.id,
            restaurantName: product.restaurant?.name || 'Restaurant'
        };
        
        addToCart(cartItem);
        console.log(`Added simple ${product.name} to cart. Unit Price: ${unitPriceToAdd}, Base Price: ${basePriceToAdd}, Quantity: ${quantity}, Total: ${finalPriceForQuantity}`);
    };

    // Function to toggle favorite status
    const toggleFavorite = async () => {
        if (!isAuthenticated) {
            navigate('/signin', { state: { from: `/product/${productId}` } });
            return;
        }
        
        setFavoriteLoading(true);
        try {
            console.log(`Toggling favorite: ${product?.name}`);
            let response;
            if (!isFavorite) {
                // Add to favorites
                response = await api.post('/user/favorites', { menuItemId: productId });
            } else {
                // Remove from favorites
                response = await api.delete(`/user/favorites/${productId}`);
            }

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
            const response = await reviewAPI.createReview({
                menuItemId: productId,
                rating: newReviewRating,
                comment: newReviewComment
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
            setReviewSubmitError(error.response?.data?.error?.message || 'An error occurred while submitting your review.');
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
        return <div className="flex items-center justify-center h-screen"><Spinner size="large" /></div>;
    }

    if (error) {
        return <div className="container py-10"><Alert variant="destructive">Error loading product: {error}</Alert></div>;
    }

    // Safety check: If loading is done but product is still null, show an error.
    if (!product) {
        return <div className="container py-10"><Alert variant="warning">Product details could not be loaded or the product does not exist.</Alert></div>;
    }

    // Process image URL with fallback
    const imageUrl = getBestImageUrl(product);
    const displayPrice = product.discountedPrice !== undefined ? product.discountedPrice : product.price;
    const originalPrice = product.discountedPrice !== undefined ? product.price : null;
    const hasOffer = product.offerDetails && product.offerDetails.percentage > 0;

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

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
                    {/* Product Image Section */}
                    <div className="relative">
                        <ProductZoom images={[imageUrl]} altText={product.name || 'Product Image'} />
                        {hasOffer && (
                          <div className="absolute top-4 right-4 p-1.5 bg-yumrun-red text-white rounded-md text-xs font-semibold flex items-center gap-1 z-10">
                             <FaTag className="w-3 h-3"/>
                             <span>{product.offerDetails.percentage}% OFF</span>
                          </div>
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            className="absolute z-10 bg-white rounded-full shadow top-4 left-4"
                            onClick={toggleFavorite}
                            disabled={favoriteLoading}
                            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            {favoriteLoading ? <Spinner size="sm" /> : (isFavorite ? <FaHeart className="text-red-500" /> : <FaRegHeart />)}
                        </Button>
                    </div>

                    {/* Product Details Section */}
                    <div className="flex flex-col">
                        <h1 className="mb-2 text-3xl font-bold text-gray-800">{product.name || 'Product Name'}</h1>
                        {product.restaurant && product.restaurant.id && (
                            <Link 
                                to={`/restaurant/${product.restaurant.id}`}
                                className="mb-3 text-sm text-yumrun-primary hover:underline"
                            >
                                From: {product.restaurant.name || 'Restaurant'}
                            </Link>
                        )}
                        {/* Restaurant-level offers badges */}
                        {restaurantOffers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {restaurantOffers.map(offer => (
                                    <span 
                                        key={offer._id || offer.id} 
                                        className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded-full shadow-sm"
                                        title={offer.description}
                                    >
                                        <FaTag className="w-3 h-3" />
                                        {offer.discountPercentage}% OFF {offer.title}
                                    </span>
                                ))}
                            </div>
                        )}
                        
                        {/* Rating */}
                        <div className="flex items-center mb-4">
                            {renderRatingStars(averageRating, 'lg')}
                            <span className="ml-2 text-gray-600">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
                        </div>

                        {/* Price Display - USE displayPrice and originalPrice */}
                        <div className="text-3xl font-bold">
                            <span className={originalPrice ? "text-yumrun-red" : "text-gray-900"}>Rs. {displayPrice.toFixed(2)}</span>
                            {originalPrice && (
                                <span className="ml-3 text-xl text-gray-400 line-through">Rs. {originalPrice.toFixed(2)}</span>
                            )}
                        </div>
                        
                        <p className="mb-5 leading-relaxed text-gray-600">{product.description || 'No description available.'}</p>
                        
                        {/* Quantity Selector - Only show if NOT customizing */}
                        {!product.customizationOptions?.availableAddOns?.length > 0 && (
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
                                  <span className="w-12 px-4 py-1 font-semibold text-center">{quantity}</span>
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
                        )}

                        {/* Special Instructions - Only show if NOT customizing (Customizer has its own) */}
                        {!product.customizationOptions?.availableAddOns?.length > 0 && (
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
                        )}

                        {/* Customization Options - Now directly on the page */}
                        {product && product.customizationOptions?.availableAddOns?.length > 0 && (
                            <Card className="p-4 mb-5">
                                <h3 className="mb-4 text-lg font-semibold">Customize Your Order</h3>
                                <IngredientCustomizer
                                    menuItem={product}
                                    onChange={handleAddToCartOrCustomize}
                                />
                            </Card>
                        )}

                        {/* Order Now button for quick checkout from product page */}
                        {product.customizationOptions?.availableAddOns?.length > 0 && product.isAvailable && (
                          <Button
                            onClick={() => { handleAddToCartOrCustomize(); navigate('/checkout'); }}
                            variant="brand"
                            size="lg"
                            className="w-full mb-6"
                            disabled={!product.isAvailable}
                          >
                            Order Now
                          </Button>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col items-stretch mt-auto space-y-3 md:flex-row md:space-y-0 md:space-x-4">
                            {/* Only show Add to Cart and Order Now if there are no customization options */}
                            {!product.customizationOptions?.availableAddOns?.length > 0 && (
                                <>
                                  <Button 
                                      onClick={() => handleAddToCartOrCustomize()} 
                                      variant="brand"
                                      size="lg"
                                      className="w-full md:flex-1"
                                      disabled={!product || !product.isAvailable} 
                                  >
                                      <FaShoppingCart className="mr-2" />
                                      {product.isAvailable ? 'Add to Cart' : 'Unavailable'}
                                  </Button>
                                  <Button
                                      onClick={() => { handleAddToCartOrCustomize(); navigate('/checkout'); }}
                                      variant="outline"
                                      size="lg"
                                      className="w-full md:flex-1"
                                      disabled={!product || !product.isAvailable}
                                  >
                                      Order Now
                                  </Button>
                                </>
                            )}
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
                    <h2 className="mb-6 text-2xl font-semibold">Reviews & Ratings</h2>
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
                                                <span className="ml-auto text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="mb-1 text-sm font-medium text-gray-800">{review.user?.fullName || 'Anonymous'}</p>
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
                                    <h3 className="mb-4 text-lg font-semibold">Write Your Review</h3>
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
