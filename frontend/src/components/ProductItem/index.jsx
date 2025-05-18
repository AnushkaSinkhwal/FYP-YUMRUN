import { BsArrowsFullscreen } from "react-icons/bs";
import { CiHeart } from "react-icons/ci";
import { FiShoppingCart } from "react-icons/fi";
import { FaMapMarkerAlt, FaHeart, FaStore, FaTag } from "react-icons/fa";
import { useContext, useState, useEffect } from 'react';
import { MyContext } from '../../context/UIContext.js';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  Button,
  Badge
} from '../ui';
import { cn } from "../../lib/utils";
import { useCart } from '../../context/CartContext';
import { PLACEHOLDERS, getBestImageUrl } from '../../utils/imageUtils';

const ProductItem = ({ 
    itemView = "four", 
    id = "1", 
    discount = "",
    name = "Fire And Ice Pizzeria", 
    location = "",
    rating = 0, 
    oldPrice = "",
    newPrice = "0",
    price = 0,
    image = "",
    imgSrc = "",
    isRestaurant = false,
    linkTo = "",
    offerDetails = null,
    restaurant = null
}) => {
    const context = useContext(MyContext);
    const { addToCart } = useCart();
    const [cartButtonClass, setCartButtonClass] = useState('');
    const [favoriteActive, setFavoriteActive] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);

    // Determine the link based on whether it's a restaurant or a product
    const itemLink = linkTo || (isRestaurant ? `/restaurant/${id}` : `/product/${id}`);

    // Process the image URL using getFullImageUrl and appropriate placeholder
    const finalImage = image || imgSrc || '';
    const processedImageUrl = getBestImageUrl(isRestaurant ? 
        { image: finalImage } : // For restaurants
        { image: finalImage, imageUrl: finalImage } // For menu items
    );

    // Calculate display prices based on offerDetails or props
    let displayPrice = parseFloat(newPrice) || 0;
    let displayOldPrice = parseFloat(oldPrice) || null;
    const hasOffer = offerDetails && offerDetails.percentage > 0;

    if (hasOffer && price > 0) {
        // Use price prop as the base when offerDetails is present
        const calculatedDiscountedPrice = parseFloat((price * (1 - offerDetails.percentage / 100)).toFixed(2));
        displayPrice = calculatedDiscountedPrice;
        displayOldPrice = parseFloat(price.toFixed(2)); // Original price from 'price' prop
    } else if (!hasOffer && oldPrice && parseFloat(oldPrice) > parseFloat(newPrice)) {
        // Fallback to using oldPrice/newPrice props if no offerDetails
        displayPrice = parseFloat(newPrice);
        displayOldPrice = parseFloat(oldPrice);
    } else {
         // Default case: use price or newPrice as the main price
         displayPrice = price > 0 ? parseFloat(price.toFixed(2)) : parseFloat(newPrice);
         displayOldPrice = null; // No old price to show
    }

    // Check if item is in favorites on component mount
    useEffect(() => {
        // Don't check for restaurants, only menu items
        if (isRestaurant) return;
        
        const checkFavoriteStatus = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) return; // Not logged in
            
            try {
                // Ensure fetch URL is correctly formed
                const response = await fetch(`/api/user/favorites/${id}/check`, { 
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const data = await response.json();
                if (data.success) {
                    setFavoriteActive(data.data.isFavorite);
                } else {
                    // Handle case where item might not exist in favorites yet or other errors
                    console.warn(`Favorite check failed for item ${id}: ${data.message || 'Unknown error'}`);
                    setFavoriteActive(false); // Assume not favorite if check fails
                }
            } catch (error) {
                console.error('Error checking favorite status:', error);
                setFavoriteActive(false); // Assume not favorite on network error
            }
        };
        
        checkFavoriteStatus();
    }, [id, isRestaurant]);

    const viewProductDetails = () => {
        if (isRestaurant) {
            // Navigate to restaurant page instead of opening modal
             // Use react-router Link/navigate if possible, otherwise fallback
            window.location.href = itemLink; 
        } else {
            context.setProductId(id);
            context.setIsOpenProductModel(true);
        }
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Skip for restaurants
        if (isRestaurant) {
            window.location.href = itemLink;
            return;
        }
        
        setCartButtonClass('cart-added');
        setAddedToCart(true);
        
        // Reset animation class after animation completes
        setTimeout(() => {
            setCartButtonClass('');
        }, 800);

        // Determine restaurant info: Prioritize restaurant prop, then location prop, then fallback
        let finalRestaurantId = '';
        let finalRestaurantName = 'Restaurant'; // Default name

        if (restaurant && restaurant.id) {
            finalRestaurantId = restaurant.id;
            finalRestaurantName = restaurant.name || finalRestaurantName;
        } else if (typeof location === 'object' && location !== null && location.id) {
            finalRestaurantId = location.id;
            finalRestaurantName = location.name || finalRestaurantName;
        } else if (typeof location === 'string' && location) {
            // If location is just a string, use it as name, ID might be unknown or derived from item ID
            finalRestaurantName = location;
            // Attempt to derive ID from item ID as a last resort
            if (!finalRestaurantId && id) {
                 const parts = id.split(':'); // Assuming format like restaurantId:itemId
                 if (parts.length > 1) {
                     finalRestaurantId = parts[0];
                 } else {
                     // Fallback if ID format isn't as expected
                     finalRestaurantId = id.split('_')[0]; 
                 }
            }
        } else if (!finalRestaurantId && id) {
             // Last fallback if location is not useful and no restaurant prop
              const parts = id.split(':'); 
                 if (parts.length > 1) {
                     finalRestaurantId = parts[0];
                 } else {
                     finalRestaurantId = id.split('_')[0]; 
                 }
        }
        
        // Add an explicit check for a valid-looking ID
        const isValidMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
        
        if (!finalRestaurantId || finalRestaurantId === 'UNKNOWN' || !isValidMongoId(finalRestaurantId)) {
            console.error(`[ProductItem] Invalid or missing finalRestaurantId ('${finalRestaurantId}') for item ${name}. Cannot add to cart.`);
            // Optionally show a user-facing error toast here
            // addToast('Could not add item: Missing restaurant information.', { type: 'error' });
            return; // Prevent adding to cart
        }
        
        // Add the item to cart using the CartContext
        // Use the calculated displayPrice (which is discounted if applicable)
        addToCart({
            id,
            name,
            price: displayPrice, // Use the final calculated price for one unit
            image: processedImageUrl,
            rating,
            restaurantId: finalRestaurantId, // Pass the validated ID
            restaurant: {
                id: finalRestaurantId,
                name: finalRestaurantName,
                _id: finalRestaurantId // Ensure _id is also present
            }
        }, 1); // Add quantity 1 for ProductItem click
        
        // Show success briefly
        setTimeout(() => {
            setAddedToCart(false);
        }, 2000);
    };
    
    const toggleFavorite = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if user is authenticated - if not, just redirect to login
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/signin';
            return;
        }
        
        try {
            const url = `/api/user/favorites`;
            const method = favoriteActive ? 'DELETE' : 'POST';
            const body = { menuItemId: id };
            
            const response = await fetch(
                favoriteActive ? `${url}/${id}` : url, 
                {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: method === 'POST' ? JSON.stringify(body) : undefined
                }
            );
            
            const data = await response.json();
            
            if (data.success) {
                setFavoriteActive(!favoriteActive);
                console.log(`${favoriteActive ? 'Removed from' : 'Added to'} favorites: ${name}`);
            } else {
                console.error('Error toggling favorite:', data.error);
            }
        } catch (error) {
            console.error('Error toggling favorite status:', error);
        }
    };

    const handleImageLoad = () => {
        setImgLoaded(true);
    };

    const handleImageError = (e) => {
        // Use a proper placeholder image from the backend
        e.target.src = isRestaurant ? PLACEHOLDERS.RESTAURANT : PLACEHOLDERS.FOOD;
        setImgLoaded(true); // Still consider it loaded even if it's a fallback
    };

    // Function to render the star rating
    const renderRating = (value) => {
        const fullStars = Math.floor(value);
        const hasHalfStar = value % 1 >= 0.5;
        
        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <svg 
                        key={i} 
                        className={cn(
                            "w-4 h-4", 
                            i < fullStars 
                                ? "text-yellow-400" 
                                : i === fullStars && hasHalfStar 
                                    ? "text-yellow-400 half-star" 
                                    : "text-gray-300"
                        )}
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
                <span className="ml-1 text-sm font-medium text-gray-600" aria-label={`${value} out of 5 stars`}>{value}</span>
            </div>
        );
    };

    // Define the size class based on the itemView prop
    const getSizeClass = () => {
        switch (itemView) {
            case "two":
                return "col-span-2 md:col-span-1";
            case "three":
                return "col-span-2 md:col-span-1 lg:col-span-1/3";
            case "four":
            default:
                return "col-span-2 md:col-span-1 lg:col-span-1/4";
        }
    };

    return (
        <Card className={`group relative overflow-hidden rounded-md transition-all duration-300 hover:shadow-lg ${getSizeClass()}`}>
            {/* Added to cart notification */}
            {addedToCart && !isRestaurant && (
                <div className="absolute top-0 left-0 right-0 z-20 p-2 m-2 text-center text-white bg-green-500 rounded-md animate-fade-in-down">
                    Added to cart!
                </div>
            )}
            
            {/* Restaurant badge */}
            {isRestaurant && (
                <Badge className="absolute z-10 text-white bg-blue-500 top-2 left-2" variant="secondary">
                    Restaurant
                </Badge>
            )}
            
            <div className="relative overflow-hidden">
                {/* Image container with aspect ratio */}
                <div className="relative pt-[75%] bg-gray-50">
                    {!imgLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="w-10 h-10 border-4 rounded-full border-yumrun-primary border-t-transparent animate-spin"></div>
                        </div>
                    )}
                    <Link to={itemLink} aria-label={`View ${name} details`}>
                        <img 
                            src={processedImageUrl} 
                            className={cn(
                                "absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                                imgLoaded ? "opacity-100" : "opacity-0"
                            )}
                            alt={name}
                            loading="lazy"
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                        />
                    </Link>
                    
                    {/* Offer Badge */}
                    {offerDetails && offerDetails.percentage > 0 && (
                      <div className="absolute top-2 right-2 p-1.5 bg-yumrun-red text-white rounded-md text-xs font-semibold flex items-center gap-1">
                         <FaTag className="w-3 h-3"/>
                         <span>{offerDetails.percentage}% OFF</span>
                      </div>
                    )}
                    
                    {!isRestaurant && discount && parseFloat(discount) > 0 && (
                        <Badge className="absolute text-white top-2 left-2 bg-yumrun-accent" variant="secondary">
                            {discount}% OFF
                        </Badge>
                    )}
                    
                    {/* Quick actions overlay */}
                    <div className="absolute flex flex-col gap-2 transition-all duration-300 translate-x-12 opacity-0 right-2 top-2 group-hover:translate-x-0 group-hover:opacity-100">
                        <Button
                            size="icon"
                            variant="secondary"
                            className="w-8 h-8 bg-white rounded-full shadow-md hover:bg-gray-100 focus:ring-2 focus:ring-yumrun-primary/50 focus:outline-none"
                            onClick={viewProductDetails}
                            aria-label="Quick view"
                        >
                            {isRestaurant ? <FaStore className="w-4 h-4" /> : <BsArrowsFullscreen className="w-4 h-4" />}
                        </Button>
                        
                        {!isRestaurant && (
                            <>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className={cn(
                                        "w-8 h-8 rounded-full shadow-md focus:ring-2 focus:ring-yumrun-primary/50 focus:outline-none",
                                        favoriteActive 
                                            ? "bg-pink-50 hover:bg-pink-100" 
                                            : "bg-white hover:bg-gray-100"
                                    )}
                                    onClick={toggleFavorite}
                                    aria-label={favoriteActive ? "Remove from wishlist" : "Add to wishlist"}
                                >
                                    {favoriteActive ? (
                                        <FaHeart className="w-4 h-4 text-yumrun-accent" />
                                    ) : (
                                        <CiHeart className="w-5 h-5" />
                                    )}
                                </Button>
                                
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className={cn(
                                        "h-8 w-8 rounded-full shadow-md focus:ring-2 focus:ring-yumrun-primary/50 focus:outline-none",
                                        cartButtonClass === 'cart-added' 
                                            ? "animate-bounce bg-yumrun-primary text-white" 
                                            : "bg-white hover:bg-gray-100"
                                    )}
                                    onClick={handleAddToCart}
                                    aria-label="Add to cart"
                                >
                                    <FiShoppingCart className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                
                <CardContent className="p-4">
                    <Link to={itemLink} className="block transition-colors hover:text-yumrun-primary">
                        <h3 className="text-lg font-medium line-clamp-1">{name}</h3>
                        
                        {/* Display location string or restaurant name */}
                        {isRestaurant ? (
                            location && typeof location === 'string' && (
                                <div className="flex items-center mt-1 text-sm text-gray-500">
                                    <FaMapMarkerAlt className="w-3 h-3 mr-1 text-yumrun-secondary" />
                                    <span>{location}</span>
                                </div>
                            )
                        ) : (
                            restaurant && restaurant.name && (
                                <div className="flex items-center mt-1 text-sm text-gray-500">
                                    <FaStore className="w-3 h-3 mr-1 text-yumrun-secondary" />
                                    <span>{restaurant.name}</span>
                                </div>
                            )
                        )}
                    </Link>
                    
                    <div className="mt-2">
                        {renderRating(rating)}
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                        {!isRestaurant ? (
                            <>
                                <div className="price-container">
                                    {/* Use calculated displayOldPrice and displayPrice */}
                                    {displayOldPrice && displayOldPrice > displayPrice ? (
                                        <span className="mr-2 text-sm text-gray-500 line-through">Rs. {displayOldPrice.toFixed(2)}</span>
                                    ) : null}
                                    <span className={`font-medium ${hasOffer ? 'text-yumrun-red' : 'text-yumrun-accent'}`}>
                                        Rs. {displayPrice.toFixed(2)}
                                    </span>
                                </div>
                                
                                <Button 
                                    size="sm" 
                                    variant={cartButtonClass === 'cart-added' ? "secondary" : "outline"}
                                    className={cn(
                                        "gap-1 transition-all duration-300",
                                        cartButtonClass === 'cart-added' ? "bg-yumrun-primary text-white" : "",
                                        "hidden sm:flex"
                                    )}
                                    onClick={handleAddToCart}
                                >
                                    <FiShoppingCart className="w-4 h-4" />
                                    <span>{cartButtonClass === 'cart-added' ? "Added" : "Add"}</span>
                                </Button>
                                
                                {/* Mobile add button */}
                                <Button
                                    size="icon"
                                    variant={cartButtonClass === 'cart-added' ? "secondary" : "outline"}
                                    className={cn(
                                        "h-8 w-8 sm:hidden transition-all duration-300",
                                        cartButtonClass === 'cart-added' ? "bg-yumrun-primary text-white" : ""
                                    )}
                                    onClick={handleAddToCart}
                                    aria-label="Add to cart"
                                >
                                    <FiShoppingCart className="w-4 h-4" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <div></div> {/* Empty div to maintain layout */}
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="gap-1"
                                    onClick={() => window.location.href = itemLink}
                                >
                                    <FaStore className="w-4 h-4" />
                                    <span>View</span>
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </div>
        </Card>
    );
};

// Prop validation
ProductItem.propTypes = {
    itemView: PropTypes.string,
    id: PropTypes.string.isRequired,
    discount: PropTypes.string,
    name: PropTypes.string.isRequired,
    location: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })
    ]),
    rating: PropTypes.number,
    oldPrice: PropTypes.string,
    newPrice: PropTypes.string,
    price: PropTypes.number,
    image: PropTypes.string,
    imgSrc: PropTypes.string,
    isRestaurant: PropTypes.bool,
    linkTo: PropTypes.string,
    offerDetails: PropTypes.shape({
        percentage: PropTypes.number,
        title: PropTypes.string,
        id: PropTypes.string
    }),
    restaurant: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string
    })
};

export default ProductItem;
