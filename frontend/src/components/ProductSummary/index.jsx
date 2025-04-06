import { FaStar, FaRegStar, FaStarHalfAlt, FaHeart, FaRegHeart, FaClock } from 'react-icons/fa';
import { useState } from 'react';
import PropTypes from 'prop-types';

const ProductSummary = ({ product }) => {
    const [isFavorite, setIsFavorite] = useState(false);
    
    // Default product data if not provided
    const defaultProduct = {
        name: "Classic Margherita Pizza",
        category: "Italian",
        rating: 4.5,
        ratingCount: 128,
        price: 12.99,
        description: "Our authentic Margherita pizza features a thin, crispy crust topped with fresh tomato sauce, mozzarella cheese, and basil leaves. Made with the finest ingredients and baked to perfection.",
        availability: true,
        discount: 0,
        prepTime: 20 // Added prep time in minutes
    };
    
    const productData = product || defaultProduct;
    
    // Calculate display price with discount
    const displayPrice = productData.discount > 0 
        ? productData.price * (1 - productData.discount / 100) 
        : productData.price;
    
    // Render stars based on rating
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<FaStar key={i} className="text-yellow-400" />);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
            } else {
                stars.push(<FaRegStar key={i} className="text-yellow-400" />);
            }
        }
        
        return stars;
    };
    
    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
    };
    
    return (
        <div className="product-summary">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="mb-1 text-2xl font-bold text-gray-800 md:text-3xl">
                        {productData.name}
                    </h1>
                    <p className="mb-2 text-sm text-gray-500">
                        {productData.category} Cuisine
                    </p>
                </div>
                <button 
                    onClick={toggleFavorite}
                    className="p-2 transition-colors rounded-full hover:bg-gray-100"
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                    {isFavorite ? (
                        <FaHeart className="text-xl text-red-500" />
                    ) : (
                        <FaRegHeart className="text-xl text-gray-400 hover:text-red-500" />
                    )}
                </button>
            </div>
            
            <div className="flex items-center mb-4">
                <div className="flex mr-2">
                    {renderStars(productData.rating)}
                </div>
                <p className="text-sm text-gray-600">
                    ({productData.ratingCount} reviews)
                </p>
            </div>
            
            <div className="mb-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                        ${displayPrice.toFixed(2)}
                    </span>
                    {productData.discount > 0 && (
                        <>
                            <span className="text-lg text-gray-500 line-through">
                                ${productData.price.toFixed(2)}
                            </span>
                            <span className="px-2 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md">
                                {productData.discount}% OFF
                            </span>
                        </>
                    )}
                </div>
            </div>
            
            <div className="mb-4">
                <div className="flex items-center mb-2 text-sm text-gray-600">
                    <FaClock className="mr-2 text-yumrun-secondary" />
                    <span>Prep time: {productData.prepTime || 20} mins</span>
                </div>
            </div>
            
            <div className="mb-6">
                <h2 className="mb-2 text-lg font-medium text-gray-900">Description</h2>
                <p className="leading-relaxed text-gray-700">
                    {productData.description}
                </p>
            </div>
            
            <div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    productData.availability 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {productData.availability ? 'Available' : 'Currently Unavailable'}
                </span>
            </div>
        </div>
    );
};

ProductSummary.propTypes = {
    product: PropTypes.shape({
        name: PropTypes.string,
        category: PropTypes.string,
        rating: PropTypes.number,
        ratingCount: PropTypes.number,
        price: PropTypes.number,
        description: PropTypes.string,
        availability: PropTypes.bool,
        discount: PropTypes.number,
        prepTime: PropTypes.number
    })
};

export default ProductSummary; 