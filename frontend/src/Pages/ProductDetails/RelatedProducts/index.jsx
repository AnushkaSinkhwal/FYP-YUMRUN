import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import ProductItem from "../../../components/ProductItem";

const RelatedProducts = () => {
  return (
    <>
      <div className="col-md-9 productRow">
        <div className="d-flex align-items-center mt-3">
          <div className="info w-75">
            <h3 className="mb-0 hd">RELATED PRODUCTS</h3>
          </div>
        </div>

        <div className="product_row w-100 mt-2">
          <Swiper
            slidesPerView={4}
            spaceBetween={0}
            pagination={{ clickable: true }}
            navigation={true} // Enables navigation
            modules={[Navigation]}
          >
            <SwiperSlide>
                <ProductItem />
                </SwiperSlide>
                <SwiperSlide>
                <ProductItem />
                </SwiperSlide>
                <SwiperSlide>
                <ProductItem />
                </SwiperSlide>
                 <SwiperSlide>
                <ProductItem />
                </SwiperSlide>
                <SwiperSlide>
                <ProductItem />
                </SwiperSlide>
                
           
                
            
          </Swiper>
        </div>
      </div>
    </>
  );
};

export default RelatedProducts;
