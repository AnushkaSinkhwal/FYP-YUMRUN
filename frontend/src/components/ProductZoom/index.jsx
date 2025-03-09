import Slider from "react-slick";
import InnerImageZoom from 'react-inner-image-zoom';
import 'react-inner-image-zoom/lib/InnerImageZoom/styles.css';
import { useRef } from 'react';

const ProductZoom=()=>{

     const zoomSliderBig = useRef();
     const zoomSlider = useRef();

    var settings = {
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: 5,
        slidesToScroll: 1,
        fade: false,
        arrows: true
    };

    var settings2 = {
        dots: false,
        infinite: false,
        speed: 700,
        slidesToShow: 1,
        slidesToScroll: 1,
        fade: false,
        arrows: false,
    };

    const goto = (index) => {
        zoomSlider.current.slickGoTo(index);
        zoomSliderBig.current.slickGoTo(index);
    };



    return(
        <div className="productZoom">
            <div className='productZoom position-relative'>
                        <div className='badge badge-primary'>-20%</div>  
                        <Slider {...settings2} className='zoomSliderBig' ref={zoomSliderBig}>
                            <div className='item'>
                                <InnerImageZoom
                                    zoomType="hover"
                                    zoomScale={1}
                                    src="https://assets.surlatable.com/m/15a89c2d9c6c1345/72_dpi_webp-REC-283110_Pizza.jpg"
                                />
                            </div>
                            <div className='item'>
                                <InnerImageZoom
                                    zoomType="hover"
                                    zoomScale={1}
                                    src="https://assets.surlatable.com/m/15a89c2d9c6c1345/72_dpi_webp-REC-283110_Pizza.jpg"
                                />
                            </div>
                            <div className='item'>
                                <InnerImageZoom
                                    zoomType="hover"
                                    zoomScale={1}
                                    src="https://assets.surlatable.com/m/15a89c2d9c6c1345/72_dpi_webp-REC-283110_Pizza.jpg"
                                />
                            </div>
                        </Slider>

                        <Slider {...settings} className='zoomSlider mt-3' ref={zoomSlider}>
                            <div className='item'>
                                <img src="https://assets.surlatable.com/m/15a89c2d9c6c1345/72_dpi_webp-REC-283110_Pizza.jpg" 
                                    className='w-100' 
                                    onClick={() => goto(0)} 
                                    alt="Vegetable Sandwich" 
                                />
                            </div>
                            <div className='item'>
                                <img src="https://assets.surlatable.com/m/15a89c2d9c6c1345/72_dpi_webp-REC-283110_Pizza.jpg" 
                                    className='w-100' 
                                    onClick={() => goto(1)} 
                                    alt="Vegetable Sandwich" 
                                />
                            </div>
                            <div className='item'>
                                <img src="https://assets.surlatable.com/m/15a89c2d9c6c1345/72_dpi_webp-REC-283110_Pizza.jpg" 
                                    className='w-100' 
                                    onClick={() => goto(2)} 
                                    alt="Vegetable Sandwich" 
                                />
                            </div>
                        </Slider>
                    </div>
        </div>
    )

}
export default ProductZoom;