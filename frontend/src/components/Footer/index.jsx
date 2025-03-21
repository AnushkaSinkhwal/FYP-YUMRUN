import { IoFastFood } from "react-icons/io5";
import { TbTruckDelivery } from "react-icons/tb";
import { MdLocalOffer, MdEmail } from "react-icons/md";
import { IoIosRestaurant } from "react-icons/io";
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitterSquare, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";
import { FaSquareInstagram } from "react-icons/fa6";
import logo from '../../assets/images/logo.png';

const Footer = () => {
    return (
        <footer className="footer-section">
            <div className="features-section py-4">
                <div className="container">
                    <div className="row features-row">
                        <div className="col-lg-3 col-md-6 col-sm-12 feature-item">
                            <div className="feature-box d-flex align-items-center">
                                <div className="feature-icon">
                                    <IoFastFood />
                                </div>
                                <div className="feature-text">
                                    <h5 className="mb-0">Fresh Products</h5>
                                    <p className="mb-0">Daily fresh ingredients</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 col-sm-12 feature-item">
                            <div className="feature-box d-flex align-items-center">
                                <div className="feature-icon">
                                    <TbTruckDelivery />
                                </div>
                                <div className="feature-text">
                                    <h5 className="mb-0">Free Delivery</h5>
                                    <p className="mb-0">On orders over Rs.2500</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 col-sm-12 feature-item">
                            <div className="feature-box d-flex align-items-center">
                                <div className="feature-icon">
                                    <MdLocalOffer />
                                </div>
                                <div className="feature-text">
                                    <h5 className="mb-0">Daily Offers</h5>
                                    <p className="mb-0">Discounts up to 50% off</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 col-sm-12 feature-item">
                            <div className="feature-box d-flex align-items-center">
                                <div className="feature-icon">
                                    <IoIosRestaurant />
                                </div>
                                <div className="feature-text">
                                    <h5 className="mb-0">Top Restaurants</h5>
                                    <p className="mb-0">Quality guaranteed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="main-footer py-5">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-3 col-md-6 col-sm-12 footer-col">
                            <div className="footer-logo">
                                <img src={logo} alt="YumRun" className="img-fluid" />
                            </div>
                            <p className="mt-3">Delivering delicious meals from your favorite restaurants straight to your door.</p>
                            <div className="contact-info">
                                <div className="d-flex align-items-center mb-2">
                                    <FaMapMarkerAlt className="contact-icon" />
                                    <span>123 Food Street, Kathmandu</span>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <FaPhoneAlt className="contact-icon" />
                                    <span>+977 01-4123456</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <MdEmail className="contact-icon" />
                                    <span>info@yumrun.com</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-2 col-md-6 col-sm-12 footer-col">
                            <h5 className="footer-heading">Quick Links</h5>
                            <ul className="footer-links">
                                <li><Link to="/">Home</Link></li>
                                <li><Link to="/about">About Us</Link></li>
                                <li><Link to="/restaurants">Restaurants</Link></li>
                                <li><Link to="/menu">Menu</Link></li>
                                <li><Link to="/contact">Contact</Link></li>
                            </ul>
                        </div>

                        <div className="col-lg-2 col-md-4 col-sm-12 footer-col">
                            <h5 className="footer-heading">Categories</h5>
                            <ul className="footer-links">
                                <li><Link to="/cat/breakfast">Breakfast</Link></li>
                                <li><Link to="/cat/lunch">Lunch</Link></li>
                                <li><Link to="/cat/dinner">Dinner</Link></li>
                                <li><Link to="/cat/drinks">Drinks</Link></li>
                                <li><Link to="/cat/desserts">Desserts</Link></li>
                            </ul>
                        </div>

                        <div className="col-lg-2 col-md-4 col-sm-12 footer-col">
                            <h5 className="footer-heading">Help</h5>
                            <ul className="footer-links">
                                <li><Link to="/faq">FAQ</Link></li>
                                <li><Link to="/terms">Terms of Service</Link></li>
                                <li><Link to="/privacy">Privacy Policy</Link></li>
                                <li><Link to="/shipping">Shipping</Link></li>
                                <li><Link to="/returns">Returns</Link></li>
                            </ul>
                        </div>

                        <div className="col-lg-3 col-md-4 col-sm-12 footer-col">
                            <h5 className="footer-heading">Newsletter</h5>
                            <p>Subscribe to receive updates on our latest offers.</p>
                            <div className="newsletter-form">
                                <input type="email" placeholder="Your email address" className="form-control mb-2" />
                                <button className="btn btn-primary w-100">Subscribe</button>
                            </div>
                            <div className="social-icons mt-3">
                                <Link to="#" className="social-icon"><FaFacebook /></Link>
                                <Link to="#" className="social-icon"><FaSquareInstagram /></Link>
                                <Link to="#" className="social-icon"><FaTwitterSquare /></Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="copyright-section">
                <div className="container">
                    <div className="row">
                        <div className="col-md-6">
                            <p className="mb-0">© 2025 YumRun. All rights reserved.</p>
                        </div>
                        <div className="col-md-6 text-md-right">
                            <p className="mb-0">Designed & Developed with ❤️</p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
