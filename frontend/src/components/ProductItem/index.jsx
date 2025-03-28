import { BsArrowsFullscreen } from "react-icons/bs";
import { CiHeart } from "react-icons/ci";
import { FiShoppingCart } from "react-icons/fi";
import { FaMapMarkerAlt } from "react-icons/fa";
import { useContext, useState } from 'react';
import { MyContext } from '../../App';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  Button,
  Badge
} from '../ui';
import { cn } from "../../lib/utils";

const ProductItem = ({ 
    itemView = "four", 
    id = "1", 
    discount = "20", 
    name = "Fire And Ice Pizzeria", 
    location = "Bhaktapur", 
    rating = 4.5, 
    oldPrice = "650", 
    newPrice = "520", 
    imgSrc = "https://fmdadmin.foodmandu.com//Images/Vendor/269/Logo/web_240423103631_200624060757.listing-fire-and-ice.png" 
}) => {
    const context = useContext(MyContext);
    const [showTooltip, setShowTooltip] = useState(false);
    const [cartButtonClass, setCartButtonClass] = useState('');
    const [favoriteActive, setFavoriteActive] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);

    const viewProductDetails = () => {
        context.setIsOpenProductModel(true);
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCartButtonClass('cart-added');
        
        // Reset animation class after animation completes
        setTimeout(() => {
            setCartButtonClass('');
        }, 800);

        // Here you would also add the item to cart in your state management system
        console.log(`Added ${name} to cart`);
    };
    
    const toggleFavorite = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setFavoriteActive(!favoriteActive);
        console.log(`${favoriteActive ? 'Removed from' : 'Added to'} favorites: ${name}`);
    };

    const handleImageLoad = () => {
        setImgLoaded(true);
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
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
                <span className="ml-1 text-sm font-medium text-gray-600">{rating}</span>
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
        <Card className={`group overflow-hidden transition-all duration-300 hover:shadow-md ${getSizeClass()}`}>
            <div className="relative overflow-hidden">
                {/* Image container with aspect ratio */}
                <div className="relative pt-[75%] bg-gray-100">
                    {!imgLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="animate-pulse w-12 h-12 rounded-full bg-gray-200"></div>
                        </div>
                    )}
                    <Link to={`/product/${id}`} aria-label={`View ${name} details`}>
                        <img 
                            src={imgSrc} 
                            className={cn(
                                "absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                                imgLoaded ? "opacity-100" : "opacity-0"
                            )}
                            alt={name}
                            loading="lazy"
                            onLoad={handleImageLoad}
                        />
                    </Link>
                    
                    {discount && (
                        <Badge className="absolute top-2 left-2 bg-yumrun-accent" variant="secondary">
                            {discount}% OFF
                        </Badge>
                    )}
                    
                    {/* Quick actions overlay */}
                    <div className="absolute right-2 top-2 flex flex-col gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 rounded-full bg-white hover:bg-gray-100 shadow-sm"
                            onClick={viewProductDetails}
                            aria-label="Quick view"
                        >
                            <BsArrowsFullscreen className="h-4 w-4" />
                        </Button>
                        
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 rounded-full bg-white hover:bg-gray-100 shadow-sm"
                            onClick={toggleFavorite}
                            aria-label={favoriteActive ? "Remove from wishlist" : "Add to wishlist"}
                        >
                            <CiHeart 
                                className={cn("h-5 w-5", favoriteActive ? "text-yumrun-accent fill-yumrun-accent" : "")}
                            />
                        </Button>
                        
                        <Button
                            size="icon"
                            variant="secondary"
                            className={cn(
                                "h-8 w-8 rounded-full bg-white hover:bg-gray-100 shadow-sm",
                                cartButtonClass === 'cart-added' && "animate-bounce bg-yumrun-primary text-white"
                            )}
                            onClick={handleAddToCart}
                            aria-label="Add to cart"
                        >
                            <FiShoppingCart className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                
                <CardContent className="p-4">
                    <Link to={`/product/${id}`} className="block hover:text-yumrun-primary transition-colors">
                        <h3 className="text-lg font-medium line-clamp-1">{name}</h3>
                        
                        {location && (
                            <div className="flex items-center mt-1 text-gray-500 text-sm">
                                <FaMapMarkerAlt className="mr-1 text-yumrun-secondary h-3 w-3" />
                                <span>{location}</span>
                            </div>
                        )}
                    </Link>
                    
                    <div className="mt-2">
                        {renderRating(rating)}
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                        <div className="price-container">
                            <span className="text-sm text-gray-500 line-through mr-2">Rs.{oldPrice}</span>
                            <span className="text-yumrun-accent font-medium">Rs.{newPrice}</span>
                        </div>
                        
                        <Button 
                            size="sm" 
                            variant="outline"
                            className="hidden md:flex items-center gap-1"
                            onClick={handleAddToCart}
                        >
                            <FiShoppingCart className="h-4 w-4" />
                            <span>Add</span>
                        </Button>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
};

// Prop validation
ProductItem.propTypes = {
    itemView: PropTypes.string,
    id: PropTypes.string,
    discount: PropTypes.string,
    name: PropTypes.string,
    location: PropTypes.string,
    rating: PropTypes.number,
    oldPrice: PropTypes.string,
    newPrice: PropTypes.string,
    imgSrc: PropTypes.string
};

export default ProductItem;
