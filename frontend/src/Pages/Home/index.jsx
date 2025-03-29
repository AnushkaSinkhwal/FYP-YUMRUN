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
import { Container, Button } from '../../components/ui';

const Home = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isLoaded, setIsLoaded] = useState(false);
    
    const bestSellersRef = useRef(null);
    const newProductsRef = useRef(null);
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
            
            <section className="py-10 bg-white">
                <Container>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Banner Section - Responsive Banners */}
                        <div className="lg:col-span-3">
                            <div className="space-y-6">
                                <div 
                                    className="overflow-hidden rounded-lg shadow-sm transition-transform duration-300 hover:shadow-md" 
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
                                    className="overflow-hidden rounded-lg shadow-sm transition-transform duration-300 hover:shadow-md" 
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
                                    className="overflow-hidden rounded-lg shadow-sm transition-transform duration-300 hover:shadow-md" 
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
                                        className="mt-2 sm:mt-0 flex items-center gap-2"
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
                                        className="mt-2 sm:mt-0 flex items-center gap-2"
                                    >
                                        View All <FaLongArrowAltRight />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                        className="mt-16 py-10 px-6 md:px-10 bg-gradient-to-r from-yumrun-primary/90 to-yumrun-primary rounded-lg shadow-md"
                    >
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-white md:w-1/2">
                                <h2 className="text-3xl font-bold mb-2">Subscribe to Our Newsletter</h2>
                                <p className="opacity-90">Stay updated with our latest offers, promotions, and food trends</p>
                            </div>
                            
                            <div className="w-full md:w-1/2">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-grow">
                                        <input 
                                            type="email" 
                                            placeholder="Your email address" 
                                            className="w-full px-4 py-3 rounded-md border-0 focus:ring-2 focus:ring-white/50 focus:outline-none"
                                        />
                                        <IoIosMail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                                    </div>
                                    <Button 
                                        className="px-6 py-3 bg-white hover:bg-gray-100 text-yumrun-primary font-medium rounded-md"
                                    >
                                        Subscribe
                                    </Button>
                                </div>
                                <p className="text-white/80 text-xs mt-2">
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
