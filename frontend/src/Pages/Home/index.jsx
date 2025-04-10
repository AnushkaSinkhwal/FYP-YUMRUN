import HomeBanner from "../../components/HomeBanner";
import banner1 from "../../assets/images/banner1.jpg";
import banner2 from "../../assets/images/banner2.jpg";
import banner5 from "../../assets/images/banner5.jpg";
import { FaLongArrowAltRight, FaHeartbeat, FaLeaf, FaSeedling } from "react-icons/fa";
import { GiWheat } from "react-icons/gi";
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
import { FaStar, FaMapMarkerAlt } from 'react-icons/fa';

const Home = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isLoaded, setIsLoaded] = useState(false);
    const [healthRecommendations, setHealthRecommendations] = useState([]);
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [recsError, setRecsError] = useState(null);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [newProducts, setNewProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [productsError, setProductsError] = useState(null);
    const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
    const [loadingRestaurants, setLoadingRestaurants] = useState(true);
    const [restaurantsError, setRestaurantsError] = useState(null);
    
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const bestSellersRef = useRef(null);
    const newProductsRef = useRef(null);
    const healthRecsRef = useRef(null);
    const bannersRef = useRef(null);
    const newsletterRef = useRef(null);
    const featuredRestaurantsRef = useRef(null);

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
        if (user && user.healthCondition) {
            fetchHealthRecommendations(user.healthCondition);
        }
    }, [user]);

    // Function to fetch health recommendations
    const fetchHealthRecommendations = async (healthCondition) => {
        setLoadingRecs(true);
        setRecsError(null);
        
        try {
            // This would be a real API call in production
            const response = await fetch(`/api/recommendations?healthCondition=${healthCondition}`);
            
            // If API is not yet implemented, fall back to mock data
            if (!response.ok) {
                // Fallback to mock data for demo purposes
                await mockFetchRecommendations(healthCondition);
                return;
            }
            
            const data = await response.json();
            
            if (data.success && data.data.recommendations) {
                setHealthRecommendations(data.data.recommendations);
            } else {
                throw new Error(data.error || 'Failed to fetch recommendations');
            }
        } catch (error) {
            console.error('Error fetching health recommendations:', error);
            setRecsError('Unable to load recommendations. Please try again later.');
            // Fallback to mock data for demo purposes
            await mockFetchRecommendations(healthCondition);
        } finally {
            setLoadingRecs(false);
        }
    };
    
    // Mock function for demo purposes - will be replaced by real API in production
    const mockFetchRecommendations = async (healthCondition) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Different recommendations based on health condition
        let recommendations = [];
        
        switch(healthCondition) {
            case "Diabetes":
                recommendations = [
                    {
                        id: 1,
                        name: "Low-Sugar Mediterranean Bowl",
                        restaurant: "Green Garden Cafe",
                        location: "Baluwatar",
                        rating: 4.7,
                        price: "440",
                        healthTag: "Low Glycemic Index",
                        image: "https://source.unsplash.com/random/300x200/?salad"
                    },
                    {
                        id: 2,
                        name: "Protein-Packed Lunch Box",
                        restaurant: "Fitness Fuel",
                        location: "Jhamsikhel",
                        rating: 4.3,
                        price: "390",
                        healthTag: "Sugar-Free",
                        image: "https://source.unsplash.com/random/300x200/?protein"
                    },
                    {
                        id: 3,
                        name: "Green Power Smoothie",
                        restaurant: "Juice Station",
                        location: "Patan",
                        rating: 4.6,
                        price: "220",
                        healthTag: "No Added Sugar",
                        image: "https://source.unsplash.com/random/300x200/?smoothie"
                    }
                ];
                break;
                
            case "Heart Condition":
                recommendations = [
                    {
                        id: 4,
                        name: "Omega-3 Rich Salmon Bowl",
                        restaurant: "Heart Healthy Eats",
                        location: "Durbar Marg",
                        rating: 4.8,
                        price: "520",
                        healthTag: "Low Sodium",
                        image: "https://source.unsplash.com/random/300x200/?salmon"
                    },
                    {
                        id: 5,
                        name: "Oatmeal Breakfast Bowl",
                        restaurant: "Morning Glory",
                        location: "Boudha",
                        rating: 4.5,
                        price: "280",
                        healthTag: "Heart-Friendly",
                        image: "https://source.unsplash.com/random/300x200/?oatmeal"
                    }
                ];
                break;
                
            case "Hypertension":
                recommendations = [
                    {
                        id: 6,
                        name: "DASH Diet Platter",
                        restaurant: "Balanced Bites",
                        location: "Kupondole",
                        rating: 4.6,
                        price: "390",
                        healthTag: "Low Sodium",
                        image: "https://source.unsplash.com/random/300x200/?vegetables"
                    },
                    {
                        id: 7,
                        name: "Potassium-Rich Bowl",
                        restaurant: "Nutrient Cafe",
                        location: "Pulchowk",
                        rating: 4.4,
                        price: "350",
                        healthTag: "BP Friendly",
                        image: "https://source.unsplash.com/random/300x200/?banana"
                    }
                ];
                break;
                
            case "Other":
                recommendations = [
                    {
                        id: 8,
                        name: "Custom Nutrition Bowl",
                        restaurant: "Personalized Plates",
                        location: "Lazimpat",
                        rating: 4.9,
                        price: "450",
                        healthTag: "Customized Nutrition",
                        image: "https://source.unsplash.com/random/300x200/?healthy"
                    }
                ];
                break;
                
            default: // Healthy
                recommendations = [
                    {
                        id: 9,
                        name: "Balanced Macro Bowl",
                        restaurant: "FitFood",
                        location: "Sanepa",
                        rating: 4.7,
                        price: "420",
                        healthTag: "Well-Balanced",
                        image: "https://source.unsplash.com/random/300x200/?bowl"
                    },
                    {
                        id: 10,
                        name: "Protein Power Plate",
                        restaurant: "Muscle Kitchen",
                        location: "Thamel",
                        rating: 4.5,
                        price: "480",
                        healthTag: "High Protein",
                        image: "https://source.unsplash.com/random/300x200/?chicken"
                    }
                ];
                break;
        }
        
        setHealthRecommendations(recommendations);
    };

    // Fetch menu items from API
    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                setLoadingProducts(true);
                setProductsError(null);
                
                // Sample menu items to use as fallback
                const sampleMenuItems = [
                    {
                        id: 'item1',
                        name: 'Classic Margherita Pizza',
                        price: 495,
                        rating: 4.7,
                        restaurant: { name: 'Pizza Palace' },
                        image: 'https://source.unsplash.com/random/300x200/?pizza',
                        discount: '15'
                    },
                    {
                        id: 'item2',
                        name: 'Chicken Momo',
                        price: 280,
                        rating: 4.5,
                        restaurant: { name: 'Momo House' },
                        image: 'https://source.unsplash.com/random/300x200/?dumplings',
                        discount: '10'
                    },
                    {
                        id: 'item3',
                        name: 'Vegetable Biryani',
                        price: 350,
                        rating: 4.3,
                        restaurant: { name: 'Spice Route' },
                        image: 'https://source.unsplash.com/random/300x200/?biryani',
                        discount: '0'
                    },
                    {
                        id: 'item4',
                        name: 'Chicken Burger',
                        price: 320,
                        rating: 4.2,
                        restaurant: { name: 'Burger House' },
                        image: 'https://source.unsplash.com/random/300x200/?burger',
                        discount: '20'
                    },
                    {
                        id: 'item5',
                        name: 'Grilled Fish',
                        price: 550,
                        rating: 4.6,
                        restaurant: { name: 'Seafood Central' },
                        image: 'https://source.unsplash.com/random/300x200/?fish',
                        discount: '5'
                    },
                    {
                        id: 'item6',
                        name: 'Chocolate Cake',
                        price: 210,
                        rating: 4.8,
                        restaurant: { name: 'Sweet Delights' },
                        image: 'https://source.unsplash.com/random/300x200/?cake',
                        discount: '0'
                    }
                ];
                
                try {
                    const response = await fetch('/api/menu');
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (data.success) {
                            // Process the menu items
                            const allItems = data.data || [];
                            
                            // Process each item to ensure discount and price data is correctly formatted
                            const processedItems = allItems.map(item => {
                                // Skip items without essential data
                                if (!item || !item.name || !item.price) return null;
                                
                                return {
                                    ...item,
                                    // Ensure image has a fallback
                                    image: item.image || `https://source.unsplash.com/random/300x200/?food,${encodeURIComponent(item.name)}`,
                                    // Only include oldPrice if there's a valid discount
                                    oldPrice: item.discount && parseFloat(item.discount) > 0 
                                        ? item.price 
                                        : null,
                                    // If there's a discount, calculate the new price
                                    price: item.discount && parseFloat(item.discount) > 0 
                                        ? (item.price * (1 - parseFloat(item.discount) / 100)).toFixed(2)
                                        : item.price
                                };
                            }).filter(item => item !== null); // Remove null items
                            
                            if (processedItems.length > 0) {
                                // For featured products (random selection of 5 items)
                                const shuffled = [...processedItems].sort(() => 0.5 - Math.random());
                                setFeaturedProducts(shuffled.slice(0, 5));
                                
                                // For new products (most recent 4 items by date)
                                const sortedByDate = [...processedItems].sort((a, b) => 
                                    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
                                );
                                setNewProducts(sortedByDate.slice(0, 4));
                                setLoadingProducts(false);
                                return;
                            }
                        }
                    }
                    
                    // If we get here, either the API failed or returned invalid data
                    throw new Error('Failed to fetch menu items');
                } catch (error) {
                    console.error('Error fetching menu items:', error);
                    // Don't set error message in state if we're going to use fallback data
                    // setProductsError('Failed to load restaurant menu items');
                    
                    // Use fallback data instead
                    console.log('Using sample menu items as fallback');
                    const processedSamples = sampleMenuItems.map(item => ({
                        ...item,
                        oldPrice: item.discount && parseFloat(item.discount) > 0 
                            ? item.price 
                            : null,
                        price: item.discount && parseFloat(item.discount) > 0 
                            ? (item.price * (1 - parseFloat(item.discount) / 100)).toFixed(2)
                            : item.price
                    }));
                    
                    const shuffled = [...processedSamples].sort(() => 0.5 - Math.random());
                    setFeaturedProducts(shuffled.slice(0, 5));
                    setNewProducts(shuffled.slice(0, 4));
                }
            } finally {
                setLoadingProducts(false);
            }
        };
        
        fetchMenuItems();
    }, []);

    // Fetch featured restaurants
    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                setLoadingRestaurants(true);
                setRestaurantsError(null);
                
                // Sample restaurants data to use as fallback
                const sampleRestaurants = [
                    {
                        id: 'rest1',
                        name: 'The Green Garden',
                        rating: 4.8,
                        cuisine: ['Vegetarian', 'Healthy', 'Organic'],
                        address: '123 Green St, Kathmandu',
                        coverImage: 'https://source.unsplash.com/random/600x400/?restaurant,vegetarian'
                    },
                    {
                        id: 'rest2',
                        name: 'Spice House',
                        rating: 4.5,
                        cuisine: ['Indian', 'Spicy', 'Curry'],
                        address: '456 Spice Ave, Kathmandu',
                        coverImage: 'https://source.unsplash.com/random/600x400/?restaurant,indian'
                    },
                    {
                        id: 'rest3',
                        name: 'Burger Palace',
                        rating: 4.2,
                        cuisine: ['Fast Food', 'Burgers', 'American'],
                        address: '789 Fast Blvd, Kathmandu',
                        coverImage: 'https://source.unsplash.com/random/600x400/?restaurant,burger'
                    },
                    {
                        id: 'rest4',
                        name: 'Sushi Express',
                        rating: 4.7,
                        cuisine: ['Japanese', 'Sushi', 'Asian'],
                        address: '101 Ocean Dr, Kathmandu',
                        coverImage: 'https://source.unsplash.com/random/600x400/?restaurant,sushi'
                    }
                ];
                
                try {
                    const response = await fetch('/api/restaurants/featured');
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                            setFeaturedRestaurants(data.data);
                            setLoadingRestaurants(false);
                            return;
                        }
                    }
                    
                    // If we get here, either the response wasn't OK or the data was invalid
                    throw new Error('Failed to fetch restaurants');
                } catch (error) {
                    console.error('Error fetching restaurants:', error);
                    // Don't set error message in state if we're going to use fallback data
                    // setRestaurantsError('Failed to load featured restaurants');
                    
                    // Use fallback data instead
                    console.log('Using sample restaurant data as fallback');
                    setFeaturedRestaurants(sampleRestaurants);
                }
            } finally {
                setLoadingRestaurants(false);
            }
        };
        
        fetchRestaurants();
    }, []);

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
            {user?.healthCondition && (
                <section className="py-10 bg-gradient-to-r from-green-50 to-blue-50">
                    <Container>
                        <div 
                            ref={healthRecsRef} 
                            className="mb-8 opacity-0 transform translate-y-4 transition-all duration-700"
                        >
                            <div className="flex flex-wrap items-center justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <FaHeartbeat className="text-xl text-yumrun-primary" />
                                        <h2 className="text-2xl font-bold text-gray-900">RECOMMENDATIONS FOR YOU</h2>
                                    </div>
                                    <p className="mt-1 text-gray-600">
                                        {user?.healthCondition === "Healthy" 
                                            ? "Nutritious options to maintain your healthy lifestyle" 
                                            : `Special recommendations for ${user?.healthCondition}`}
                                    </p>
                                </div>
                                
                                <Button 
                                    variant="outline"
                                    className="flex items-center gap-2 mt-2 sm:mt-0"
                                >
                                    View All <FaLongArrowAltRight />
                                </Button>
                            </div>
                            
                            <Alert className="mb-6" variant="info">
                                <div className="flex items-center gap-2">
                                    {user?.healthCondition === "Diabetes" && <FaSeedling className="text-green-600" />}
                                    {user?.healthCondition === "Heart Condition" && <FaHeartbeat className="text-red-600" />}
                                    {user?.healthCondition === "Hypertension" && <FaLeaf className="text-green-600" />}
                                    {user?.healthCondition === "Gluten Free" && <GiWheat className="text-amber-600" />}
                                    These meals are tailored to your health profile. You indicated: <strong>{user?.healthCondition}</strong>
                                </div>
                            </Alert>
                        </div>

                        {loadingRecs ? (
                            <div className="flex justify-center py-10">
                                <div className="flex flex-col items-center">
                                    <Spinner size="lg" className="text-yumrun-primary" />
                                    <p className="mt-4 text-gray-600">Loading recommendations...</p>
                                </div>
                            </div>
                        ) : recsError ? (
                            <Alert variant="error" className="mb-6">
                                {recsError}
                            </Alert>
                        ) : healthRecommendations.length > 0 ? (
                            <div className="product-slider">
                                <Swiper
                                    slidesPerView={getSlidesPerView()}
                                    spaceBetween={20}
                                    pagination={{
                                        clickable: true,
                                        dynamicBullets: true,
                                    }}
                                    navigation={true}
                                    modules={[Navigation, Pagination, Autoplay]}
                                    autoplay={{
                                        delay: 6000,
                                        disableOnInteraction: false,
                                    }}
                                    className="product-swiper"
                                >
                                    {healthRecommendations.map(item => (
                                        <SwiperSlide key={item.id}>
                                            <div className="overflow-hidden bg-white rounded-lg shadow-md">
                                                <div className="relative pb-[56.25%] overflow-hidden">
                                                    <img 
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="absolute top-0 left-0 object-cover w-full h-full"
                                                        onError={(e) => {
                                                            e.target.src = `https://source.unsplash.com/random/300x200/?healthy,${encodeURIComponent(item.name)}`;
                                                        }}
                                                    />
                                                    <span className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                        {item.healthTag}
                                                    </span>
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                                                    <p className="mb-2 text-sm text-gray-500">{item.restaurant} · {item.location}</p>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <span className="mr-1 text-yellow-400">★</span>
                                                            <span className="text-sm font-medium">{item.rating}</span>
                                                        </div>
                                                        <span className="font-bold text-yumrun-primary">Rs. {item.price}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-gray-600">No recommendations available for your health profile.</p>
                                <p className="mt-2">
                                    <Button variant="link" onClick={() => fetchHealthRecommendations(user.healthCondition)}>
                                        Refresh
                                    </Button>
                                </p>
                            </div>
                        )}
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
                                                delay: 5000,
                                                disableOnInteraction: false,
                                            }}
                                        >
                                            {featuredProducts.map((product) => (
                                                <SwiperSlide key={product.id}>
                                                    <ProductItem 
                                                        id={product.id}
                                                        name={product.name} 
                                                        location={product.restaurant?.name || ''} 
                                                        rating={product.rating || 4.0}
                                                        oldPrice={product.oldPrice?.toString() || ''}
                                                        newPrice={product.price.toString()}
                                                        imgSrc={product.image}
                                                        discount={product.discount?.toString() || ''}
                                                    />
                                                </SwiperSlide>
                                            ))}
                                        </Swiper>
                                    ) : (
                                        <div className="text-center py-8">
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
                                                    rating={product.rating || 4.0}
                                                    oldPrice={product.oldPrice?.toString() || ''}
                                                    newPrice={product.price.toString()}
                                                    imgSrc={product.image}
                                                    discount={product.discount?.toString() || ''}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No new dishes available</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Featured Restaurants Section */}
                            <div ref={featuredRestaurantsRef}>
                                <div className="flex flex-wrap items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">FEATURED RESTAURANTS</h2>
                                        <p className="text-gray-500">Top-rated restaurants in your area</p>
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
                                        <div className="flex justify-center py-12">
                                            <Spinner size="lg" />
                                        </div>
                                    ) : restaurantsError ? (
                                        <Alert variant="error" className="mb-4">
                                            {restaurantsError}
                                        </Alert>
                                    ) : featuredRestaurants.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            {featuredRestaurants.map((restaurant) => (
                                                <Card key={restaurant.id} className="overflow-hidden transition-shadow hover:shadow-md">
                                                    <div className="relative h-40 bg-gray-200">
                                                        <img 
                                                            src={restaurant.coverImage || `https://source.unsplash.com/random/600x400/?restaurant,${encodeURIComponent(restaurant.name)}`} 
                                                            alt={restaurant.name}
                                                            className="object-cover w-full h-full"
                                                            onError={(e) => {
                                                                e.target.src = `https://source.unsplash.com/random/600x400/?restaurant,${encodeURIComponent(restaurant.name)}`;
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
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">No featured restaurants available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Newsletter Subscription Section */}
                    <div 
                        ref={newsletterRef}
                        className="px-6 py-10 mt-16 rounded-lg shadow-md md:px-10 bg-gradient-to-r from-yumrun-primary/90 to-yumrun-primary"
                    >
                        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                            <div className="text-white md:w-1/2">
                                <h2 className="mb-2 text-3xl font-bold">Subscribe to Our Newsletter</h2>
                                <p className="opacity-90">Stay updated with our latest offers, promotions, and food trends</p>
                            </div>
                            
                            <div className="w-full md:w-1/2">
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <div className="relative flex-grow">
                                        <input 
                                            type="email" 
                                            placeholder="Your email address" 
                                            className="w-full px-4 py-3 border-0 rounded-md focus:ring-2 focus:ring-white/50 focus:outline-none"
                                        />
                                        <IoIosMail className="absolute text-xl text-gray-400 transform -translate-y-1/2 right-3 top-1/2" />
                                    </div>
                                    <Button 
                                        className="px-6 py-3 font-medium bg-white rounded-md hover:bg-gray-100 text-yumrun-primary"
                                    >
                                        Subscribe
                                    </Button>
                                </div>
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
