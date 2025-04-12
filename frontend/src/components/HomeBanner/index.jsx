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
  const [imagesLoaded, setImagesLoaded] = useState({
    slide1: false,
    slide2: false,
    slide3: false
  });

  useEffect(() => {
    // Set loaded after a small delay to allow for animations
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  const handleImageLoad = (slideKey) => {
    setImagesLoaded(prev => ({
      ...prev,
      [slideKey]: true
    }));
  };

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
      <div className="absolute left-0 right-0 flex justify-center bottom-6">
        <ul className="flex items-center space-x-2"> {dots} </ul>
      </div>
    ),
    customPaging: i => (
      <button 
        className="w-3 h-3 transition-all duration-300 rounded-full bg-white/50 hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-yumrun-primary/50" 
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
  
  const bannerImage1 = "https://wallpapers.com/images/featured/food-4k-1pf6px6ryqfjtnyr.jpg";
  const bannerImage2 = "https://images.unsplash.com/photo-1478144592103-25e218a04891?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Zm9vZCUyMHdoaXRlfGVufDB8fDB8fHww";
  const bannerImage3 = "https://wallpapers.com/images/featured/food-ccsaubvss63lkcyb.jpg";
  
  return (
    <div className={cn(
      "relative overflow-hidden bg-gray-50 transition-opacity duration-500",
      isLoaded ? "opacity-100" : "opacity-0"
    )}>
      <div className="relative">
        <Slider {...settings}>
          <div className="relative">
            <div className="w-full h-[400px] sm:h-[450px] md:h-[550px] bg-gray-100 animate-pulse">
              {!imagesLoaded.slide1 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 rounded-full border-yumrun-primary border-t-transparent animate-spin"></div>
                </div>
              )}
            </div>
            <img 
              src={bannerImage1}
              alt="Delicious food selection showcasing our menu variety"
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
                imagesLoaded.slide1 ? "opacity-100" : "opacity-0"
              )}
              loading="eager"
              onLoad={() => handleImageLoad('slide1')}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent">
              <Container className="flex items-center h-full">
                <div className="max-w-lg px-4 py-8 text-white animate-fade-in">
                  <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">Delicious Food Delivered Fast</h2>
                  <p className="text-lg sm:text-xl md:text-2xl opacity-90">Order your favorite dishes with just a few clicks</p>
                </div>
              </Container>
            </div>
          </div>
          <div className="relative">
            <div className="w-full h-[400px] sm:h-[450px] md:h-[550px] bg-gray-100 animate-pulse">
              {!imagesLoaded.slide2 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 rounded-full border-yumrun-primary border-t-transparent animate-spin"></div>
                </div>
              )}
            </div>
            <img 
              src={bannerImage2}
              alt="Fresh and healthy menu options"
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
                imagesLoaded.slide2 ? "opacity-100" : "opacity-0"
              )}
              loading="lazy"
              onLoad={() => handleImageLoad('slide2')}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent">
              <Container className="flex items-center h-full">
                <div className="max-w-lg px-4 py-8 text-white animate-fade-in">
                  <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">Fresh Ingredients, Amazing Taste</h2>
                  <p className="text-lg sm:text-xl md:text-2xl opacity-90">Quality food from the best restaurants in town</p>
                </div>
              </Container>
            </div>
          </div>
          <div className="relative">
            <div className="w-full h-[400px] sm:h-[450px] md:h-[550px] bg-gray-100 animate-pulse">
              {!imagesLoaded.slide3 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 rounded-full border-yumrun-primary border-t-transparent animate-spin"></div>
                </div>
              )}
            </div>
            <img 
              src={bannerImage3}
              alt="Special promotion on selected restaurants"
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
                imagesLoaded.slide3 ? "opacity-100" : "opacity-0"
              )}
              loading="lazy"
              onLoad={() => handleImageLoad('slide3')}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent">
              <Container className="flex items-center h-full">
                <div className="max-w-lg px-4 py-8 text-white animate-fade-in">
                  <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">Special Offers Every Day</h2>
                  <p className="text-lg sm:text-xl md:text-2xl opacity-90">Save on your favorite meals with our daily deals</p>
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
