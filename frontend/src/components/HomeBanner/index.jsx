import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useEffect, useState } from "react";
import PropTypes from 'prop-types';

// Custom arrow components for better styling
const PrevArrow = ({ className, onClick }) => (
  <button 
    className={`${className} custom-prev-arrow`} 
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
    className={`${className} custom-next-arrow`} 
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
      <div>
        <ul className="custom-dots"> {dots} </ul>
      </div>
    ),
    customPaging: i => (
      <button aria-label={`Go to slide ${i + 1}`}>
        <div className="custom-dot"></div>
      </button>
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
    <div className={`homeBannerSection ${isLoaded ? 'loaded' : ''}`}>
      <div className="banner-container">
        <Slider {...settings}>
          <div className="item">
            <img 
              src="https://wallpapers.com/images/featured/food-4k-1pf6px6ryqfjtnyr.jpg" 
              alt="Delicious food selection showcasing our menu variety"
              loading="lazy"
              onLoad={handleImageLoad}
            />
            <div className="banner-content">
              <h2>Delicious Food Delivered Fast</h2>
              <p>Order your favorite dishes with just a few clicks</p>
            </div>
          </div>
          <div className="item">
            <img 
              src="https://images.unsplash.com/photo-1478144592103-25e218a04891?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Zm9vZCUyMHdoaXRlfGVufDB8fDB8fHww" 
              alt="Fresh and healthy menu options"
              loading="lazy"
              onLoad={handleImageLoad}
            />
            <div className="banner-content">
              <h2>Fresh Ingredients, Amazing Taste</h2>
              <p>Quality food from the best restaurants in town</p>
            </div>
          </div>
          <div className="item">
            <img 
              src="https://wallpapers.com/images/featured/food-ccsaubvss63lkcyb.jpg"
              alt="Special promotion on selected restaurants"
              loading="lazy"
              onLoad={handleImageLoad}
            />
            <div className="banner-content">
              <h2>Special Offers Every Day</h2>
              <p>Save on your favorite meals with our daily deals</p>
            </div>
          </div>
        </Slider>
      </div>
    </div>
  );
};

export default HomeBanner;
