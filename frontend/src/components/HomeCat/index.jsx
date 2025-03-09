import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import { useState } from "react";

const HomeCat = () => {
    const [itemBg] = useState([
        '#fffceb', '#ecffec', '#feefea', '#fff3eb',
        '#fff3ff', '#f2fce4', '#feefea', '#fffceb',
        '#feefea', '#ecffec', '#feefea', '#fff3eb'
    ]);

    return (
        <section className="homeCat">
            <div className="container">
                <h3 className="mb-3 hd"> Featured Categories</h3>
                <Swiper
                    slidesPerView={10}  // Adjust slides per view to match design
                    spaceBetween={8}  // Adjust spacing
                    slidesPerGroup={3}
                    navigation={true} 
                    modules={[Navigation]}
                    className="mySwiper"
                >
                    {itemBg.map((item, index) => (
                        <SwiperSlide key={index}>
                            <div className="item text-center" style={{ background: item }}>
                                <img src="https://www.safefood.net/getmedia/d81f679f-a5bc-4a16-a592-248d3b1dc803/burger_1.jpg?width=1280&height=720&ext=.jpg" alt="Red Apple"/>
                                <h6>Burger</h6>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
};

export default HomeCat;
