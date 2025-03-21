import HomeBanner from "../../components/HomeBanner";
import banner1 from "../../assets/images/banner1.jpg";
import banner2 from "../../assets/images/banner2.jpg";
import banner3 from "../../assets/images/banner3.jpg";
import banner4 from "../../assets/images/banner4.jpg";
import banner5 from "../../assets/images/banner5.jpg";
import Button from '@mui/material/Button';
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
        <div className={`home-container ${isLoaded ? 'loaded' : ''}`}>
            {/* Hero Banner Section */}
            <div className="hero-section full-width">
                <div className="container">
                    <HomeBanner/>
                </div>
            </div>
            
            {/* Food Categories Section */}
            <div className="category-section">
                <HomeCat/>
            </div>
            
            <section className="homeProducts">
                <div className="container">
                    <div className="row">
                        {/* Left Banner Section - Responsive Banners */}
                        <div className="col-lg-3 col-md-12">
                            <div className="banners-container">
                                <div className="row">
                                    <div className="col-lg-12 col-md-4 col-sm-6 col-12 mb-4">
                                        <div className="banner fade-in-item image-hover-zoom">
                                            <img 
                                                src={banner1}
                                                className="w-100" 
                                                alt="Promotional Banner"
                                                loading="lazy"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-lg-12 col-md-4 col-sm-6 col-12 mb-4">
                                        <div className="banner fade-in-item image-hover-zoom" style={{animationDelay: '0.2s'}}>
                                            <img 
                                                src={banner2}
                                                className="w-100" 
                                                alt="Promotional Banner"
                                                loading="lazy"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-lg-12 col-md-4 col-sm-12 mb-4">
                                        <div className="banner fade-in-item image-hover-zoom" style={{animationDelay: '0.4s'}}>
                                            <img 
                                                src={banner5}
                                                className="w-100" 
                                                alt="Promotional Banner"
                                                loading="lazy"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Right Section - Products */}
                        <div className="col-lg-9 col-md-12">
                            {/* Best Sellers Section */}
                            <div className="products-section mb-5">
                                <div ref={bestSellersRef} className="section-header d-flex align-items-center justify-content-between mb-4 flex-wrap section-animate">
                                    <div className="info">
                                        <h3 className="mb-0 hd">BEST SELLERS</h3>
                                        <p className="text-light mb-0">Do not miss the current offers.</p>
                                    </div>

                                    <Button className="viewAllBtn mt-2 mt-sm-0">
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
                                                oldPrice="480"
                                                newPrice="400"
                                            />
                                        </SwiperSlide>
                                        <SwiperSlide>
                                            <ProductItem 
                                                name="KFC" 
                                                location="Durbar Marg" 
                                                rating={4.3}
                                                oldPrice="750"
                                                newPrice="600"
                                            />
                                        </SwiperSlide>
                                    </Swiper>
                                </div>
                            </div>

                            {/* New Products Section */}
                            <div className="products-section mb-5">
                                <div ref={newProductsRef} className="section-header d-flex align-items-center justify-content-between mb-4 flex-wrap section-animate">
                                    <div className="info">
                                        <h3 className="mb-0 hd">NEW PRODUCTS</h3>
                                        <p className="text-light mb-0">New Products with Updated Stock.</p>
                                    </div>

                                    <Button className="viewAllBtn mt-2 mt-sm-0">
                                        View All <FaLongArrowAltRight />
                                    </Button>
                                </div>

                                <div className="product-grid">
                                    <div className="row">
                                        <div className="col-xl-3 col-lg-4 col-md-4 col-6 mb-4 fade-in-item">
                                            <ProductItem 
                                                name="Bakery Cafe" 
                                                location="Sundhara" 
                                                rating={3.9}
                                                oldPrice="350"
                                                newPrice="300"
                                            />
                                        </div>
                                        <div className="col-xl-3 col-lg-4 col-md-4 col-6 mb-4 fade-in-item" style={{animationDelay: '0.1s'}}>
                                            <ProductItem 
                                                name="Pizza Hut" 
                                                location="Pulchowk" 
                                                rating={4.1}
                                                oldPrice="850"
                                                newPrice="720"
                                            />
                                        </div>
                                        <div className="col-xl-3 col-lg-4 col-md-4 col-6 mb-4 fade-in-item" style={{animationDelay: '0.2s'}}>
                                            <ProductItem 
                                                name="Himalayan Java" 
                                                location="Thamel" 
                                                rating={4.6}
                                                oldPrice="450"
                                                newPrice="400"
                                            />
                                        </div>
                                        <div className="col-xl-3 col-lg-4 col-md-4 col-6 mb-4 fade-in-item" style={{animationDelay: '0.3s'}}>
                                            <ProductItem 
                                                name="Tamarind" 
                                                location="Jhamsikhel" 
                                                rating={4.3}
                                                oldPrice="950"
                                                newPrice="850"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Promotional Banners Section */}
                            <div ref={bannersRef} className="promo-banners section-animate mb-5">
                                <div className="row">
                                    <div className="col-md-6 mb-4 mb-md-0">
                                        <div className="banner image-hover-zoom">
                                            <img 
                                                src={banner3} 
                                                className="w-100" 
                                                alt="Promotional Banner" 
                                                loading="lazy"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="banner image-hover-zoom">
                                            <img 
                                                src={banner4} 
                                                className="w-100" 
                                                alt="Promotional Banner" 
                                                loading="lazy"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Newsletter Section */}
            <div ref={newsletterRef} className="container mb-5 section-animate">
                <div className="newsLetterSection">
                    <div className="row align-items-center">
                        <div className="col-lg-7 col-md-6">
                            <div className="newsletter-content p-4">
                                <h3 className="text-white">Get Every Week Updates</h3>
                                <p className="text-light">Sign up for our newsletter to receive weekly updates on new dishes and special offers.</p>
                                <div className="newsletter-form">
                                    <IoIosMail />
                                    <input type="email" placeholder="Your Email Address" />
                                    <button>Subscribe</button>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-5 col-md-6 text-center">
                            <img src={banner3} alt="Newsletter Promotion" className="newsletter-image" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
