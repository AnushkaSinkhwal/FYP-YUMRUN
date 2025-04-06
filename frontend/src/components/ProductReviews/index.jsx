import { useState, useEffect } from 'react';
import { FaStar, FaRegStar, FaStarHalfAlt, FaUser } from 'react-icons/fa';
import PropTypes from 'prop-types';

const ProductReviews = ({ productId, initialReviews = [] }) => {
    const [reviews, setReviews] = useState(initialReviews);
    const [newReview, setNewReview] = useState({
        name: '',
        email: '',
        rating: 0,
        comment: '',
    });
    const [hoveredRating, setHoveredRating] = useState(0);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Use productId in useEffect to fetch reviews for specific product
    useEffect(() => {
        console.log(`Fetching reviews for product ID: ${productId}`);
        // In a real app, this would fetch reviews from an API
        // For now, we'll just use the sample reviews
    }, [productId]);

    // Generate sample reviews if none provided
    const sampleReviews = [
        {
            id: 1,
            name: "John Smith",
            rating: 5,
            date: "March 15, 2023",
            comment: "Absolutely delicious! The flavors were amazing and the delivery was prompt. Will definitely order again.",
        },
        {
            id: 2,
            name: "Sarah Johnson",
            rating: 4,
            date: "February 28, 2023",
            comment: "Very tasty pizza with quality ingredients. The crust was perfect. Only giving 4 stars because it arrived a bit cold.",
        },
        {
            id: 3,
            name: "Michael Davies",
            rating: 4.5,
            date: "January 10, 2023",
            comment: "One of the best pizzas I've had in a while. The fresh ingredients make all the difference!",
        }
    ];

    const displayReviews = reviews.length > 0 ? reviews : sampleReviews;

    // Calculate average rating
    const calculateAverageRating = () => {
        if (displayReviews.length === 0) return 0;
        const sum = displayReviews.reduce((total, review) => total + review.rating, 0);
        return (sum / displayReviews.length).toFixed(1);
    };

    // Render star rating
    const renderStars = (rating, interactive = false) => {
        const stars = [];
        const displayRating = interactive ? hoveredRating || newReview.rating : rating;
        const fullStars = Math.floor(displayRating);
        const hasHalfStar = !interactive && (displayRating % 1 >= 0.5);

        for (let i = 0; i < 5; i++) {
            if (interactive) {
                stars.push(
                    <button
                        key={i}
                        type="button"
                        className="text-2xl text-yellow-400 focus:outline-none"
                        onMouseEnter={() => setHoveredRating(i + 1)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => handleInputChange('rating', i + 1)}
                        aria-label={`Rate ${i + 1} stars`}
                    >
                        {i < displayRating ? <FaStar /> : <FaRegStar />}
                    </button>
                );
            } else {
                if (i < fullStars) {
                    stars.push(<FaStar key={i} className="text-yellow-400" />);
                } else if (i === fullStars && hasHalfStar) {
                    stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
                } else {
                    stars.push(<FaRegStar key={i} className="text-yellow-400" />);
                }
            }
        }

        return stars;
    };

    // Handle input changes
    const handleInputChange = (field, value) => {
        setNewReview({
            ...newReview,
            [field]: value
        });
        // Clear error for this field if it exists
        if (errors[field]) {
            setErrors({
                ...errors,
                [field]: null
            });
        }
    };

    // Validate form before submission
    const validateForm = () => {
        const newErrors = {};
        if (!newReview.name.trim()) newErrors.name = "Name is required";
        if (!newReview.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(newReview.email)) {
            newErrors.email = "Email is invalid";
        }
        if (!newReview.rating) newErrors.rating = "Please select a rating";
        if (!newReview.comment.trim()) newErrors.comment = "Review text is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setSubmitting(true);
        
        // Simulate API call with setTimeout
        setTimeout(() => {
            const newReviewObject = {
                id: Date.now(),
                name: newReview.name,
                rating: newReview.rating,
                date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                comment: newReview.comment
            };
            
            // Add new review to the list
            setReviews([...reviews, newReviewObject]);
            
            // Reset form
            setNewReview({
                name: '',
                email: '',
                rating: 0,
                comment: ''
            });
            
            setSubmitting(false);
            setSubmitted(true);
            
            // After 3 seconds, reset the success message
            setTimeout(() => {
                setSubmitted(false);
            }, 3000);
        }, 1000);
    };

    return (
        <div className="product-reviews">
            {/* Reviews Summary */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center mb-4">
                    <div className="md:mr-8 mb-4 md:mb-0">
                        <div className="text-5xl font-bold text-gray-900">{calculateAverageRating()}</div>
                        <div className="flex mt-2">
                            {renderStars(calculateAverageRating())}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                            Based on {displayReviews.length} reviews
                        </div>
                    </div>
                    
                    <div className="flex-1">
                        {/* Rating Distribution */}
                        {[5, 4, 3, 2, 1].map(rating => {
                            const count = displayReviews.filter(review => 
                                Math.floor(review.rating) === rating
                            ).length;
                            
                            const percentage = displayReviews.length > 0 
                                ? (count / displayReviews.length) * 100 
                                : 0;
                                
                            return (
                                <div key={rating} className="flex items-center mb-1">
                                    <div className="flex items-center mr-2 w-16">
                                        <span className="mr-1">{rating}</span>
                                        <FaStar className="text-yellow-400 text-sm" />
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                            className="bg-yellow-400 h-2.5 rounded-full" 
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="ml-2 text-xs text-gray-500 w-10">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            {/* Review List */}
            <div className="mb-12">
                <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>
                
                {displayReviews.length > 0 ? (
                    <div className="space-y-6">
                        {displayReviews.map(review => (
                            <div key={review.id} className="border-b border-gray-100 pb-6">
                                <div className="flex items-start">
                                    <div className="mr-3 bg-gray-100 rounded-full p-2">
                                        <FaUser className="text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="text-lg font-medium">{review.name}</h4>
                                            <div className="flex">
                                                {renderStars(review.rating)}
                                            </div>
                                            <span className="text-sm text-gray-500">{review.date}</span>
                                        </div>
                                        <p className="mt-2 text-gray-700">{review.comment}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 mb-4">No reviews yet. Be the first to leave a review!</p>
                )}
            </div>
            
            {/* Review Form */}
            <div>
                <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
                
                {submitted ? (
                    <div className="p-4 bg-green-50 text-green-800 rounded-md mb-6">
                        Your review has been submitted successfully. Thank you for your feedback!
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Your Rating*
                            </label>
                            <div className="flex">
                                {renderStars(newReview.rating, true)}
                            </div>
                            {errors.rating && (
                                <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
                            )}
                        </div>
                        
                        <div>
                            <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-1">
                                Your Review*
                            </label>
                            <textarea
                                id="review-comment"
                                rows={4}
                                className={`w-full p-3 border rounded-md ${
                                    errors.comment ? 'border-red-300' : 'border-gray-300'
                                } focus:ring-yumrun-primary focus:border-yumrun-primary`}
                                placeholder="Share your experience with this product..."
                                value={newReview.comment}
                                onChange={(e) => handleInputChange('comment', e.target.value)}
                            ></textarea>
                            {errors.comment && (
                                <p className="mt-1 text-sm text-red-600">{errors.comment}</p>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="review-name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Your Name*
                                </label>
                                <input
                                    type="text"
                                    id="review-name"
                                    className={`w-full p-3 border rounded-md ${
                                        errors.name ? 'border-red-300' : 'border-gray-300'
                                    } focus:ring-yumrun-primary focus:border-yumrun-primary`}
                                    placeholder="John Doe"
                                    value={newReview.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>
                            
                            <div>
                                <label htmlFor="review-email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Your Email*
                                </label>
                                <input
                                    type="email"
                                    id="review-email"
                                    className={`w-full p-3 border rounded-md ${
                                        errors.email ? 'border-red-300' : 'border-gray-300'
                                    } focus:ring-yumrun-primary focus:border-yumrun-primary`}
                                    placeholder="john@example.com"
                                    value={newReview.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-3 bg-yumrun-primary text-white font-medium rounded-lg hover:bg-yumrun-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {submitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Submitting...
                                </>
                            ) : "Submit Review"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

ProductReviews.propTypes = {
    productId: PropTypes.string.isRequired,
    initialReviews: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            name: PropTypes.string,
            rating: PropTypes.number,
            date: PropTypes.string,
            comment: PropTypes.string
        })
    )
};

export default ProductReviews; 