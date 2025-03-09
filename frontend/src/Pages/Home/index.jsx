import HomeBanner from "../../components/HomeBanner";
import banner1 from "../../images/banner1.jpg";
import banner2 from "../../images/banner2.jpg";
import banner3 from "../../images/banner3.jpg";
import banner4 from "../../images/banner4.jpg";
import banner5 from "../../images/banner5.jpg";
import coupon from "../../images/coupon.png";
import Button from '@mui/material/Button';
import { FaLongArrowAltRight } from "react-icons/fa";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import {  Navigation } from 'swiper/modules';
import ProductItem from "../../components/ProductItem";
import HomeCat from "../../components/HomeCat";
import { IoIosMail } from "react-icons/io";



const Home = () => {
    return (
        <>
            <HomeBanner/>
            <HomeCat/>
            <section className="homeProducts">
                <section className="container">
                    <div className="row">
                        {/* Left Banner Section */}
                        <div className="col-md-3">
                            <div className="sticky">
                            <div className="banner">
                                <img 
                                    src={banner1}
                                    className="cursor w-100" 
                                    alt="Banner"
                                />
                            </div>
                            <div className="banner">
                                <img 
                                    src={banner2}
                                    className="cursor w-100" 
                                    alt="Banner"
                                />
                            </div>
                            <div className="banner">
                                <img 
                                    src={banner5}
                                    className="cursor w-100" 
                                    alt="Banner"
                                />
                            </div>
                            </div>
                        </div>
                        

                        {/* Right Section - Best Sellers Info */}
                        <div className="col-md-9 productRow">
                            <div className="d-flex align-items-center mt-4">
                                <div className="info w-75">
                                    <h3 className="mb-0 hd">BEST SELLERS</h3>
                                    <p className="text-light">Do not miss the current offers.</p>
                                </div>

                                <Button className="viewAllBtn ml-auto">View All  <FaLongArrowAltRight /> </Button>
                            </div>

                            <div className="product_row w-100 mt-2">
                                <Swiper
                                    slidesPerView={4}
                                    spaceBetween={0}
                                    pagination={{
                                        clickable: true,
                                    }}
                                    navigation={true} // Enables navigation
                                    modules={[Navigation]}
                                    
                                >
                                    <SwiperSlide><ProductItem/></SwiperSlide>
                                    <SwiperSlide><ProductItem/></SwiperSlide>
                                    <SwiperSlide><ProductItem/></SwiperSlide>
                                    <SwiperSlide><ProductItem/></SwiperSlide>
                                    <SwiperSlide><ProductItem/></SwiperSlide>
                                    
                                    
                                    </Swiper>
                            </div>


                            <div className="d-flex align-items-center mt-5">
                                <div className="info w-75">
                                    <h3 className="mb-0 hd">NEW PRODUCTS</h3>
                                    <p className="text-light">New Products with Updated Stock.</p>
                                </div>

                                <Button className="viewAllBtn ml-auto">View All <FaLongArrowAltRight /> </Button>
                            </div>

                            <div className="product_row productRow2 w-100 mt-4 d-flex ">
                               <ProductItem/>
                               <ProductItem/>
                               <ProductItem/>
                               <ProductItem/>
                               <ProductItem/>
                               <ProductItem/>
                               <ProductItem/>
                               <ProductItem/>

                            </div>

                            <div className="bannerSec">
                            <div className="banner">
                                <img 
                                    src={banner3}
                                    className="cursor" 
                                    alt="Banner"
                                />
                            </div>
                            <div className="banner">
                                <img 
                                    src={banner4}
                                    className="cursor" 
                                    alt="Banner"
                                />
                            </div>
                            </div>
                        </div>
                    </div>
                </section>
            </section>

            <section className="newsLetterSection mt-3 mb-3 d-flex align-items-center ">
                <div className="container">
                    <div className="row">
                        <div className= "col-md-6">
                            <p className="text-white mb-1"> 20% off on your first order. </p>
                            <h3 className="text-white">Join our newsletter and get...</h3>
                            <p className="text-light">Join our email subscription now  to get
                            <br/> updates on promotions and coupons.
                            </p>

                            <form>
                                 <IoIosMail />
                                 <input type="text" placeholder="Your E-mail Address" />
                                 <button>Subscribe</button>
                                 </form>
                        </div> 
                        <div className= "col-md-6">
                            <img src={coupon}/>
 
                        </div>
                    </div>
                </div>
            </section>
            <br/> <br/> <br/> <br/> <br/> <br/> 
           
        </>
    );
};

export default Home;
