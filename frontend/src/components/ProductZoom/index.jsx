import Slider from "react-slick";
import InnerImageZoom from 'react-inner-image-zoom';
import 'react-inner-image-zoom/lib/InnerImageZoom/styles.css';
import { useRef, useState } from 'react';
import { cn } from "../../lib/utils";

const ProductZoom = () => {
    const zoomSliderBig = useRef();
    const zoomSlider = useRef();
    const [currentSlide, setCurrentSlide] = useState(0);

    // Images array - in a real app, these would come from props or an API
    const images = [
        "https://assets.surlatable.com/m/15a89c2d9c6c1345/72_dpi_webp-REC-283110_Pizza.jpg",
        "https://img.freepik.com/free-photo/top-view-pepperoni-pizza-with-mushrooms-sausages-bell-pepper-olive-corn-black-wooden_141793-2158.jpg",
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop"
    ];

    const thumbnailSettings = {
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 1,
        vertical: true,
        verticalSwiping: true,
        arrows: true,
        focusOnSelect: true,
        beforeChange: (current, next) => setCurrentSlide(next),
        responsive: [
            {
                breakpoint: 768,
                settings: {
                    vertical: false,
                    verticalSwiping: false,
                    slidesToShow: 3
                }
            }
        ]
    };

    const mainSettings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        fade: true,
        arrows: false,
        beforeChange: (current, next) => setCurrentSlide(next)
    };

    const goto = (index) => {
        zoomSliderBig.current.slickGoTo(index);
        setCurrentSlide(index);
    };

    return (
        <div className="product-zoom-gallery">
            <div className="grid grid-cols-12 gap-4">
                {/* Thumbnails */}
                <div className="col-span-2 hidden md:block">
                    <Slider {...thumbnailSettings} className="thumbnail-slider h-full" ref={zoomSlider}>
                        {images.map((img, index) => (
                            <div className="thumbnail-item p-1" key={index}>
                                <div 
                                    className={cn(
                                        "cursor-pointer border-2 overflow-hidden rounded-md transition-all duration-200",
                                        currentSlide === index 
                                            ? "border-yumrun-primary" 
                                            : "border-transparent hover:border-gray-300"
                                    )}
                                    onClick={() => goto(index)}
                                >
                                    <img 
                                        src={img}
                                        className="w-full h-20 object-cover"
                                        alt={`Product view ${index + 1}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </Slider>
                </div>

                {/* Main Image */}
                <div className="col-span-12 md:col-span-10">
                    <div className="main-image-container rounded-lg overflow-hidden border border-gray-200">
                        <Slider {...mainSettings} className="main-slider" ref={zoomSliderBig}>
                            {images.map((img, index) => (
                                <div className="main-slider-item" key={index}>
                                    <InnerImageZoom
                                        zoomType="hover"
                                        zoomScale={1.5}
                                        src={img}
                                        className="w-full"
                                        zoomPreload={true}
                                        hideHint={true}
                                    />
                                </div>
                            ))}
                        </Slider>
                    </div>

                    {/* Mobile Thumbnails */}
                    <div className="mt-4 block md:hidden">
                        <Slider 
                            {...{
                                ...thumbnailSettings,
                                vertical: false,
                                verticalSwiping: false,
                                slidesToShow: 4
                            }} 
                            className="mobile-thumbnail-slider"
                        >
                            {images.map((img, index) => (
                                <div className="thumbnail-item p-1" key={index}>
                                    <div 
                                        className={cn(
                                            "cursor-pointer border-2 overflow-hidden rounded-md transition-all duration-200",
                                            currentSlide === index 
                                                ? "border-yumrun-primary" 
                                                : "border-transparent hover:border-gray-300"
                                        )}
                                        onClick={() => goto(index)}
                                    >
                                        <img 
                                            src={img}
                                            className="w-full h-16 object-cover"
                                            alt={`Product view ${index + 1}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </Slider>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductZoom;