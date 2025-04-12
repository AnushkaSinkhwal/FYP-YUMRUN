import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { useState, useEffect } from "react";
import { MdOutlineFastfood, MdOutlineLocalPizza, MdOutlineRamenDining, MdOutlineCoffee, MdOutlineBakeryDining } from "react-icons/md";
import { GiNoodles, GiChickenLeg, GiHamburger, GiCakeSlice, GiSushis } from "react-icons/gi";
import { Container } from '../ui';
import { useNavigate } from 'react-router-dom';

const HomeCat = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [activeCategory, setActiveCategory] = useState(null);
    const navigate = useNavigate();
    
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Determine number of slides based on screen width
    const getSlidesPerView = () => {
        if (windowWidth < 480) return 3.5;
        if (windowWidth < 640) return 4.5;
        if (windowWidth < 768) return 5.5;
        if (windowWidth < 992) return 7.5;
        return 10;
    };
    
    const handleCategoryClick = (categoryName) => {
        setActiveCategory(categoryName);
        // Navigate to search page with category filter
        navigate(`/restaurants?category=${encodeURIComponent(categoryName)}`);
    };
    
    const categories = [
        {
            icon: <GiHamburger size={32} />,
            name: "Burgers",
            bg: '#fff5e6',
            color: '#ff9900'
        },
        {
            icon: <MdOutlineLocalPizza size={32} />,
            name: "Pizza",
            bg: '#ffeee6',
            color: '#ff5c33'
        },
        {
            icon: <GiChickenLeg size={32} />,
            name: "Chicken",
            bg: '#f0f8ff',
            color: '#3399ff'
        },
        {
            icon: <MdOutlineRamenDining size={32} />,
            name: "Noodles",
            bg: '#fff5f5',
            color: '#ff6666'
        },
        {
            icon: <GiNoodles size={32} />,
            name: "Pasta",
            bg: '#fff9e6',
            color: '#ffcc33'
        },
        {
            icon: <MdOutlineCoffee size={32} />,
            name: "Coffee",
            bg: '#f5f0e6',
            color: '#a66f2b'
        },
        {
            icon: <MdOutlineBakeryDining size={32} />,
            name: "Bakery",
            bg: '#f0f5f0',
            color: '#5c8c5c'
        },
        {
            icon: <GiCakeSlice size={32} />,
            name: "Desserts",
            bg: '#ffeef5',
            color: '#ff66a3'
        },
        {
            icon: <GiSushis size={32} />,
            name: "Sushi",
            bg: '#f5f5f0',
            color: '#8c8c5c'
        },
        {
            icon: <MdOutlineFastfood size={32} />,
            name: "Fast Food",
            bg: '#e6f5ff',
            color: '#3399ff'
        }
    ];

    return (
        <section className="py-8 bg-white border-t border-gray-100">
            <Container>
                <div className="flex flex-wrap items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">FEATURED CATEGORIES</h2>
                        <p className="text-sm sm:text-base text-gray-500">Explore our popular food categories</p>
                    </div>
                </div>
                
                <Swiper
                    slidesPerView={getSlidesPerView()}
                    spaceBetween={12}
                    speed={600}
                    navigation={windowWidth >= 640} 
                    modules={[Navigation, Pagination, Autoplay]}
                    className="category-swiper"
                    autoplay={{
                        delay: 4000,
                        disableOnInteraction: false,
                    }}
                    pagination={{
                        dynamicBullets: true,
                        clickable: true,
                        enabled: windowWidth < 640
                    }}
                    breakpoints={{
                        320: {
                            slidesPerView: 3.5,
                            spaceBetween: 8
                        },
                        480: {
                            slidesPerView: 4.5,
                            spaceBetween: 10
                        },
                        640: {
                            slidesPerView: 5.5,
                            spaceBetween: 12
                        },
                        768: {
                            slidesPerView: 7.5,
                            spaceBetween: 12
                        },
                        992: {
                            slidesPerView: 10,
                            spaceBetween: 15
                        }
                    }}
                >
                    {categories.map((category, index) => (
                        <SwiperSlide key={index}>
                            <button
                                onClick={() => handleCategoryClick(category.name)}
                                className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg w-full 
                                    transition-all duration-300 hover:scale-105 focus:outline-none 
                                    focus:ring-2 focus:ring-offset-2 focus:ring-yumrun-primary
                                    ${activeCategory === category.name ? 'ring-2 ring-yumrun-primary ring-offset-2' : ''}`}
                                style={{ 
                                    background: category.bg,
                                    color: category.color
                                }}
                                aria-label={`Browse ${category.name} category`}
                            >
                                <div className="flex items-center justify-center w-12 h-12 mb-2">
                                    {category.icon}
                                </div>
                                <h3 className="text-xs sm:text-sm font-medium text-center">{category.name}</h3>
                            </button>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </Container>
        </section>
    );
};

export default HomeCat;
