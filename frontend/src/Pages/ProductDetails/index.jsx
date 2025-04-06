import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaHeart, FaUtensils } from 'react-icons/fa';
import ProductZoom from '../../components/ProductZoom';
import ProductSummary from '../../components/ProductSummary';
import ProductFeatures from '../../components/ProductFeatures';
import ProductReviews from '../../components/ProductReviews';
import RelatedProducts from './RelatedProducts';

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [servingSize, setServingSize] = useState('medium');
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('features');
    const [specialInstructions, setSpecialInstructions] = useState('');

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
                ]
            };
            
            setProduct(mockProduct);
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

    const addToCart = () => {
        // Logic to add to cart
        console.log('Added to order:', { 
            product, 
            quantity, 
            servingSize,
            specialInstructions,
            total: calculateTotalPrice()
        });
        
        // Here you would dispatch to your cart state/store
    };

    const calculateTotalPrice = () => {
        if (!product) return 0;
        
        const basePrice = product.discount > 0 
            ? product.price * (1 - product.discount / 100) 
            : product.price;
            
        const sizeMultiplier = product.servingSizes.find(size => size.id === servingSize)?.priceMultiplier || 1;
        
        return (basePrice * sizeMultiplier * quantity).toFixed(2);
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
                            <ProductSummary product={product} />
                            
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
                                    className="px-6 py-3 flex-1 border-2 border-yumrun-primary text-yumrun-primary font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-yumrun-primary hover:text-white transition-colors"
                                >
                                    <FaHeart /> Save for Later
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Details Tabs */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="mb-4 border-b border-gray-200">
                        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                            <li className="mr-2">
                                <button
                                    className={`inline-block p-4 border-b-2 rounded-t-lg ${
                                        activeTab === 'features'
                                            ? 'text-yumrun-primary border-yumrun-primary'
                                            : 'border-transparent hover:text-gray-600 hover:border-gray-300'
                                    }`}
                                    onClick={() => setActiveTab('features')}
                                >
                                    Ingredients & Nutrition
                                </button>
                            </li>
                            <li className="mr-2">
                                <button
                                    className={`inline-block p-4 border-b-2 rounded-t-lg ${
                                        activeTab === 'reviews'
                                            ? 'text-yumrun-primary border-yumrun-primary'
                                            : 'border-transparent hover:text-gray-600 hover:border-gray-300'
                                    }`}
                                    onClick={() => setActiveTab('reviews')}
                                >
                                    Reviews
                                </button>
                            </li>
                        </ul>
                    </div>
                    
                    <div className="p-4">
                        {activeTab === 'features' && (
                            <ProductFeatures 
                                features={product.features}
                                nutritionalInfo={product.nutritionalInfo}
                            />
                        )}
                        
                        {activeTab === 'reviews' && (
                            <ProductReviews productId={id} />
                        )}
                    </div>
                </div>

                {/* Related Products */}
                <div className="mt-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended Add-ons</h2>
                    <RelatedProducts />
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
