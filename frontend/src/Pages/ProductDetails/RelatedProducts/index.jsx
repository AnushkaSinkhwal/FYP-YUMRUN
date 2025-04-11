import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import ProductItem from "../../../components/ProductItem";
import { Spinner } from "../../../components/ui";
import axios from 'axios';
import PropTypes from 'prop-types';

const RelatedProducts = ({ currentProductId }) => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!currentProductId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch related products based on the current product
        const response = await axios.get(`/api/menu/related/${currentProductId}`);
        
        if (response.data.success) {
          setRelatedProducts(response.data.data || []);
        } else {
          setError(response.data.error?.message || 'Failed to load related products');
        }
      } catch (err) {
        console.error('Error fetching related products:', err);
        setError('Could not load related products');
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [currentProductId]);

  // If no related products after loading, don't render anything
  if (!loading && (!relatedProducts || relatedProducts.length === 0)) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">You May Also Like</h2>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className="text-center text-gray-500 py-8">{error}</p>
      ) : (
        <Swiper
          slidesPerView={1}
          spaceBetween={16}
          navigation={true}
          modules={[Navigation]}
          className="related-products-swiper"
          breakpoints={{
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 }
          }}
        >
          {relatedProducts.map((product) => (
            <SwiperSlide key={product._id || product.id}>
              <ProductItem 
                id={product._id || product.id}
                name={product.name}
                price={product.price}
                image={product.image}
                discount={product.discount}
                rating={product.rating}
                size="md"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
};

RelatedProducts.propTypes = {
  currentProductId: PropTypes.string.isRequired
};

export default RelatedProducts;
