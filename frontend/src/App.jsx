import { useEffect, useState, useContext } from "react";
import PropTypes from 'prop-types';
// import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { BrowserRouter, Route, Routes, useLocation, Link, Navigate } from "react-router-dom";
import Home from "./Pages/Home";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductModel from "./components/ProductModel";
import Cart from "./Pages/Cart";
import Checkout from "./Pages/Checkout";
import OrderConfirmation from "./Pages/OrderConfirmation";
import PaymentVerify from "./Pages/PaymentVerify";
import SearchResults from "./Pages/Search";
import SignIn from "./Pages/SignIn";
import SignUp from "./Pages/SignUp";
import Listing from "./Pages/Listing";
import ProductDetails from "./Pages/ProductDetails";
import Profile from "./Pages/Profile";
import BackToTop from "./components/BackToTop";
import RestaurantDetails from './Pages/RestaurantDetails';
import About from './Pages/About';
import Contact from './Pages/Contact';
import Restaurants from './Pages/Restaurants';
import Menu from './Pages/Menu';
import Shop from "./Pages/Shop";
import PaymentVerificationPage from './Pages/payment/Verify';
import OrderDetail from './Pages/order/OrderDetail';
import EmailVerification from './Pages/EmailVerification';

// Forgot/Reset Password pages
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword";

// Contexts
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { NotificationProvider } from "./context/NotificationContext";
import ScrollToTop from './components/ScrollToTop';
import { Spinner } from './components/ui';
import ProtectedRoute from './components/ProtectedRoute';
import { MyContext } from "./context/UIContext.js";

// Admin imports
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./Pages/admin/Dashboard";
import AdminUsers from "./Pages/admin/Users";
import AdminRestaurants from "./Pages/admin/Restaurants";
import AdminOrders from "./Pages/admin/Orders";
import AdminDeliveries from "./Pages/admin/Deliveries";
import AdminProfile from "./Pages/admin/Profile";
import AdminSettings from "./Pages/admin/Settings";
import AdminNotifications from "./Pages/admin/Notifications";
import RestaurantApprovals from "./Pages/admin/RestaurantApprovals";
import AdminRiders from "./Pages/Admin/Riders";

// Restaurant imports
import RestaurantLayout from "./components/restaurant/RestaurantLayout";
import RestaurantDashboard from "./Pages/restaurant/Dashboard";
import RestaurantMenu from "./Pages/restaurant/Menu";
import RestaurantOrders from "./Pages/restaurant/Orders";
import RestaurantProfile from "./Pages/restaurant/Profile";
import RestaurantAnalytics from "./Pages/restaurant/Analytics";
import RestaurantNotifications from "./Pages/restaurant/Notifications";
import RestaurantOffers from "./Pages/restaurant/Offers";

// Delivery imports
import DeliveryLayout from "./components/delivery/DeliveryLayout";
import DeliveryDashboard from "./Pages/delivery/Dashboard";
import DeliveryOrders from "./Pages/delivery/Orders";
import DeliveryHistory from "./Pages/delivery/History";
import DeliveryProfile from "./Pages/delivery/Profile";
import DeliveryEarnings from "./Pages/delivery/Earnings";
import DeliveryNotifications from "./Pages/delivery/Notifications";

// User imports
import UserLayout from "./components/user/UserLayout";
import UserDashboard from "./Pages/user/Dashboard";
import UserOrders from "./Pages/user/Orders";
import UserProfile from "./Pages/user/Profile";
import UserFavorites from "./Pages/user/Favorites";
import UserReviews from "./Pages/user/Reviews";
import UserRewards from "./Pages/user/Rewards";
import UserNotifications from "./Pages/user/Notifications";
import UserSettings from "./Pages/user/Settings";

// Placeholder pages
const PlaceholderPage = ({ title }) => (
  <div className="py-20 text-center">
    <h1 className="text-3xl font-bold">{title || 'Page Under Construction'}</h1>
    <p className="mt-4">This page is currently under development.</p>
    <Link to="/" className="inline-block px-6 py-2 mt-6 text-white rounded bg-yumrun-primary hover:bg-yumrun-primary-dark">
      Go Home
    </Link>
  </div>
);

PlaceholderPage.propTypes = {
  title: PropTypes.string
};

// Create a RouteChangeDetector component
const RouteChangeDetector = () => {
  const location = useLocation();
  const { setIsLoading } = useContext(MyContext);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname, setIsLoading]);

  return null;
};

function App() {
  const [isOpenProductModel, setIsOpenProductModel] = useState(false);
  const [isHeaderFooterShow, setisHeaderFooterShow] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [productId, setProductId] = useState(null);
  
  // UI state
  const [isHideSidebarAndHeader, setisHideSidebarAndHeader] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") ? localStorage.getItem("theme") : "light"
  );
  
  // Check if current path is admin path
  const [isAdminPath, setIsAdminPath] = useState(false);
  
  // Use pathname to track route changes
  const pathname = window.location.pathname;

  useEffect(() => {
    const checkAdminPath = () => {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        setIsAdminPath(true);
        setisHeaderFooterShow(false);
      } else {
        setIsAdminPath(false);
        if (!path.includes('/signin') && 
            !path.includes('/signup') && 
            !path.includes('/forgot-password') && 
            !path.includes('/reset-password')) {
          setisHeaderFooterShow(true);
        }
      }
    };

    checkAdminPath();
    window.addEventListener('popstate', checkAdminPath);
    
    return () => {
      window.removeEventListener('popstate', checkAdminPath);
    };
  }, [pathname, setIsAdminPath, setisHeaderFooterShow]);
  
  // Additional effect to ensure root path always shows header
  useEffect(() => {
    if (pathname === '/') {
      setisHeaderFooterShow(true);
    }
  }, [pathname, setisHeaderFooterShow]);

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark");
      document.body.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.add("light");
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const values = {
    // UI context values
    setIsOpenProductModel,
    isOpenProductModel,
    isHeaderFooterShow,
    setisHeaderFooterShow,
    isHideSidebarAndHeader,
    setisHideSidebarAndHeader,
    theme,
    setTheme,
    windowWidth,
    isAdminPath,
    setIsAdminPath,
    isLoading,
    setIsLoading,
    productId,
    setProductId
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <NotificationProvider>
              <MyContext.Provider value={values}>
                <RouteChangeDetector />
                {isLoading && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Spinner size="lg" className="text-white" />
                  </div>
                )}
                <a href="#main-content" className="skip-to-content">Skip to content</a>
                
                <Routes>
                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<AdminDashboard />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="restaurants" element={<AdminRestaurants />} />
                    <Route path="riders" element={<AdminRiders />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="deliveries" element={<AdminDeliveries />} />
                    <Route path="profile" element={<AdminProfile />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="notifications" element={<AdminNotifications />} />
                    <Route path="restaurant-approvals" element={<RestaurantApprovals />} />
                  </Route>
                  
                  {/* User Routes */}
                  <Route path="/" element={
                    <>
                      {isHeaderFooterShow && <Header />}
                      <main id="main-content">
                        <Home />
                      </main>
                      {isHeaderFooterShow && <Footer />}
                      {isOpenProductModel && <ProductModel productId={productId} />}
                      <BackToTop />
                    </>
                  } />
                  
                  {/* About Route */}
                  <Route path="/about" element={
                    <>
                      {isHeaderFooterShow && <Header />}
                      <main id="main-content">
                        <About />
                      </main>
                      {isHeaderFooterShow && <Footer />}
                      <BackToTop />
                    </>
                  } />
                  
                  {/* Contact Route */}
                  <Route path="/contact" element={
                    <>
                      {isHeaderFooterShow && <Header />}
                      <main id="main-content">
                        <Contact />
                      </main>
                      {isHeaderFooterShow && <Footer />}
                      <BackToTop />
                    </>
                  } />
                  
                  {/* Restaurants (plural) Route for users browsing restaurants */}
                  <Route path="/restaurants" element={
                    <>
                      {isHeaderFooterShow && <Header />}
                      <main id="main-content">
                        <Restaurants />
                      </main>
                      {isHeaderFooterShow && <Footer />}
                      <BackToTop />
                    </>
                  } />
                  
                  {/* Restaurant (singular) Routes for restaurant owners dashboard */}
                  <Route path="/restaurant" element={
                    <ProtectedRoute allowedRoles={['restaurant']}>
                      <RestaurantLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<RestaurantDashboard />} />
                    <Route path="dashboard" element={<RestaurantDashboard />} />
                    <Route path="menu" element={<RestaurantMenu />} />
                    <Route path="orders" element={<RestaurantOrders />} />
                    <Route path="profile" element={<RestaurantProfile />} />
                    <Route path="analytics" element={<RestaurantAnalytics />} />
                    <Route path="notifications" element={<RestaurantNotifications />} />
                    <Route path="offers" element={<RestaurantOffers />} />
                  </Route>
                  
                  {/* Menu Route */}
                  <Route path="/menu" element={
                    <>
                      {isHeaderFooterShow && <Header />}
                      <main id="main-content">
                        <Menu />
                      </main>
                      {isHeaderFooterShow && <Footer />}
                      <BackToTop />
                    </>
                  } />
                  
                  <Route path="/cat/:id" element={
                    <>
                      {isHeaderFooterShow && <Header />}
                      <main id="main-content">
                        <Listing />
                      </main>
                      {isHeaderFooterShow && <Footer />}
                      {isOpenProductModel && <ProductModel productId={productId} />}
                      <BackToTop />
                    </>
                  } />
                  
                  <Route path="/search" element={
                    <>
                      {isHeaderFooterShow && <Header />}
                      <main id="main-content">
                        <SearchResults />
                      </main>
                      {isHeaderFooterShow && <Footer />}
                      {isOpenProductModel && <ProductModel productId={productId} />}
                      <BackToTop />
                    </>
                  } />
                  
                  <Route path="/product/:id" element={
                    <>
                      {isHeaderFooterShow && <Header />}
                      <main id="main-content">
                        <ProductDetails />
                      </main>
                      {isHeaderFooterShow && <Footer />}
                      {isOpenProductModel && <ProductModel productId={productId} />}
                      <BackToTop />
                    </>
                  } />
                  
                  <Route path="/restaurant/:id" element={
                    <>
                      {isHeaderFooterShow && <Header />}
                      <main id="main-content">
                        <RestaurantDetails />
                      </main>
                      {isHeaderFooterShow && <Footer />}
                      {isOpenProductModel && <ProductModel productId={productId} />}
                      <BackToTop />
                    </>
                  } />
                  
                  <Route path="/cart" element={
                    <>
                      {isHeaderFooterShow && <Header />}
                      <main id="main-content">
                        <ProtectedRoute>
                          <Cart />
                        </ProtectedRoute>
                      </main>
                      {isHeaderFooterShow && <Footer />}
                      {isOpenProductModel && <ProductModel productId={productId} />}
                      <BackToTop />
                    </>
                  } />
                  
                  {/* Checkout Route */}
                  <Route path="/checkout" element={
                    <>
                      {isHeaderFooterShow && <Header />}
                      <main id="main-content">
                        <ProtectedRoute>
                          <Checkout />
                        </ProtectedRoute>
                      </main>
                      {isHeaderFooterShow && <Footer />}
                      {isOpenProductModel && <ProductModel productId={productId} />}
                      <BackToTop />
                    </>
                  } />
                  
                  {/* Order Confirmation Route */}
                  <Route path="/order-confirmation/:orderId" element={
                    <>
                      {isHeaderFooterShow && <Header />}
                      <main id="main-content">
                        <ProtectedRoute>
                          <OrderConfirmation />
                        </ProtectedRoute>
                      </main>
                      {isHeaderFooterShow && <Footer />}
                      {isOpenProductModel && <ProductModel productId={productId} />}
                      <BackToTop />
                    </>
                  } />
                  
                  <Route path="/signin" element={
                    <>
                      <main id="main-content">
                        <SignIn />
                      </main>
                      {isOpenProductModel && <ProductModel productId={productId} />}
                      <BackToTop />
                    </>
                  } />
                  
                  <Route path="/signup" element={
                    <>
                      <main id="main-content">
                        <SignUp />
                      </main>
                      {isOpenProductModel && <ProductModel productId={productId} />}
                      <BackToTop />
                    </>
                  } />

                  <Route path="/verify-email" element={
                    <>
                      <main id="main-content">
                        <EmailVerification />
                      </main>
                      <BackToTop />
                    </>
                  } />

                  <Route path="/profile" element={
                    <>
                      {isHeaderFooterShow && <Header />}
                      <main id="main-content">
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      </main>
                      {isHeaderFooterShow && <Footer />}
                      {isOpenProductModel && <ProductModel productId={productId} />}
                      <BackToTop />
                    </>
                  } />

                  {/* Delivery Routes */}
                  <Route path="/delivery" element={
                    <ProtectedRoute allowedRoles={['delivery_rider']}>
                      <DeliveryLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<DeliveryDashboard />} />
                    <Route path="dashboard" element={<DeliveryDashboard />} />
                    <Route path="orders" element={<DeliveryOrders />} />
                    <Route path="history" element={<DeliveryHistory />} />
                    <Route path="profile" element={<DeliveryProfile />} />
                    <Route path="earnings" element={<DeliveryEarnings />} />
                    <Route path="notifications" element={<DeliveryNotifications />} />
                  </Route>

                  {/* User Routes */}
                  <Route path="/user" element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <UserLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<UserDashboard />} />
                    <Route path="dashboard" element={<UserDashboard />} />
                    <Route path="orders" element={<UserOrders />} />
                    <Route path="profile" element={<UserProfile />} />
                    <Route path="settings" element={<UserSettings />} />
                    <Route path="favorites" element={<UserFavorites />} />
                    <Route path="reviews" element={<UserReviews />} />
                    <Route path="rewards" element={<UserRewards />} />
                    <Route path="notifications" element={<UserNotifications />} />
                  </Route>

                  {/* Payment Verify Route */}
                  <Route path="/payment-verify" element={
                    <>
                      {isHeaderFooterShow && <Header />}
                      <main id="main-content">
                        <PaymentVerify />
                      </main>
                      {isHeaderFooterShow && <Footer />}
                      {isOpenProductModel && <ProductModel productId={productId} />}
                      <BackToTop />
                    </>
                  } />

                  {/* Payment routes */}
                  <Route path="/payment/verify" element={<PaymentVerificationPage />} />

                  {/* Category/Shop/Favorites Placeholders */}
                  <Route path="/cat/shop" element={<LayoutWrapper><Shop /></LayoutWrapper>} />
                  <Route path="/cat/favourites" element={<LayoutWrapper><PlaceholderPage title="Favourites Page" /></LayoutWrapper>} />
                  <Route path="/cat/breakfast" element={<LayoutWrapper><PlaceholderPage title="Breakfast Category" /></LayoutWrapper>} />
                  <Route path="/cat/lunch" element={<LayoutWrapper><PlaceholderPage title="Lunch Category" /></LayoutWrapper>} />
                  <Route path="/cat/dinner" element={<LayoutWrapper><PlaceholderPage title="Dinner Category" /></LayoutWrapper>} />
                  <Route path="/cat/drinks" element={<LayoutWrapper><PlaceholderPage title="Drinks Category" /></LayoutWrapper>} />
                  <Route path="/cat/desserts" element={<LayoutWrapper><PlaceholderPage title="Desserts Category" /></LayoutWrapper>} />
                  
                  {/* Ensure other top-level pages use LayoutWrapper */} 
                  <Route path="/restaurants" element={<LayoutWrapper><Restaurants /></LayoutWrapper>} />
                  <Route path="/menu" element={<LayoutWrapper><Menu /></LayoutWrapper>} />

                  <Route path="/orders/:orderId" element={
                    <>
                      {isHeaderFooterShow && <Header />}
                      <main id="main-content">
                        <ProtectedRoute allowedRoles={['customer', 'admin', 'restaurant', 'delivery_rider']}>
                          <OrderDetail />
                        </ProtectedRoute>
                      </main>
                      {isHeaderFooterShow && <Footer />}
                      <BackToTop />
                    </>
                  } />

                  {/* Forgot Password Route */}
                  <Route path="/forgot-password" element={
                    <>
                      <main id="main-content">
                        <ForgotPassword />
                      </main>
                      <BackToTop />
                    </>
                  } />
                  {/* Reset Password Route */}
                  <Route path="/reset-password/:token" element={
                    <>
                      <main id="main-content">
                        <ResetPassword />
                      </main>
                      <BackToTop />
                    </>
                  } />

                  {/* Alias old /login path to /signin */}
                  <Route path="/login" element={<Navigate to="/signin" replace />} />
                </Routes>
                {isOpenProductModel && <ProductModel productId={productId} />}
                <BackToTop />
              </MyContext.Provider>
            </NotificationProvider>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Helper component to wrap pages with Header/Footer conditionally
const LayoutWrapper = ({ children }) => {
  const { isHeaderFooterShow } = useContext(MyContext);
  return (
    <>
      {isHeaderFooterShow && <Header />}
      <main id="main-content">{children}</main>
      {isHeaderFooterShow && <Footer />}
    </>
  );
};

LayoutWrapper.propTypes = {
  children: PropTypes.node.isRequired
};

export default App;
