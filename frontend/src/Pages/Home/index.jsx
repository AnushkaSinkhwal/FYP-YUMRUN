import HomeBanner from "../../components/HomeBanner";
import banner1 from "../../assets/images/banner1.jpg";
import banner2 from "../../assets/images/banner2.jpg";
import banner5 from "../../assets/images/banner5.jpg";
import { FaLongArrowAltRight } from "react-icons/fa";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import ProductItem from "../../components/ProductItem";
import HomeCat from "../../components/HomeCat";
import { IoIosMail } from "react-icons/io";
import { useEffect, useState, useRef } from 'react';
import { Container, Button, Alert, Spinner, Card } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt } from "react-icons/fa";
import { publicAPI } from "../../utils/api";
import { ArrowPathIcon as RefreshIcon, InformationCircleIcon, NoSymbolIcon as BanIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { PLACEHOLDERS } from '../../utils/imageUtils';

// Function to format health condition for display
const formatHealthCondition = (condition) => {
    if (!condition) return '';
    return condition.charAt(0).toUpperCase() + condition.slice(1);
};

const Home = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isLoaded, setIsLoaded] = useState(false);
    const [healthRecommendations, setHealthRecommendations] = useState([]);
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [newProducts, setNewProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [productsError, setProductsError] = useState(null);
    const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
    const [loadingRestaurants, setLoadingRestaurants] = useState(true);
    const [restaurantsError, setRestaurantsError] = useState(null);
    
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    const bestSellersRef = useRef(null);
    const newProductsRef = useRef(null);
    const bannersRef = useRef(null);
    const newsletterRef = useRef(null);
    const featuredRestaurantsRef = useRef(null);

    // Default fallback image - use imported PLACEHOLDERS
    const defaultRestaurantImage = PLACEHOLDERS.RESTAURANT;

    // Handle window resize for responsive design
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        
        // Set loaded after a small delay to allow for animations
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 300);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, []);

    // Scroll animations using Intersection Observer
    useEffect(() => {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, options);

        // Observe all refs if they exist
        if (bestSellersRef.current) observer.observe(bestSellersRef.current);
        if (newProductsRef.current) observer.observe(newProductsRef.current);
        if (bannersRef.current) observer.observe(bannersRef.current);
        if (newsletterRef.current) observer.observe(newsletterRef.current);

        return () => {
            if (bestSellersRef.current) observer.unobserve(bestSellersRef.current);
            if (newProductsRef.current) observer.unobserve(newProductsRef.current);
            if (bannersRef.current) observer.unobserve(bannersRef.current);
            if (newsletterRef.current) observer.unobserve(newsletterRef.current);
        };
    }, []);

    // Fetch health-focused recommendations based on user's health condition
    useEffect(() => {
        if (currentUser && currentUser.healthCondition) {
            fetchHealthRecommendations(currentUser.healthCondition);
        }
    }, [currentUser]);

    // Function to fetch health recommendations
    const fetchHealthRecommendations = async (healthCondition) => {
        setLoadingRecs(true);
        
        try {
            // Use the proper backend API endpoint
            const response = await fetch(`/api/recommendations/health?condition=${healthCondition || 'Healthy'}`);
            
            if (!response.ok) {
                setHealthRecommendations([]);
                console.error(`Health recommendations API error: ${response.status} ${response.statusText}`);
                return;
            }
            
            const data = await response.json();
            
            if (data && data.data && Array.isArray(data.data.recommendations)) {
                setHealthRecommendations(data.data.recommendations);
            } else {
                // Use fallback data if response format is incorrect
                setHealthRecommendations([
                    {
                        id: 'healthy-1',
                        name: 'Green Salad Bowl',
                        description: 'Fresh mixed greens with seasonal vegetables',
                        calories: 250,
                        protein: 10,
                        healthBenefits: ['Rich in vitamins', 'High fiber', 'Low calories'],
                        image: '/uploads/placeholders/food-placeholder.jpg'
                    },
                    {
                        id: 'healthy-2',
                        name: 'Grilled Chicken',
                        description: 'Lean protein with herbs and spices',
                        calories: 320,
                        protein: 30,
                        healthBenefits: ['High protein', 'Low fat', 'No added sugar'],
                        image: '/uploads/placeholders/food-placeholder.jpg'
                    }
                ]);
                console.warn('Using fallback recommendations due to invalid API response format');
            }
        } catch (error) {
            console.error('Error fetching health recommendations:', error);
            // Use fallback data on error
            setHealthRecommendations([
                {
                    id: 'healthy-1',
                    name: 'Green Salad Bowl',
                    description: 'Fresh mixed greens with seasonal vegetables',
                    calories: 250,
                    protein: 10,
                    healthBenefits: ['Rich in vitamins', 'High fiber', 'Low calories'],
                    image: '/uploads/placeholders/food-placeholder.jpg'
                },
                {
                    id: 'healthy-2',
                    name: 'Grilled Chicken',
                    description: 'Lean protein with herbs and spices',
                    calories: 320,
                    protein: 30,
                    healthBenefits: ['High protein', 'Low fat', 'No added sugar'],
                    image: '/uploads/placeholders/food-placeholder.jpg'
                }
            ]);
            console.warn('Using fallback recommendations due to API error');
        } finally {
            setLoadingRecs(false);
        }
    };

    // Fetch menu items from API
    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                setLoadingProducts(true);
                setProductsError(null);
                
                console.log('Fetching menu items for homepage...');
                const response = await fetch('/api/menu');
                console.log('Menu API response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Menu data received:', data);
                    
                    if (data.success) {
                        // Process the menu items
                        const allItems = data.data || [];
                        console.log('Number of menu items received:', allItems.length);
                        
                        if (allItems.length === 0) {
                            console.warn('No menu items returned from API');
                            setFeaturedProducts([]);
                            setNewProducts([]);
                            setLoadingProducts(false);
                            return;
                        }
                        
                        // Process each item to ensure discount and price data is correctly formatted
                        const processedItems = allItems.map(item => {
                            console.log('Processing menu item:', {
                                id: item._id || item.id,
                                name: item.name || item.item_name,
                                image: item.image
                            });
                            
                            // Skip items without essential data
                            if (!item || (!item.name && !item.item_name) || (!item.price && !item.item_price)) {
                                console.warn('Skipping item due to missing essential data');
                                return null;
                            }
                            
                            // Force check if we need to find a restaurant name
                            let restaurantName = "Unknown Restaurant";
                            let restaurantId = null;
                            
                            if (item.restaurant && typeof item.restaurant === 'object') {
                                restaurantId = item.restaurant.id || item.restaurant._id || null;
                                if (item.restaurant.name && item.restaurant.name !== 'Unknown Restaurant') {
                                    restaurantName = item.restaurant.name;
                                }
                            }
                            
                            const price = Number(item.price || item.item_price || 0);
                            const discount = Number(item.discount || 0);
                            const discountedPrice = discount > 0 
                                ? (price * (1 - discount / 100)).toFixed(2)
                                : price.toString();
                            
                            return {
                                id: item._id || item.id,
                                name: item.name || item.item_name,
                                description: item.description || '',
                                // Use the direct image path from database - getFullImageUrl will be applied in ProductItem
                                image: item.image || item.imageUrl || 'uploads/placeholders/food-placeholder.jpg',
                                // Only include oldPrice if there's a valid discount
                                oldPrice: discount > 0 ? price.toString() : null,
                                // If there's a discount, use the calculated price
                                price: discountedPrice,
                                // Ensure rating is a valid number or null
                                rating: item.averageRating && item.averageRating > 0 ? item.averageRating : 0,
                                // Include the discount percentage
                                discount: discount > 0 ? discount.toString() : '',
                                // Override restaurant data with our validated version
                                restaurant: { 
                                    id: restaurantId, 
                                    name: restaurantName 
                                },
                                location: restaurantName,
                                createdAt: item.createdAt || new Date().toISOString()
                            };
                        }).filter(item => item !== null); // Remove null items
                        
                        console.log('Processed menu items:', processedItems.length);
                        
                        if (processedItems.length > 0) {
                            // For featured products (random selection of items)
                            const shuffled = [...processedItems].sort(() => 0.5 - Math.random());
                            const featuredCount = Math.min(shuffled.length, 5);
                            console.log(`Setting ${featuredCount} featured menu items`);
                            setFeaturedProducts(shuffled.slice(0, featuredCount));
                            
                            // For new products (most recent items by date)
                            const sortedByDate = [...processedItems].sort((a, b) => 
                                new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
                            );
                            const newCount = Math.min(sortedByDate.length, 4);
                            console.log(`Setting ${newCount} new menu items`);
                            setNewProducts(sortedByDate.slice(0, newCount));
                        } else {
                            console.warn('No valid menu items after processing');
                            setFeaturedProducts([]);
                            setNewProducts([]);
                        }
                    } else {
                        console.error('API returned error:', data.message);
                        setProductsError(data.message || 'Failed to load menu items');
                        setFeaturedProducts([]);
                        setNewProducts([]);
                    }
                } else {
                    // If API fails
                    console.error('API request failed with status:', response.status);
                    setProductsError('Failed to fetch menu items. Server returned an error.');
                    setFeaturedProducts([]);
                    setNewProducts([]);
                }
            } catch (error) {
                console.error('Error fetching menu items:', error);
                setProductsError('Failed to load menu items. Please try again later.');
                setFeaturedProducts([]);
                setNewProducts([]);
            } finally {
                setLoadingProducts(false);
            }
        };
        
        fetchMenuItems();
    }, []);

    // Fetch featured restaurants
    useEffect(() => {
        const fetchRestaurants = async () => {
            setLoadingRestaurants(true);
            setRestaurantsError(null);
            
            try {
                // Use publicAPI from api.js
                const response = await publicAPI.getFeaturedRestaurants();
                
                if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
                    setFeaturedRestaurants(response.data.data);
                } else {
                    // Handle cases where API returns success:true but empty data
                    console.log('No featured restaurants returned from API.');
                    setFeaturedRestaurants([]); // Show empty state
                }
            } catch (error) {
                console.error('Error fetching restaurants:', error);
                // Show error message and empty state instead of fallback data
                setRestaurantsError('Failed to load featured restaurants.');
                setFeaturedRestaurants([]);
            } finally {
                setLoadingRestaurants(false);
            }
        };
        
        fetchRestaurants();
    }, [currentUser]);

    // Determine number of slides based on screen width
    const getSlidesPerView = () => {
        if (windowWidth < 576) return 1.2;
        if (windowWidth < 768) return 2.2;
        if (windowWidth < 992) return 2.8;
        return 4;
    };

    return (
        <div className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            {/* Hero Banner Section */}
            <div className="w-full">
                <HomeBanner/>
            </div>
            
            {/* Food Categories Section */}
            <HomeCat/>
            
            {/* Health Recommendations Section (Conditional) */}
            {currentUser?.healthCondition && (loadingRecs || healthRecommendations.length > 0) && (
                <section className="py-10 bg-gradient-to-r from-green-50 to-blue-50">
                    <Container>
                        <div className="flex flex-col items-start justify-between mb-6 md:flex-row md:items-center">
                            <div>
                                <h2 className="mb-2 text-2xl font-bold text-gray-800">Health Recommendations</h2>
                                <p className="text-gray-600">Personalized for your health profile</p>
                            </div>
                            
                            <div>
                                <Button onClick={() => fetchHealthRecommendations(currentUser.healthCondition)}>
                                    <RefreshIcon className="w-4 h-4 mr-2" /> Refresh
                                </Button>
                            </div>
                        </div>

                        <Alert type="info" className="mb-6">
                            <div className="flex">
                                <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-400" />
                                <div>
                                    <span className="font-medium">Health insights:</span> These recommendations are based on your health condition: <span className="font-medium">{formatHealthCondition(currentUser.healthCondition)}</span>
                                </div>
                            </div>
                        </Alert>

                        {loadingRecs ? (
                            <div className="flex justify-center py-10">
                                <Spinner size="lg" />
                            </div>
                        ) : healthRecommendations.length > 0 ? (
                            <div>
                                <Swiper
                                    slidesPerView={1}
                                    spaceBetween={20}
                                    pagination={{ clickable: true }}
                                    breakpoints={{
                                        640: { slidesPerView: 2 },
                                        1024: { slidesPerView: 3 }
                                    }}
                                    className="py-4"
                                >
                                    {healthRecommendations.map((rec, index) => (
                                        <SwiperSlide key={index}>
                                            <div className="flex flex-col h-full p-5 bg-white rounded-lg shadow-md">
                                                <div className="mb-4">
                                                    {rec.type === 'avoid' ? (
                                                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            <BanIcon className="w-3 h-3 mr-1" /> Avoid
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            <CheckCircleIcon className="w-3 h-3 mr-1" /> Recommended
                                                        </div>
                                                    )}
                                                </div>

                                                {rec.image && (
                                                    <div className="relative w-full h-32 mb-3 overflow-hidden rounded-md bg-gray-50">
                                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                                            <div className="w-8 h-8 border-4 rounded-full border-yumrun-primary border-t-transparent animate-spin"></div>
                                                        </div>
                                                        <img 
                                                            src={rec.image} 
                                                            alt={rec.title || "Health recommendation"}
                                                            className="object-cover w-full h-full transition-opacity duration-500"
                                                            onLoad={(e) => e.target.parentElement.querySelector('div').classList.add('opacity-0')}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = PLACEHOLDERS.FOOD;
                                                            }}
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                )}

                                                <h3 className="mb-2 text-lg font-semibold">{rec.title}</h3>
                                                <p className="flex-grow mb-4 text-sm text-gray-600">{rec.description}</p>
                                                
                                                {rec.productId && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => navigate(`/product/${rec.productId}`)}
                                                        className="mt-auto"
                                                    >
                                                        View Product
                                                    </Button>
                                                )}
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        ) : null }
                    </Container>
                </section>
            )}
            
            <section className="py-10 bg-white">
                <Container>
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                        {/* Left Banner Section - Responsive Banners */}
                        <div className="lg:col-span-3">
                            <div className="space-y-6">
                                <div 
                                    className="overflow-hidden transition-transform duration-300 rounded-lg shadow-sm hover:shadow-md" 
                                    ref={bannersRef}
                                >
                                    <div className="relative overflow-hidden rounded-lg">
                                        <img 
                                            src={banner1}
                                            className="w-full h-auto transition-transform duration-500 hover:scale-105" 
                                            alt="Promotional Banner"
                                            loading="lazy"
                                            onError={(e) => {
                                                console.warn('Banner image failed to load, using fallback');
                                                e.target.src = PLACEHOLDERS.BANNER;
                                            }}
                                        />
                                    </div>
                                </div>
                                <div 
                                    className="overflow-hidden transition-transform duration-300 rounded-lg shadow-sm hover:shadow-md" 
                                    style={{animationDelay: '0.2s'}}
                                >
                                    <div className="relative overflow-hidden rounded-lg">
                                        <img 
                                            src={banner2}
                                            className="w-full h-auto transition-transform duration-500 hover:scale-105" 
                                            alt="Promotional Banner"
                                            loading="lazy"
                                            onError={(e) => {
                                                console.warn('Banner image failed to load, using fallback');
                                                e.target.src = PLACEHOLDERS.BANNER;
                                            }}
                                        />
                                    </div>
                                </div>
                                <div 
                                    className="overflow-hidden transition-transform duration-300 rounded-lg shadow-sm hover:shadow-md" 
                                    style={{animationDelay: '0.4s'}}
                                >
                                    <div className="relative overflow-hidden rounded-lg">
                                        <img 
                                            src={banner5}
                                            className="w-full h-auto transition-transform duration-500 hover:scale-105" 
                                            alt="Promotional Banner"
                                            loading="lazy"
                                            onError={(e) => {
                                                console.warn('Banner image failed to load, using fallback');
                                                e.target.src = PLACEHOLDERS.BANNER;
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Right Section - Products */}
                        <div className="lg:col-span-9">
                            {/* Best Sellers Section */}
                            <div ref={bestSellersRef}>
                                <div className="flex flex-wrap items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">FEATURED MENU ITEMS</h2>
                                        <p className="text-gray-500">Best selling dishes in your area</p>
                                    </div>

                                    <Button 
                                        variant="outline" 
                                        className="flex items-center gap-2 mt-2 sm:mt-0"
                                    >
                                        View All <FaLongArrowAltRight />
                                    </Button>
                                </div>

                                <div className="mb-12">
                                    {loadingProducts ? (
                                        <div className="flex justify-center py-12">
                                            <Spinner size="lg" />
                                        </div>
                                    ) : productsError ? (
                                        <Alert variant="error" className="mb-4">
                                            {productsError}
                                        </Alert>
                                    ) : featuredProducts.length > 0 ? (
                                        <Swiper
                                            slidesPerView={getSlidesPerView()}
                                            spaceBetween={20}
                                            navigation={true}
                                            pagination={{ clickable: true }}
                                            modules={[Navigation, Pagination, Autoplay]}
                                            className="restaurant-swiper"
                                            autoplay={{
                                                delay: 7000,
                                                disableOnInteraction: false,
                                            }}
                                        >
                                            {featuredProducts.map((product) => (
                                                <SwiperSlide key={product.id}>
                                                    <ProductItem 
                                                        id={product.id}
                                                        name={product.name} 
                                                        location={product.restaurant?.name || ''} 
                                                        rating={product.rating || 0}
                                                        oldPrice={product.oldPrice}
                                                        newPrice={product.price}
                                                        imgSrc={product.image}
                                                        image={product.image}
                                                        discount={product.discount}
                                                    />
                                                </SwiperSlide>
                                            ))}
                                        </Swiper>
                                    ) : (
                                        <div className="py-8 text-center">
                                            <p className="text-gray-500">No featured dishes available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* New Products Section */}
                            <div ref={newProductsRef}>
                                <div className="flex flex-wrap items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">NEW PRODUCTS</h2>
                                        <p className="text-gray-500">New arrivals from top restaurants.</p>
                                    </div>

                                    <Button 
                                        variant="outline" 
                                        className="flex items-center gap-2 mt-2 sm:mt-0"
                                    >
                                        View All <FaLongArrowAltRight />
                                    </Button>
                                </div>

                                {loadingProducts ? (
                                    <div className="flex justify-center py-12">
                                        <Spinner size="lg" />
                                    </div>
                                ) : productsError ? (
                                    <Alert variant="error" className="mb-4">
                                        {productsError}
                                    </Alert>
                                ) : newProducts.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                        {newProducts.map((product) => (
                                            <div className="col-span-1" key={product.id}>
                                                <ProductItem 
                                                    id={product.id}
                                                    name={product.name} 
                                                    location={product.restaurant?.name || ''} 
                                                    rating={product.rating || 0}
                                                    oldPrice={product.oldPrice}
                                                    newPrice={product.price}
                                                    imgSrc={product.image}
                                                    image={product.image}
                                                    discount={product.discount}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <p className="text-gray-500">No new dishes available</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Featured Restaurants Section */}
                            <div ref={featuredRestaurantsRef} className="mt-12">
                                <div className="flex flex-wrap items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">FEATURED RESTAURANTS</h2>
                                        <p className="text-sm text-gray-500 sm:text-base">Top-rated restaurants in your area</p>
                                    </div>

                                    <Button 
                                        variant="outline" 
                                        className="flex items-center gap-2 mt-2 sm:mt-0"
                                        onClick={() => navigate('/restaurants')}
                                    >
                                        View All <FaLongArrowAltRight />
                                    </Button>
                                </div>

                                <div className="mb-12">
                                    {loadingRestaurants ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Spinner size="lg" className="text-yumrun-primary" />
                                            <p className="mt-4 text-gray-600">Finding the best restaurants for you...</p>
                                        </div>
                                    ) : restaurantsError ? (
                                        <Alert variant="error" className="mb-4">
                                            {restaurantsError}
                                        </Alert>
                                    ) : featuredRestaurants.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            {featuredRestaurants.map((restaurant) => (
                                                <Card 
                                                    key={restaurant.id} 
                                                    className="overflow-hidden transition-all duration-300 transform hover:shadow-md hover:-translate-y-1"
                                                >
                                                    <div className="relative h-48 bg-gray-100">
                                                        {loadingRestaurants ? (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                                                <div className="w-10 h-10 border-4 rounded-full border-yumrun-primary border-t-transparent animate-spin"></div>
                                                            </div>
                                                        ) : null}
                                                        <img 
                                                            src={restaurant.logo || restaurant.image || defaultRestaurantImage}
                                                            alt={restaurant.name}
                                                            className="object-cover w-full h-full transition-transform duration-300"
                                                            onLoad={(e) => {
                                                                // Hide spinner parent when image loads
                                                                if (e.target.parentElement) {
                                                                    const spinner = e.target.parentElement.querySelector('[class*="animate-spin"]');
                                                                    if (spinner && spinner.parentElement) {
                                                                        spinner.parentElement.style.display = 'none';
                                                                    }
                                                                }
                                                            }}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = '/uploads/placeholders/restaurant-placeholder.jpg';
                                                                // Hide spinner after fallback image is set
                                                                if (e.target.parentElement) {
                                                                    const spinner = e.target.parentElement.querySelector('[class*="animate-spin"]');
                                                                    if (spinner && spinner.parentElement) {
                                                                        spinner.parentElement.style.display = 'none';
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="p-4">
                                                        <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                                                        <div className="flex items-center mt-1 text-sm text-gray-500">
                                                            {restaurant.rating > 0 && (
                                                                <div className="flex items-center mr-3">
                                                                    <FaStar className="mr-1 text-yellow-400" />
                                                                    <span>{restaurant.rating.toFixed(1)}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex flex-wrap gap-1 my-1">
                                                                {Array.isArray(restaurant.cuisine) && restaurant.cuisine.slice(0, 3).map((type, index) => (
                                                                    <span key={index} className="px-2 py-0.5 bg-gray-100 text-xs rounded-full">
                                                                        {type}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                                            <FaMapMarkerAlt className="text-gray-400" />
                                                            <span className="truncate">{restaurant.address}</span>
                                                        </div>
                                                        <Button 
                                                            className="w-full mt-4"
                                                            onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                                                        >
                                                            View Menu
                                                        </Button>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg bg-gray-50">
                                            <p className="text-gray-500">No featured restaurants available at this time.</p>
                                            <Button 
                                                variant="link" 
                                                className="mt-2" 
                                                onClick={() => navigate('/restaurants')}
                                            >
                                                Browse all restaurants
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Newsletter Subscription Section */}
                    <div 
                        ref={newsletterRef}
                        className="px-6 py-8 mt-12 rounded-lg shadow-md md:px-10 md:py-10 bg-gradient-to-r from-yumrun-primary/90 to-yumrun-primary"
                    >
                        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                            <div className="text-white md:w-1/2">
                                <h2 className="mb-2 text-2xl font-bold md:text-3xl">Subscribe to Our Newsletter</h2>
                                <p className="opacity-90">Stay updated with our latest offers, promotions, and food trends</p>
                            </div>
                            
                            <div className="w-full md:w-1/2">
                                <form onSubmit={(e) => e.preventDefault()} className="w-full">
                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <div className="relative flex-grow">
                                            <input 
                                                type="email" 
                                                placeholder="Your email address" 
                                                className="w-full px-4 py-3 border-0 rounded-md focus:ring-2 focus:ring-white/50 focus:outline-none"
                                                aria-label="Email address"
                                                required
                                            />
                                            <IoIosMail className="absolute text-xl text-gray-400 transform -translate-y-1/2 right-3 top-1/2" aria-hidden="true" />
                                        </div>
                                        <Button 
                                            type="submit"
                                            className="px-6 py-3 font-medium bg-white rounded-md hover:bg-gray-100 text-yumrun-primary focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-yumrun-primary"
                                        >
                                            Subscribe
                                        </Button>
                                    </div>
                                </form>
                                <p className="mt-2 text-xs text-white/80">
                                    By subscribing, you agree to our Terms of Service and Privacy Policy
                                </p>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>
        </div>
    );
};

export default Home;
