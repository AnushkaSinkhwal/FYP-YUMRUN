import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaPhone, FaClock, FaUtensils, FaTag, FaHeart, FaRegHeart } from 'react-icons/fa';
import { IoFastFood } from 'react-icons/io5';
import axios from 'axios';
import { 
    Container, Button, Alert, Spinner, Tabs, TabsList, 
    TabsTrigger, TabsContent, Card, Badge 
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import NutritionalInfo from '../../components/ProductFeatures/NutritionalInfo';

const RestaurantDetails = () => {
    const { id: restaurantId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    
    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [menuLoading, setMenuLoading] = useState(true);
    const [error, setError] = useState(null);
    const [menuError, setMenuError] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const [categories, setCategories] = useState([]);
    
    // Fetch restaurant data
    useEffect(() => {
        const fetchRestaurantData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`/api/restaurants/${restaurantId}`);
                if (response.data.success) {
                    setRestaurant(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to fetch restaurant details');
                }
            } catch (err) {
                console.error('Error fetching restaurant details:', err);
                setError(err.response?.data?.message || 'An error occurred while loading restaurant data');
            } finally {
                setLoading(false);
            }
        };

        if (restaurantId) {
            fetchRestaurantData();
        }
    }, [restaurantId]);

    // Fetch menu items
    useEffect(() => {
        const fetchMenuItems = async () => {
            setMenuLoading(true);
            setMenuError(null);
            try {
                const response = await axios.get(`/api/restaurants/${restaurantId}/menu`);
                if (response.data.success) {
                    const items = response.data.data || [];
                    setMenuItems(items);
                    
                    // Extract unique categories
                    const uniqueCategories = [...new Set(items.map(item => item.category))];
                    setCategories(uniqueCategories);
                    
                    // Set first category as active if available
                    if (uniqueCategories.length > 0 && !activeCategory) {
                        setActiveCategory(uniqueCategories[0]);
                    }
                } else {
                    setMenuError(response.data.message || 'Failed to fetch menu items');
                }
            } catch (err) {
                console.error('Error fetching menu items:', err);
                setMenuError(err.response?.data?.message || 'An error occurred while loading menu items');
            } finally {
                setMenuLoading(false);
            }
        };

        if (restaurantId) {
            fetchMenuItems();
        }
    }, [restaurantId, activeCategory]);

    // Check favorite status if user is authenticated
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (!isAuthenticated || !restaurantId) return;
            
            try {
                const response = await axios.get(`/api/favorites/check-restaurant/${restaurantId}`);
                if (response.data.success) {
                    setIsFavorite(response.data.data.isFavorite);
                }
            } catch (error) {
                console.error('Error checking favorite status:', error);
            }
        };
        
        checkFavoriteStatus();
    }, [isAuthenticated, restaurantId]);

    // Toggle favorite status
    const toggleFavorite = async () => {
        if (!isAuthenticated) {
            navigate('/signin', { state: { from: `/restaurant/${restaurantId}` } });
            return;
        }
        
        setFavoriteLoading(true);
        try {
            if (isFavorite) {
                await axios.delete(`/api/favorites/restaurant/${restaurantId}`);
            } else {
                await axios.post('/api/favorites/restaurant', { restaurantId });
            }
            setIsFavorite(!isFavorite);
        } catch (error) {
            console.error('Error toggling favorite status:', error);
        } finally {
            setFavoriteLoading(false);
        }
    };

    // Add item to cart
    const handleAddToCart = (item) => {
        addToCart({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            restaurant: restaurant?.name || '',
            restaurantId: restaurantId
        }, 1);
    };

    // Format opening hours
    const formatOpeningHours = (hours) => {
        if (!hours) return 'Hours not available';
        
        const today = new Date().toLocaleLowerCase();
        const dayOfWeek = today.split(' ')[0];
        
        const todayHours = hours[dayOfWeek];
        if (!todayHours) return 'Hours not available for today';
        
        return `Today: ${todayHours.open} - ${todayHours.close}`;
    };

    // Loading state
    if (loading) {
        return (
            <Container className="flex items-center justify-center min-h-[60vh]">
                <Spinner size="xl" />
            </Container>
        );
    }

    // Error state
    if (error) {
        return (
            <Container className="py-8">
                <Alert variant="error" className="mb-4">
                    {error}
                </Alert>
                <Button onClick={() => navigate('/')}>
                    Return to Home
                </Button>
            </Container>
        );
    }

    // If we have restaurant data
    return (
        <div className="pb-16">
            {/* Restaurant Header/Banner */}
            <div className="relative h-64 md:h-80 bg-gray-200">
                <img 
                    src={restaurant?.coverImage || `https://source.unsplash.com/random/1200x400/?restaurant,food,${encodeURIComponent(restaurant?.name || '')}`} 
                    alt={restaurant?.name}
                    className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                <Container className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-start justify-between">
                        <div className="text-white">
                            <h1 className="text-3xl font-bold">{restaurant?.name}</h1>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                <div className="flex items-center">
                                    <FaStar className="mr-1 text-yellow-400" />
                                    <span>{restaurant?.rating?.toFixed(1) || '0.0'}</span>
                                </div>
                                {restaurant?.cuisine && (
                                    <div className="flex flex-wrap gap-1">
                                        {restaurant.cuisine.map((type, index) => (
                                            <Badge key={index} variant="outline" className="bg-white/20 text-white">
                                                {type}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center">
                                    <FaMapMarkerAlt className="mr-1 text-gray-300" />
                                    <span className="text-sm">{restaurant?.address}</span>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-white/20"
                            onClick={toggleFavorite}
                            disabled={favoriteLoading}
                        >
                            {isFavorite ? <FaHeart className="mr-2 text-red-500" /> : <FaRegHeart className="mr-2" />}
                            {isFavorite ? 'Saved' : 'Save'}
                        </Button>
                    </div>
                </Container>
            </div>
            
            {/* Restaurant Info & Menu */}
            <Container className="py-6">
                {/* Restaurant Info */}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <Card className="p-6">
                            <h2 className="mb-4 text-xl font-semibold">About {restaurant?.name}</h2>
                            <p className="mb-6 text-gray-600">{restaurant?.description}</p>
                            
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="flex items-center gap-2">
                                    <FaPhone className="text-gray-400" />
                                    <span>{restaurant?.phone || 'Phone not available'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaClock className="text-gray-400" />
                                    <span>{formatOpeningHours(restaurant?.openingHours)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaTag className="text-gray-400" />
                                    <span>Min. Order: ${restaurant?.minimumOrder?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <IoFastFood className="text-gray-400" />
                                    <span>Delivery Fee: ${restaurant?.deliveryFee?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                    
                    <div>
                        <Card className="p-6">
                            <h2 className="mb-4 text-xl font-semibold">Opening Hours</h2>
                            {restaurant?.openingHours ? (
                                <dl className="space-y-2">
                                    {Object.entries(restaurant.openingHours).map(([day, hours]) => (
                                        <div key={day} className="flex justify-between">
                                            <dt className="font-medium capitalize">{day}</dt>
                                            <dd>{hours.open} - {hours.close}</dd>
                                        </div>
                                    ))}
                                </dl>
                            ) : (
                                <p className="text-gray-500">Opening hours not available</p>
                            )}
                        </Card>
                    </div>
                </div>
                
                {/* Menu Section */}
                <div className="mt-8">
                    <h2 className="mb-6 text-2xl font-bold">Menu</h2>
                    
                    {menuLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Spinner size="lg" />
                        </div>
                    ) : menuError ? (
                        <Alert variant="error" className="mb-4">
                            {menuError}
                        </Alert>
                    ) : menuItems.length === 0 ? (
                        <div className="py-8 text-center">
                            <FaUtensils className="mx-auto mb-4 text-4xl text-gray-300" />
                            <p className="text-gray-500">No menu items available</p>
                        </div>
                    ) : (
                        <>
                            {/* Category Tabs */}
                            <Tabs defaultValue={activeCategory} onValueChange={setActiveCategory}>
                                <TabsList className="mb-6">
                                    {categories.map((category) => (
                                        <TabsTrigger key={category} value={category}>
                                            {category}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                
                                {categories.map((category) => (
                                    <TabsContent key={category} value={category}>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            {menuItems
                                                .filter(item => item.category === category)
                                                .map(item => (
                                                    <Card key={item.id} className="overflow-hidden">
                                                        <div className="relative h-48 bg-gray-200">
                                                            <img 
                                                                src={item.image || `https://source.unsplash.com/random/300x200/?food,${encodeURIComponent(item.name)}`} 
                                                                alt={item.name}
                                                                className="object-cover w-full h-full"
                                                                onError={(e) => {
                                                                    e.target.src = `https://source.unsplash.com/random/300x200/?food`;
                                                                }}
                                                            />
                                                            {item.discount > 0 && (
                                                                <Badge className="absolute top-2 right-2 bg-red-500">
                                                                    {item.discount}% OFF
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="p-4">
                                                            <div className="flex items-start justify-between">
                                                                <h3 className="text-lg font-semibold">{item.name}</h3>
                                                                <div className="text-lg font-bold">
                                                                    ${item.price.toFixed(2)}
                                                                </div>
                                                            </div>
                                                            <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                                                                {item.description}
                                                            </p>
                                                            
                                                            {item.nutritionalInfo && (
                                                                <div className="mt-3">
                                                                    <NutritionalInfo nutritionalData={item.nutritionalInfo} className="text-xs" />
                                                                </div>
                                                            )}
                                                            
                                                            <Button 
                                                                className="w-full mt-4"
                                                                onClick={() => handleAddToCart(item)}
                                                            >
                                                                Add to Cart
                                                            </Button>
                                                        </div>
                                                    </Card>
                                                ))}
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </>
                    )}
                </div>
            </Container>
        </div>
    );
};

export default RestaurantDetails; 