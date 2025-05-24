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
import { IoIosMail } from "react-icons/io";
import { useEffect, useState, useRef } from 'react';
import { Container, Button, Alert, Spinner, Card, Badge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt } from "react-icons/fa";
import { publicAPI, userAPI } from "../../utils/api";
import { ArrowPathIcon as RefreshIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { PLACEHOLDERS, getFullImageUrl } from '../../utils/imageUtils';
import axios from 'axios';

const Home = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isLoaded, setIsLoaded] = useState(false);
    const [userRecommendations, setUserRecommendations] = useState([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [recommendationsError, setRecommendationsError] = useState(null);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [newProducts, setNewProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [productsError, setProductsError] = useState(null);
    const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
    const [loadingRestaurants, setLoadingRestaurants] = useState(true);
    const [restaurantsError, setRestaurantsError] = useState(null);
    
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    const recommendationsRef = useRef(null);
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
        if (recommendationsRef.current) observer.observe(recommendationsRef.current);
        if (bestSellersRef.current) observer.observe(bestSellersRef.current);
        if (newProductsRef.current) observer.observe(newProductsRef.current);
        if (bannersRef.current) observer.observe(bannersRef.current);
        if (newsletterRef.current) observer.observe(newsletterRef.current);
        if (featuredRestaurantsRef.current) observer.observe(featuredRestaurantsRef.current);

        return () => {
            if (recommendationsRef.current) observer.unobserve(recommendationsRef.current);
            if (bestSellersRef.current) observer.unobserve(bestSellersRef.current);
            if (newProductsRef.current) observer.unobserve(newProductsRef.current);
            if (bannersRef.current) observer.unobserve(bannersRef.current);
            if (newsletterRef.current) observer.unobserve(newsletterRef.current);
            if (featuredRestaurantsRef.current) observer.unobserve(featuredRestaurantsRef.current);
        };
    }, []);

    // Always fetch recommendations, regardless of user login status
    useEffect(() => {
        fetchUserRecommendations();
    }, [currentUser]);

    // Function to fetch user recommendations using the new API endpoint
    const fetchUserRecommendations = async () => {
        if (!currentUser) {
            // If no user is logged in, set empty recommendations and no error
            setUserRecommendations([]);
            setRecommendationsError(null);
            setLoadingRecommendations(false);
            return;
        }
        
        setLoadingRecommendations(true);
        setRecommendationsError(null);
        
        try {
            console.log('Fetching personalized recommendations...');
            // Use the authenticated userAPI call
            const response = await userAPI.getRecommendations(); 
            console.log('Recommendations API response:', response);
            
            // Check structure and success
            if (response?.data?.success && Array.isArray(response.data.data)) {
                if (response.data.data.length > 0) {
                    // We have personalized recommendations
                    setUserRecommendations(response.data.data);
                } else {
                    console.log('No personalized recommendations found for user. Using fallback recommendations.');
                    
                    // Use featured items as fallback if no personalized recommendations exist
                    if (featuredProducts.length > 0) {
                        const fallbackRecommendations = [...featuredProducts.slice(0, 4)].map(item => ({
                            ...item,
                            isFallbackRecommendation: true  // Flag to identify fallback recommendations
                        }));
                        setUserRecommendations(fallbackRecommendations);
                    } else {
                        // If no featured products, try to fetch some generic ones
                        try {
                            const fallbackResponse = await fetch('/api/menu?limit=4&sort=rating');
                            if (fallbackResponse.ok) {
                                const fallbackData = await fallbackResponse.json();
                                if (fallbackData.success && Array.isArray(fallbackData.data) && fallbackData.data.length > 0) {
                                    // Process the fallback items similar to how we process menu items
                                    const fallbackRecommendations = fallbackData.data.map(item => ({
                                        id: item._id || item.id,
                                        name: item.name || item.item_name,
                                        restaurant: item.restaurant || { name: 'Popular Restaurant' },
                                        image: item.image || item.imageUrl || 'uploads/placeholders/food-placeholder.jpg',
                                        price: item.price || item.item_price,
                                        averageRating: item.averageRating || 4.5,
                                        isFallbackRecommendation: true
                                    }));
                                    setUserRecommendations(fallbackRecommendations);
                                } else {
                                    setUserRecommendations([]);
                                }
                            } else {
                                setUserRecommendations([]);
                            }
                        } catch (fallbackError) {
                            console.error('Error fetching fallback recommendations:', fallbackError);
                            setUserRecommendations([]);
                        }
                    }
                }
            } else {
                // Handle unexpected structure or failure
                const errorMsg = response?.data?.error?.message || 'Failed to load recommendations: Invalid response format';
                console.error('Recommendations API error:', errorMsg);
                setRecommendationsError(errorMsg);
                setUserRecommendations([]);
            }
        } catch (error) {
            console.error('Error fetching user recommendations:', error);
            const errorMsg = error.response?.data?.error?.message || 'Failed to load recommendations. Please try again later.';
            setRecommendationsError(errorMsg);
            setUserRecommendations([]);
        } finally {
            setLoadingRecommendations(false);
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
                                createdAt: item.createdAt || new Date().toISOString(),
                            };
                        }).filter(item => item !== null); // Remove null items
                        
                        console.log('Processed menu items:', processedItems.length);
                        
                        if (processedItems.length > 0) {
                            // For featured products (random selection of items)
                            const shuffled = [...processedItems].sort(() => 0.5 - Math.random());
                            const featuredCount = Math.min(shuffled.length, 5);
                            console.log(`Setting ${featuredCount} featured menu items`);
                            // Pick random featured items
                            const featuredList = shuffled.slice(0, featuredCount);
                            setFeaturedProducts(featuredList);
                            
                            // For new products (most recent items by date), excluding featured
                            const sortedByDate = [...processedItems]
                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                            const desiredNewCount = 4;
                            // Exclude any featured items
                            const newList = sortedByDate
                                .filter(item => !featuredList.some(fp => fp.id === item.id))
                                .slice(0, desiredNewCount);
                            console.log(`Setting ${newList.length} new menu items (excluding featured)`);
                            setNewProducts(newList);
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
                // Get featured restaurants
                const response = await publicAPI.getFeaturedRestaurants();
                if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
                    const restaurants = response.data.data;
                    // Fetch active offers for each restaurant
                    const restaurantsWithOffers = await Promise.all(
                        restaurants.map(async (r) => {
                            try {
                                const resOffers = await axios.get(`/api/offers/restaurant/${r._id || r.id}/public`);
                                if (resOffers.data.success && Array.isArray(resOffers.data.data) && resOffers.data.data.length > 0) {
                                    const offers = resOffers.data.data;
                                    const bestOffer = offers.reduce((max, o) =>
                                        o.discountPercentage > max.discountPercentage ? o : max, offers[0]
                                    );
                                    return { ...r, hasOffer: true, offerPercentage: bestOffer.discountPercentage };
                                }
                            } catch (err) {
                                console.error('Error fetching offers for restaurant', r._id || r.id, err);
                            }
                            return { ...r, hasOffer: false, offerPercentage: 0 };
                        })
                    );
                    setFeaturedRestaurants(restaurantsWithOffers);
                } else {
                    console.log('No featured restaurants returned from API.');
                    setFeaturedRestaurants([]);
                }
            } catch (error) {
                console.error('Error fetching restaurants:', error);
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
            
            {/* Personalized Recommendations Section (Always visible) */}
            <section ref={recommendationsRef} className="py-10 bg-gradient-to-r from-green-50 via-white to-blue-50">
                <Container>
                    <div className="flex flex-col items-start justify-between mb-6 md:flex-row md:items-center">
                        <div>
                            <h2 className="mb-2 text-2xl font-bold text-gray-800">
                                {currentUser ? 'Recommended For You' : 'Recommended Dishes'}
                            </h2>
                            <p className="text-gray-600">
                                {currentUser 
                                    ? userRecommendations.length > 0 && userRecommendations[0].isFallbackRecommendation
                                        ? 'Popular dishes you might enjoy based on trends'
                                        : 'Personalized suggestions based on your profile' 
                                    : 'Popular dishes you might enjoy'}
                            </p>
                            {userRecommendations.length > 0 && userRecommendations[0].isFallbackRecommendation && (
                                <p className="mt-1 text-xs text-amber-600">
                                    These are general recommendations while we learn your preferences
                                </p>
                            )}
                        </div>
                        
                        {currentUser && (
                            <div>
                                <Button onClick={fetchUserRecommendations} disabled={loadingRecommendations}>
                                    <RefreshIcon className={`w-4 h-4 mr-2 ${loadingRecommendations ? 'animate-spin' : ''}`} />
                                    {loadingRecommendations ? 'Refreshing...' : 'Refresh'}
                                </Button>
                            </div>
                        )}
                    </div>

                    {recommendationsError && (
                        <Alert type="error" className="mb-6">
                            {recommendationsError}
                        </Alert>
                    )}

                    {loadingRecommendations ? (
                        <div className="flex justify-center py-10">
                            <Spinner size="lg" />
                        </div>
                    ) : userRecommendations.length > 0 ? (
                        <div>
                            <Swiper
                                slidesPerView={1}
                                spaceBetween={20}
                                navigation={windowWidth >= 768} // Show nav on larger screens
                                pagination={{ clickable: true }}
                                modules={[Navigation, Pagination, Autoplay]}
                                autoplay={{
                                    delay: 8000, // Slower autoplay for recommendations
                                    disableOnInteraction: true, // Stop on interaction
                                }}
                                breakpoints={{
                                    640: { slidesPerView: 2 },
                                    768: { slidesPerView: 3 },
                                    1024: { slidesPerView: 4 } // Show 4 on large screens
                                }}
                                className="py-4 recommendations-swiper"
                            >
                                {userRecommendations.slice(0, 3).map((item) => (
                                    <SwiperSlide key={item.id} className="h-full">
                                        <div className="relative h-full">
                                            {item.isFallbackRecommendation && (
                                                <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                                                    Popular Pick
                                                </div>
                                            )}
                                            <ProductItem 
                                                id={item.id}
                                                name={item.name} 
                                                restaurant={{ id: item.restaurant?.id, name: item.restaurant?.name }}
                                                location={item.restaurant?.name || 'Unknown Restaurant'} 
                                                rating={item.averageRating || 0}
                                                oldPrice={item.oldPrice}
                                                newPrice={item.price}
                                                offerDetails={item.offerDetails}
                                                price={item.price}
                                                image={item.image} 
                                                isRecommendation={!item.isFallbackRecommendation}
                                                isTrendingItem={item.isFallbackRecommendation}
                                                className="h-full"
                                            />
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    ) : (!loadingRecommendations && !recommendationsError) ? (
                        <div className="py-8 text-center bg-white border border-gray-200 rounded-lg shadow-sm">
                            <InformationCircleIcon className="w-12 h-12 mx-auto text-gray-400"/>
                            {currentUser ? (
                                <>
                                    <p className="mt-4 text-gray-600">No specific recommendations found for you right now.</p>
                                    <p className="text-sm text-gray-500">Try adding items to favorites or ordering something new!</p>
                                </>
                            ) : (
                                <>
                                    <p className="mt-4 text-gray-600">Sign in to get personalized recommendations!</p>
                                    <div className="mt-4">
                                        <Button onClick={() => navigate('/signin')} className="mx-2">
                                            Sign In
                                        </Button>
                                        <Button variant="outline" onClick={() => navigate('/signup')} className="mx-2">
                                            Sign Up
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </Container>
            </section>
            
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
                                        onClick={() => navigate('/menu')}
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
                                                        restaurant={{ id: product.restaurant?.id, name: product.restaurant?.name }}
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
                                        onClick={() => navigate('/menu')}
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
                                                    restaurant={{ id: product.restaurant?.id, name: product.restaurant?.name }}
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
                                                        {/* Offer Badge */}
                                                        {restaurant.hasOffer && (
                                                            <Badge variant="danger" className="absolute top-2 right-2 z-10">
                                                                {restaurant.offerPercentage}% OFF
                                                            </Badge>
                                                        )}
                                                        {loadingRestaurants ? (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                                                <div className="w-10 h-10 border-4 rounded-full border-yumrun-primary border-t-transparent animate-spin"></div>
                                                            </div>
                                                        ) : null}
                                                        <img 
                                                            src={
                                                                restaurant.coverImage
                                                                    ? getFullImageUrl(restaurant.coverImage)
                                                                    : restaurant.logo
                                                                        ? getFullImageUrl(restaurant.logo)
                                                                        : restaurant.image
                                                                            ? getFullImageUrl(restaurant.image)
                                                                            : defaultRestaurantImage
                                                            }
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
                                                                e.target.src = getFullImageUrl(PLACEHOLDERS.RESTAURANT);
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
