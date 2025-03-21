import Rating from '@mui/material/Rating';
import { BsArrowsFullscreen } from "react-icons/bs";
import Button from '@mui/material/Button';
import { CiHeart } from "react-icons/ci";
import { FiShoppingCart } from "react-icons/fi";
import { FaMapMarkerAlt } from "react-icons/fa";
import { useContext, useState } from 'react';
import { MyContext } from '../../App';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

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

    return (
        <div className={`productItem ${itemView} ${imgLoaded ? 'img-loaded' : 'img-loading'}`}>
            <Link to={`/product/${id}`} aria-label={`View ${name} details`}>
                <div className="imgWrapper">
                    <div className="img-placeholder"></div>
                    <img 
                        src={imgSrc} 
                        className="w-100" 
                        alt={name}
                        loading="lazy"
                        onLoad={handleImageLoad}
                    />
                    {discount && (
                        <span className="badge badge-primary" aria-label={`${discount}% discount`}>{discount}%</span>
                    )}
                </div>
            </Link>
            
            <div className="info">
                <Link to={`/product/${id}`}>
                    <h4>{name}</h4>
                    {location && (
                        <p className="location">
                            <FaMapMarkerAlt className="location-marker" aria-hidden="true" />
                            <span>{location}</span>
                        </p>
                    )}
                </Link>
                
                <div className="rating-container">
                    <Rating 
                        className="mt-2 mb-2" 
                        name={`rating-${id}`} 
                        value={parseFloat(rating)} 
                        readOnly 
                        size="small" 
                        precision={0.5} 
                        aria-label={`Rated ${rating} out of 5`}
                    />
                    <span className="rating-text">{rating}</span>
                </div>
                
                <div className="d-flex align-items-center justify-content-between price-container">
                    <div className="prices">
                        <span className="oldPrice">Rs.{oldPrice}</span>
                        <span className="netPrice text-danger ml-2">Rs.{newPrice}</span>
                    </div>
                    
                    <div className="actions">
                        <div className="tooltip-container">
                            <Button 
                                className="action-btn quick-view-btn" 
                                onClick={viewProductDetails} 
                                aria-label="Quick view"
                                onMouseEnter={() => setShowTooltip('view')}
                                onMouseLeave={() => setShowTooltip(false)}
                            >
                                <BsArrowsFullscreen aria-hidden="true" /> 
                            </Button>
                            {showTooltip === 'view' && <span className="tooltip-text">Quick view</span>}
                        </div>
                        
                        <div className="tooltip-container">
                            <Button 
                                className={`action-btn wishlist-btn ${favoriteActive ? 'active-favorite' : ''}`}
                                aria-label={favoriteActive ? "Remove from wishlist" : "Add to wishlist"}
                                onMouseEnter={() => setShowTooltip('wishlist')}
                                onMouseLeave={() => setShowTooltip(false)}
                                onClick={toggleFavorite}
                            >
                                <CiHeart 
                                    style={{ fontSize: '20px', fill: favoriteActive ? '#ea2b0f' : 'none' }}
                                    aria-hidden="true"
                                /> 
                            </Button>
                            {showTooltip === 'wishlist' && (
                                <span className="tooltip-text">
                                    {favoriteActive ? "Remove from wishlist" : "Add to wishlist"}
                                </span>
                            )}
                        </div>
                        
                        <div className="tooltip-container">
                            <Button 
                                className={`action-btn cart-btn ${cartButtonClass}`}
                                aria-label="Add to cart"
                                onMouseEnter={() => setShowTooltip('cart')}
                                onMouseLeave={() => setShowTooltip(false)}
                                onClick={handleAddToCart}
                            >
                                <FiShoppingCart style={{ fontSize: '18px' }} aria-hidden="true" /> 
                            </Button>
                            {showTooltip === 'cart' && <span className="tooltip-text">Add to cart</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Default props
ProductItem.defaultProps = {
    itemView: "four",
    id: "1",
    discount: "20",
    name: "Fire And Ice Pizzeria",
    location: "Bhaktapur",
    rating: 4.5,
    oldPrice: "650",
    newPrice: "520",
    imgSrc: "https://fmdadmin.foodmandu.com//Images/Vendor/269/Logo/web_240423103631_200624060757.listing-fire-and-ice.png"
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
