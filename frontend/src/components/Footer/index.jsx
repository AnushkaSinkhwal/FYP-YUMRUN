import { IoFastFood } from "react-icons/io5";
import { TbTruckDelivery } from "react-icons/tb";
import { MdLocalOffer } from "react-icons/md";
import { IoIosRestaurant } from "react-icons/io";
import { Link } from 'react-router-dom';
import { FaFacebook } from "react-icons/fa";
import { FaSquareInstagram } from "react-icons/fa6";
import { FaTwitterSquare } from "react-icons/fa";

const Footer = () => {
    return (
        <footer>
            <div className="container">
                <div className="topInfo row">
                    <div className="col d-flex align-items-center">
                        <span><IoFastFood /></span>
                        <span className="ml-2"> Everyday Fresh Products</span>
                    </div>

                    <div className="col d-flex align-items-center">
                        <span><TbTruckDelivery /></span>
                        <span className="ml-2">Free Delivery Above Rs.2500</span>
                    </div>

                    <div className="col d-flex align-items-center">
                        <span><MdLocalOffer /></span>
                        <span className="ml-2"> Daily Mega Discounts</span>
                    </div>

                    <div className="col d-flex align-items-center">
                        <span><IoIosRestaurant /></span>
                        <span className="ml-2">With the best restaurants</span>
                    </div>
                </div>

                <div className="row mt-5 linksWrap">
                    <div className="col">
                        <h5>Breakfast Specials</h5>
                        <ul>
                            <li><Link to="#">Pancakes & Coffee</Link></li>
                            <li><Link to="#">Avocado Toast</Link></li>
                            <li><Link to="#">Muesli & Fruit</Link></li>
                            <li><Link to="#">Scrambled Eggs & Toast</Link></li>
                            <li><Link to="#">Omelette with Vegetables</Link></li>
                            <li><Link to="#">Smoothie Bowls</Link></li>
                            <li><Link to="#">Granola with Yogurt</Link></li>
                        </ul>
                    </div>

                    <div className="col">
                        <h5>Lunch Options</h5>
                        <ul>
                            <li><Link to="#">Grilled Chicken Salad</Link></li>
                            <li><Link to="#">Vegetable Stir Fry</Link></li>
                            <li><Link to="#">Quinoa & Hummus</Link></li>
                            <li><Link to="#">Turkey Sandwich</Link></li>
                            <li><Link to="#">Caesar Salad</Link></li>
                            <li><Link to="#">Grilled Salmon</Link></li>
                            <li><Link to="#">Beef Wrap</Link></li>
                        </ul>
                    </div>

                    <div className="col">
                        <h5>Dinner Delights</h5>
                        <ul>
                            <li><Link to="#">Steak with Roasted Veggies</Link></li>
                            <li><Link to="#">Pasta Primavera</Link></li>
                            <li><Link to="#">Chicken Alfredo</Link></li>
                            <li><Link to="#">Vegetable Lasagna</Link></li>
                            <li><Link to="#">Grilled Shrimp</Link></li>
                            <li><Link to="#">Vegan Buddha Bowl</Link></li>
                            <li><Link to="#">Lamb Chops</Link></li>
                        </ul>
                    </div>

                    <div className="col">
                        <h5>Snacks & Sides</h5>
                        <ul>
                            <li><Link to="#">Sweet Potato Fries</Link></li>
                            <li><Link to="#">Garlic Bread</Link></li>
                            <li><Link to="#">Guacamole & Chips</Link></li>
                            <li><Link to="#">Cauliflower Bites</Link></li>
                            <li><Link to="#">Caprese Skewers</Link></li>
                            <li><Link to="#">Mozzarella Sticks</Link></li>
                            <li><Link to="#">Onion Rings</Link></li>
                        </ul>
                    </div>

                    <div className="col">
                        <h5>Drinks</h5>
                        <ul>
                            <li><Link to="#">Cold Brew Coffee</Link></li>
                            <li><Link to="#">Iced Tea</Link></li>
                            <li><Link to="#">Lemonade</Link></li>
                            <li><Link to="#">Fresh Juice</Link></li>
                            <li><Link to="#">Smoothies</Link></li>
                            <li><Link to="#">Herbal Tea</Link></li>
                            <li><Link to="#">Milkshakes</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="copyright mt-3 pt-3 pb-3 d-flex">
                    <p className="mb-0"> Copyright 2025. All rights reserved. </p>
                    <ul className="list list-inline ml-auto mb-0">
                        <li className="list-inline-item">
                            <Link to="#"><FaFacebook /></Link>
                        </li>
                        <li className="list-inline-item">
                            <Link to="#"><FaSquareInstagram /></Link>
                        </li>
                        <li className="list-inline-item">
                            <Link to="#"><FaTwitterSquare /></Link>
                        </li>
                    </ul>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
