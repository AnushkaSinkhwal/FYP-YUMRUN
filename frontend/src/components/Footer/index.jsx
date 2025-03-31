import { IoFastFood } from "react-icons/io5";
import { TbTruckDelivery } from "react-icons/tb";
import { MdLocalOffer, MdEmail } from "react-icons/md";
import { IoIosRestaurant } from "react-icons/io";
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitterSquare, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";
import { FaSquareInstagram } from "react-icons/fa6";
import logo from '../../assets/images/logo.png';
import { Container, Button, Input, Separator } from '../ui';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-200">
            {/* Features Section */}
            <div className="py-8 bg-gray-50">
                <Container>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="flex items-start space-x-4">
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-yumrun-primary/10 text-yumrun-primary">
                                <IoFastFood className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Fresh Products</h3>
                                <p className="text-sm text-gray-600">Daily fresh ingredients</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-yumrun-primary/10 text-yumrun-primary">
                                <TbTruckDelivery className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Free Delivery</h3>
                                <p className="text-sm text-gray-600">On orders over Rs.2500</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-yumrun-primary/10 text-yumrun-primary">
                                <MdLocalOffer className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Daily Offers</h3>
                                <p className="text-sm text-gray-600">Discounts up to 50% off</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-yumrun-primary/10 text-yumrun-primary">
                                <IoIosRestaurant className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Top Restaurants</h3>
                                <p className="text-sm text-gray-600">Quality guaranteed</p>
                            </div>
                        </div>
                    </div>
                </Container>
            </div>

            {/* Main Footer */}
            <div className="py-12 bg-white">
                <Container>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-2">
                            <Link to="/" className="inline-block">
                                <img src={logo} alt="YumRun" className="h-12 w-auto" />
                            </Link>
                            <p className="mt-4 text-gray-600 max-w-md">
                                Delivering delicious meals from your favorite restaurants straight to your door.
                            </p>
                            <div className="mt-6 space-y-3">
                                <div className="flex items-center text-gray-600">
                                    <FaMapMarkerAlt className="h-4 w-4 mr-3 text-yumrun-primary" />
                                    <span>123 Food Street, Kathmandu</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <FaPhoneAlt className="h-4 w-4 mr-3 text-yumrun-primary" />
                                    <span>+977 01-4123456</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <MdEmail className="h-4 w-4 mr-3 text-yumrun-primary" />
                                    <span>info@yumrun.com</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-medium text-gray-900 mb-4">Quick Links</h3>
                            <ul className="space-y-2">
                                <li><Link to="/" className="text-gray-600 hover:text-yumrun-primary transition-colors">Home</Link></li>
                                <li><Link to="/about" className="text-gray-600 hover:text-yumrun-primary transition-colors">About Us</Link></li>
                                <li><Link to="/restaurant" className="text-gray-600 hover:text-yumrun-primary transition-colors">Restaurants</Link></li>
                                <li><Link to="/menu" className="text-gray-600 hover:text-yumrun-primary transition-colors">Menu</Link></li>
                                <li><Link to="/contact" className="text-gray-600 hover:text-yumrun-primary transition-colors">Contact</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-medium text-gray-900 mb-4">Categories</h3>
                            <ul className="space-y-2">
                                <li><Link to="/cat/breakfast" className="text-gray-600 hover:text-yumrun-primary transition-colors">Breakfast</Link></li>
                                <li><Link to="/cat/lunch" className="text-gray-600 hover:text-yumrun-primary transition-colors">Lunch</Link></li>
                                <li><Link to="/cat/dinner" className="text-gray-600 hover:text-yumrun-primary transition-colors">Dinner</Link></li>
                                <li><Link to="/cat/drinks" className="text-gray-600 hover:text-yumrun-primary transition-colors">Drinks</Link></li>
                                <li><Link to="/cat/desserts" className="text-gray-600 hover:text-yumrun-primary transition-colors">Desserts</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-medium text-gray-900 mb-4">Newsletter</h3>
                            <p className="text-gray-600 mb-3">Subscribe to receive updates on our latest offers.</p>
                            <div className="space-y-2">
                                <Input 
                                    type="email" 
                                    placeholder="Your email address" 
                                    className="w-full" 
                                />
                                <Button className="w-full">Subscribe</Button>
                            </div>
                            <div className="mt-4 flex space-x-3">
                                <a href="#" className="text-gray-600 hover:text-yumrun-primary transition-colors">
                                    <FaFacebook className="h-6 w-6" />
                                </a>
                                <a href="#" className="text-gray-600 hover:text-yumrun-primary transition-colors">
                                    <FaSquareInstagram className="h-6 w-6" />
                                </a>
                                <a href="#" className="text-gray-600 hover:text-yumrun-primary transition-colors">
                                    <FaTwitterSquare className="h-6 w-6" />
                                </a>
                            </div>
                        </div>
                    </div>
                </Container>
            </div>

            {/* Copyright Section */}
            <Separator />
            <div className="py-6 bg-white">
                <Container>
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-600 text-sm">© 2025 YumRun. All rights reserved.</p>
                        <p className="text-gray-600 text-sm mt-2 md:mt-0">Designed & Developed with ❤️</p>
                    </div>
                </Container>
            </div>
        </footer>
    );
};

export default Footer;
