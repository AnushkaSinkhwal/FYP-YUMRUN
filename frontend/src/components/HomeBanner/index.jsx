import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const HomeBanner = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    arrows: true,
    fade: false,
    prevArrow: <div className="custom-prev-arrow">&#8592;</div>,
    nextArrow: <div className="custom-next-arrow">&#8594;</div>,
  };
  
  return (
    <div className="homeBannerSection">
      <Slider {...settings}>
        <div className="item">
          <img 
           src="https://wallpapers.com/images/featured/food-4k-1pf6px6ryqfjtnyr.jpg" alt="Banner 1"
          />
        </div>
        <div className="item">
          <img src="https://images.unsplash.com/photo-1478144592103-25e218a04891?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Zm9vZCUyMHdoaXRlfGVufDB8fDB8fHww" alt="Banner 2"
            
          />
        </div>
        <div className="item">
          < img src="https://wallpapers.com/images/featured/food-ccsaubvss63lkcyb.jpg"
            
          />
        </div>
      </Slider>
    </div>
  );
};

export default HomeBanner;
