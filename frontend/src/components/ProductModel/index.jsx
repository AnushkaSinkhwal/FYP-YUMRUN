import { useContext, useState, useEffect } from 'react';
import { IoCartSharp } from "react-icons/io5";
import { MdClose } from "react-icons/md";
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { MyContext } from '../../App';
import ProductZoom from '../ProductZoom';
import axios from 'axios';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Spinner } from '../ui';
import { cn } from '../../lib/utils';

const ProductModel = ({ productId }) => {
    const context = useContext(MyContext);
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        // Only fetch if the modal is open and we have a productId
        if (context.isOpenProductModel && productId) {
            fetchProductDetails(productId);
        }
    }, [context.isOpenProductModel, productId]);
    
    const fetchProductDetails = async (id) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.get(`/api/menu/${id}`);
            
            if (response.data.success) {
                setProduct(response.data.data);
            } else {
                setError('Failed to fetch product details');
            }
        } catch (err) {
            console.error('Error fetching product details:', err);
            setError('Error loading product. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleAddToCart = () => {
        if (!product) return;
        
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            rating: product.rating || 0,
            restaurant: product.restaurant?.name || ''
        }, quantity);
        
        // Close the modal after adding to cart
        context.setIsOpenProductModel(false);
    };
    
    const handleOrderNow = () => {
        // Add to cart first
        handleAddToCart();
        
        // Then redirect to cart page
        window.location.href = '/cart';
    };
    
    const handleClose = () => {
        context.setIsOpenProductModel(false);
    };
    
    // Function to render star rating
    const renderRating = (value) => {
        const fullStars = Math.floor(value);
        const hasHalfStar = value % 1 >= 0.5;
        
        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    i < fullStars ? (
                        <FaStar key={i} className="text-yellow-400 w-4 h-4" />
                    ) : i === fullStars && hasHalfStar ? (
                        <FaStarHalfAlt key={i} className="text-yellow-400 w-4 h-4" />
                    ) : (
                        <FaRegStar key={i} className="text-yellow-400 w-4 h-4" />
                    )
                ))}
                <span className="ml-1 text-sm font-medium text-gray-600">{value || 0}</span>
            </div>
        );
    };
    
    // Quantity control component
    const QuantityControl = ({ value, onChange }) => {
        const decrement = () => {
            if (value > 1) onChange(value - 1);
        };
        
        const increment = () => {
            onChange(value + 1);
        };
        
        return (
            <div className="flex items-center space-x-2">
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    onClick={decrement}
                    disabled={value <= 1}
                >
                    -
                </Button>
                <span className="w-8 text-center font-medium">{value}</span>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    onClick={increment}
                >
                    +
                </Button>
            </div>
        );
    };
    
    // Add PropTypes for QuantityControl component
    QuantityControl.propTypes = {
        value: PropTypes.number.isRequired,
        onChange: PropTypes.func.isRequired
    };

    return (
        <Dialog 
            open={context.isOpenProductModel} 
            onOpenChange={handleClose}
        >
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="relative">
                    <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <MdClose className="h-5 w-5" />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Spinner size="lg" className="text-primary" />
                    </div>
                ) : error ? (
                    <div className="p-6 text-center">
                        <p className="text-red-500">{error}</p>
                        <Button 
                            variant="secondary"
                            className="mt-4" 
                            onClick={handleClose}
                        >
                            Close
                        </Button>
                    </div>
                ) : product ? (
                    <div className="space-y-6">
                        {/* Header section with name and restaurant */}
                        <div>
                            <DialogTitle className="text-2xl font-bold leading-none tracking-tight">
                                {product.name}
                            </DialogTitle>
                            
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                {product.restaurant?.name && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <span className="font-medium mr-1">Restaurant:</span>
                                        <span>{product.restaurant.name}</span>
                                    </div>
                                )}
                                
                                <div className="flex items-center">
                                    {renderRating(product.rating)}
                                </div>
                                
                                {product.isAvailable === false && (
                                    <Badge variant="destructive" className="ml-auto">
                                        Currently Unavailable
                                    </Badge>
                                )}
                            </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Product content - image and details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Product image gallery */}
                            <div className="w-full">
                                <ProductZoom images={product.image ? [product.image] : []} />
                            </div>
                            
                            {/* Product details */}
                            <div className="space-y-6">
                                {/* Price */}
                                <div className="flex items-center gap-2">
                                    {product.oldPrice && (
                                        <span className="text-gray-500 line-through text-sm">
                                            Rs.{product.oldPrice}
                                        </span>
                                    )}
                                    <span className="text-2xl font-bold text-primary">
                                        Rs.{product.price}
                                    </span>
                                </div>
                                
                                {/* Description */}
                                <div>
                                    <h3 className="text-lg font-medium mb-1">Description</h3>
                                    <p className="text-gray-700">{product.description}</p>
                                </div>
                                
                                {/* Nutritional Info Section (if available) */}
                                {(product.calories || product.protein || product.carbs || product.fat) && (
                                    <div>
                                        <h3 className="text-lg font-medium mb-2">Nutritional Information</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {product.calories && (
                                                <div className="bg-gray-50 p-2 rounded-md">
                                                    <div className="text-xs text-gray-500">Calories</div>
                                                    <div className="font-medium">{product.calories} kcal</div>
                                                </div>
                                            )}
                                            {product.protein && (
                                                <div className="bg-gray-50 p-2 rounded-md">
                                                    <div className="text-xs text-gray-500">Protein</div>
                                                    <div className="font-medium">{product.protein}g</div>
                                                </div>
                                            )}
                                            {product.carbs && (
                                                <div className="bg-gray-50 p-2 rounded-md">
                                                    <div className="text-xs text-gray-500">Carbs</div>
                                                    <div className="font-medium">{product.carbs}g</div>
                                                </div>
                                            )}
                                            {product.fat && (
                                                <div className="bg-gray-50 p-2 rounded-md">
                                                    <div className="text-xs text-gray-500">Fat</div>
                                                    <div className="font-medium">{product.fat}g</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Dietary Preferences Section (if available) */}
                                {(product.isVegetarian || product.isVegan || product.isGlutenFree) && (
                                    <div>
                                        <h3 className="text-lg font-medium mb-2">Dietary Information</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {product.isVegetarian && (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Vegetarian
                                                </Badge>
                                            )}
                                            {product.isVegan && (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Vegan
                                                </Badge>
                                            )}
                                            {product.isGlutenFree && (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                    Gluten Free
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Quantity selector */}
                                <div>
                                    <h3 className="text-lg font-medium mb-2">Quantity</h3>
                                    <QuantityControl 
                                        value={quantity} 
                                        onChange={setQuantity} 
                                    />
                                </div>
                                
                                {/* Action buttons */}
                                <div className="flex flex-wrap gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "flex-1 gap-2",
                                            !product.isAvailable && "opacity-50 cursor-not-allowed"
                                        )}
                                        onClick={handleAddToCart}
                                        disabled={!product.isAvailable}
                                    >
                                        <IoCartSharp className="h-4 w-4" />
                                        Add to Cart
                                    </Button>
                                    <Button
                                        variant="default"
                                        className={cn(
                                            "flex-1 gap-2",
                                            !product.isAvailable && "opacity-50 cursor-not-allowed"
                                        )}
                                        onClick={handleOrderNow}
                                        disabled={!product.isAvailable}
                                    >
                                        <IoCartSharp className="h-4 w-4" />
                                        Order Now
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 text-center">
                        <p className="text-gray-500">No product information available</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

// Prop validation
ProductModel.propTypes = {
    productId: PropTypes.string
};

export default ProductModel;
