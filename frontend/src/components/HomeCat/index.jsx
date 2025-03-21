import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { useState, useEffect } from "react";
import { MdOutlineFastfood, MdOutlineLocalPizza, MdOutlineRamenDining, MdOutlineCoffee, MdOutlineBakeryDining } from "react-icons/md";
import { GiNoodles, GiChickenLeg, GiHamburger, GiCakeSlice, GiSushis } from "react-icons/gi";

const HomeCat = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    
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
        if (windowWidth < 576) return 3.5;
        if (windowWidth < 768) return 5.5;
        if (windowWidth < 992) return 7.5;
        return 10;
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
        <section className="homeCat">
            <div className="container">
                <div className="section-header d-flex align-items-center justify-content-between mb-4 flex-wrap">
                    <div className="info">
                        <h3 className="mb-0 hd">FEATURED CATEGORIES</h3>
                        <p className="text-light mb-0">Explore our popular food categories</p>
                    </div>
                </div>
                
                <Swiper
                    slidesPerView={getSlidesPerView()}
                    spaceBetween={15}
                    speed={800}
                    navigation={true} 
                    modules={[Navigation, Pagination, Autoplay]}
                    className="category-swiper"
                    autoplay={{
                        delay: 4000,
                        disableOnInteraction: false,
                    }}
                    pagination={{
                        dynamicBullets: true,
                        clickable: true
                    }}
                    breakpoints={{
                        320: {
                            slidesPerView: 3.5,
                            spaceBetween: 10
                        },
                        576: {
                            slidesPerView: 5.5,
                            spaceBetween: 12
                        },
                        768: {
                            slidesPerView: 7.5,
                            spaceBetween: 15
                        },
                        992: {
                            slidesPerView: 10,
                            spaceBetween: 15
                        }
                    }}
                >
                    {categories.map((category, index) => (
                        <SwiperSlide key={index}>
                            <div 
                                className="category-item" 
                                style={{ 
                                    background: category.bg,
                                    color: category.color
                                }}
                            >
                                <div className="category-icon">
                                    {category.icon}
                                </div>
                                <h6>{category.name}</h6>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
};

export default HomeCat;
