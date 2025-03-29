import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { cn } from "../../lib/utils";
import { Container } from "../ui";

// Custom arrow components for better styling
const PrevArrow = ({ className, onClick }) => (
  <button 
    className={cn(
      "absolute left-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 text-gray-800 hover:bg-white hover:text-yumrun-primary shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yumrun-primary/50",
      className
    )}
    onClick={onClick}
    aria-label="Previous slide"
  >
    <FaChevronLeft />
  </button>
);

PrevArrow.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func
};

const NextArrow = ({ className, onClick }) => (
  <button 
    className={cn(
      "absolute right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 text-gray-800 hover:bg-white hover:text-yumrun-primary shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yumrun-primary/50",
      className
    )}
    onClick={onClick}
    aria-label="Next slide"
  >
    <FaChevronRight />
  </button>
);

NextArrow.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func
};

const HomeBanner = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Set loaded after a small delay to allow for animations
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: true,
    fade: true,
    cssEase: "cubic-bezier(0.7, 0, 0.3, 1)",
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    appendDots: dots => (
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <ul className="flex items-center space-x-2"> {dots} </ul>
      </div>
    ),
    customPaging: i => (
      <button 
        className="w-3 h-3 rounded-full bg-white/50 hover:bg-white/80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yumrun-primary/50" 
        aria-label={`Go to slide ${i + 1}`}
      />
    ),
    responsive: [
      {
        breakpoint: 992,
        settings: {
          arrows: true,
          adaptiveHeight: true
        }
      },
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          adaptiveHeight: true
        }
      }
    ]
  };
  
  const handleImageLoad = () => {
    // Image load handler for potential future optimizations
  };
  
  return (
    <div className={cn(
      "relative overflow-hidden bg-gray-100 transition-opacity duration-500",
      isLoaded ? "opacity-100" : "opacity-0"
    )}>
      <div className="relative">
        <Slider {...settings}>
          <div className="relative">
            <div className="w-full h-[500px] md:h-[600px] bg-gray-200 animate-pulse"></div>
            <img 
              src="https://wallpapers.com/images/featured/food-4k-1pf6px6ryqfjtnyr.jpg" 
              alt="Delicious food selection showcasing our menu variety"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              onLoad={handleImageLoad}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent">
              <Container className="h-full flex items-center">
                <div className="max-w-lg text-white px-4 py-12 animate-fade-in">
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">Delicious Food Delivered Fast</h2>
                  <p className="text-xl md:text-2xl opacity-90">Order your favorite dishes with just a few clicks</p>
                </div>
              </Container>
            </div>
          </div>
          <div className="relative">
            <div className="w-full h-[500px] md:h-[600px] bg-gray-200 animate-pulse"></div>
            <img 
              src="https://images.unsplash.com/photo-1478144592103-25e218a04891?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Zm9vZCUyMHdoaXRlfGVufDB8fDB8fHww" 
              alt="Fresh and healthy menu options"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              onLoad={handleImageLoad}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent">
              <Container className="h-full flex items-center">
                <div className="max-w-lg text-white px-4 py-12 animate-fade-in">
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">Fresh Ingredients, Amazing Taste</h2>
                  <p className="text-xl md:text-2xl opacity-90">Quality food from the best restaurants in town</p>
                </div>
              </Container>
            </div>
          </div>
          <div className="relative">
            <div className="w-full h-[500px] md:h-[600px] bg-gray-200 animate-pulse"></div>
            <img 
              src="https://wallpapers.com/images/featured/food-ccsaubvss63lkcyb.jpg"
              alt="Special promotion on selected restaurants"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              onLoad={handleImageLoad}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent">
              <Container className="h-full flex items-center">
                <div className="max-w-lg text-white px-4 py-12 animate-fade-in">
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">Special Offers Every Day</h2>
                  <p className="text-xl md:text-2xl opacity-90">Save on your favorite meals with our daily deals</p>
                </div>
              </Container>
            </div>
          </div>
        </Slider>
      </div>
    </div>
  );
};

export default HomeBanner;
