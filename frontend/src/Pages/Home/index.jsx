import HomeBanner from "../../components/HomeBanner";
import banner1 from "../../assets/images/banner1.jpg";
import banner2 from "../../assets/images/banner2.jpg";
import banner5 from "../../assets/images/banner5.jpg";
import { FaLongArrowAltRight, FaHeartbeat, FaLeaf, FaSeedling } from "react-icons/fa";
import { GiGluten } from "react-icons/gi";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import ProductItem from "../../components/ProductItem";
import HomeCat from "../../components/HomeCat";
import { IoIosMail } from "react-icons/io";
import { useEffect, useState, useRef } from 'react';
import { Container, Button, Alert, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

const Home = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isLoaded, setIsLoaded] = useState(false);
    const [healthRecommendations, setHealthRecommendations] = useState([]);
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [recsError, setRecsError] = useState(null);
    
    const { user } = useAuth();
    
    const bestSellersRef = useRef(null);
    const newProductsRef = useRef(null);
    const healthRecsRef = useRef(null);
    const bannersRef = useRef(null);
    const newsletterRef = useRef(null);

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
                                    {user?.healthCondition === "Gluten Free" && <GiGluten className="text-amber-600" />}
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
                            <div className="mb-16">
                                <div 
                                    ref={bestSellersRef} 
                                    className="flex flex-wrap items-center justify-between mb-6"
                                >
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">BEST SELLERS</h2>
                                        <p className="text-gray-500">Do not miss the current offers.</p>
                                    </div>

                                    <Button 
                                        variant="outline" 
                                        className="flex items-center gap-2 mt-2 sm:mt-0"
                                    >
                                        View All <FaLongArrowAltRight />
                                    </Button>
                                </div>

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
                                            delay: 5000,
                                            disableOnInteraction: false,
                                        }}
                                        className="product-swiper"
                                    >
                                        <SwiperSlide>
                                            <ProductItem 
                                                name="Fire And Ice Pizzeria" 
                                                location="Thamel" 
                                                rating={4.8}
                                            />
                                        </SwiperSlide>
                                        <SwiperSlide>
                                            <ProductItem 
                                                name="Roadhouse Cafe" 
                                                location="Jhamsikhel" 
                                                rating={4.5}
                                                oldPrice="720"
                                                newPrice="590"
                                            />
                                        </SwiperSlide>
                                        <SwiperSlide>
                                            <ProductItem 
                                                name="Bajeko Sekuwa" 
                                                location="Battisputali" 
                                                rating={4.2}
                                                oldPrice="550"
                                                newPrice="470"
                                            />
                                        </SwiperSlide>
                                        <SwiperSlide>
                                            <ProductItem 
                                                name="Cafe Soma" 
                                                location="Lalitpur" 
                                                rating={4.0}
                                            />
                                        </SwiperSlide>
                                        <SwiperSlide>
                                            <ProductItem 
                                                name="Tamarind Restaurant" 
                                                location="Pulchowk" 
                                                rating={4.3}
                                                oldPrice="780"
                                                newPrice="650"
                                            />
                                        </SwiperSlide>
                                    </Swiper>
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

                                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                    <div className="col-span-1">
                                        <ProductItem 
                                            name="Himalayan Java" 
                                            location="Thamel" 
                                            rating={4.7}
                                            oldPrice="450"
                                            newPrice="390"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <ProductItem 
                                            name="KFC Nepal" 
                                            location="Durbar Marg" 
                                            rating={4.1} 
                                            oldPrice="680"
                                            newPrice="599"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <ProductItem 
                                            name="Pizza Hut" 
                                            location="Naxal" 
                                            rating={4.3}
                                            oldPrice="950"
                                            newPrice="799"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <ProductItem 
                                            name="Bakery Cafe" 
                                            location="Sundhara" 
                                            rating={4.0}
                                            oldPrice="380"
                                            newPrice="320"
                                        />
                                    </div>
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
