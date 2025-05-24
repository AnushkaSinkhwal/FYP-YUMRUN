import Slider from "react-slick";
import InnerImageZoom from 'react-inner-image-zoom';
import 'react-inner-image-zoom/lib/InnerImageZoom/styles.css';
import { useRef, useState } from 'react';
import { cn } from "../../lib/utils";
import PropTypes from 'prop-types';

const ProductZoom = ({ images = [] }) => {
    const zoomSliderBig = useRef();
    const zoomSlider = useRef();
    const [currentSlide, setCurrentSlide] = useState(0);

    // If no images are provided, use a placeholder
    const displayImages = images.length > 0 
        ? images 
        : ["https://via.placeholder.com/400x300?text=No+Image+Available"];

    const thumbnailSettings = {
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: Math.min(4, displayImages.length),
        slidesToScroll: 1,
        vertical: true,
        verticalSwiping: true,
        arrows: displayImages.length > 1,
        focusOnSelect: true,
        beforeChange: (current, next) => setCurrentSlide(next),
        responsive: [
            {
                breakpoint: 768,
                settings: {
                    vertical: false,
                    verticalSwiping: false,
                    slidesToShow: Math.min(3, displayImages.length)
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
        arrows: displayImages.length > 1,
        beforeChange: (current, next) => setCurrentSlide(next)
    };

    const goto = (index) => {
        zoomSliderBig.current.slickGoTo(index);
        setCurrentSlide(index);
    };

    return (
        <div className="product-zoom-gallery">
            <div className="grid grid-cols-12 gap-4">
                {/* Thumbnails - Only show if there's more than one image */}
                {displayImages.length > 1 && (
                    <div className="col-span-2 hidden md:block">
                        <Slider {...thumbnailSettings} className="thumbnail-slider h-full" ref={zoomSlider}>
                            {displayImages.map((img, index) => (
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
                                            className="w-full h-20 object-contain"
                                            alt={`Product view ${index + 1}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </Slider>
                    </div>
                )}

                {/* Main Image */}
                <div className={displayImages.length > 1 ? "col-span-12 md:col-span-10" : "col-span-12"}>
                    <div className="main-image-container rounded-lg overflow-hidden border border-gray-200">
                        <Slider {...mainSettings} className="main-slider" ref={zoomSliderBig}>
                            {displayImages.map((img, index) => (
                                <div className="main-slider-item" key={index}>
                                    <InnerImageZoom
                                        zoomType="hover"
                                        zoomScale={1.5}
                                        src={img}
                                        className="w-full h-auto object-contain"
                                        zoomPreload={true}
                                        hideHint={true}
                                    />
                                </div>
                            ))}
                        </Slider>
                    </div>

                    {/* Mobile Thumbnails - Only show if there's more than one image */}
                    {displayImages.length > 1 && (
                        <div className="mt-4 block md:hidden">
                            <Slider 
                                {...{
                                    ...thumbnailSettings,
                                    vertical: false,
                                    verticalSwiping: false,
                                    slidesToShow: Math.min(4, displayImages.length)
                                }} 
                                className="mobile-thumbnail-slider"
                            >
                                {displayImages.map((img, index) => (
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
                                                className="w-full h-16 object-contain"
                                                alt={`Product view ${index + 1}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </Slider>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

ProductZoom.propTypes = {
    images: PropTypes.arrayOf(PropTypes.string)
};

export default ProductZoom;