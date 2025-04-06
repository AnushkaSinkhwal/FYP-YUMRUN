// import 'bootstrap/dist/css/bootstrap.min.css';
// import './App.css';
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import Home from "./Pages/Home";
import Header from "./components/Header";
import Footer from './components/footer';
import { useState, createContext, useEffect, useContext } from 'react';
import ProductModel from './components/ProductModel';
import Listing from './Pages/Listing';
import ProductDetails from './Pages/ProductDetails';
import Cart from './Pages/Cart';
import SignIn from "./Pages/SignIn";
import SignUp from './Pages/SignUp';
import Profile from './Pages/Profile';
import SearchResults from "./Pages/Search";
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import BackToTop from './components/BackToTop';
import ScrollToTop from './components/ScrollToTop';
import { Spinner } from './components/ui';

// Admin imports
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./Pages/admin/Dashboard";
import AdminProducts from "./Pages/admin/Products";
import AdminCategory from "./Pages/admin/Category";
import AdminUsers from "./Pages/admin/Users";
import AdminSettings from "./Pages/admin/Settings";
import AdminRestaurants from "./Pages/admin/Restaurants";
import AdminNotifications from "./Pages/admin/Notifications";
import AdminDeliveries from "./Pages/admin/Deliveries";
import AdminOrders from "./Pages/admin/Orders";
import AdminProfile from "./Pages/admin/Profile";
import RestaurantApprovals from "./Pages/admin/RestaurantApprovals";

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

// Create Context for UI management
const MyContext = createContext();

function App() {
  const [isOpenProductModel, setIsOpenProductModel] = useState(false);
  const [isHeaderFooterShow, setisHeaderFooterShow] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
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
        if (!path.includes('/signin') && !path.includes('/signup')) {
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
    setIsLoading
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <MyContext.Provider value={values}>
            <ScrollToTop />
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
                <Route path="restaurants" element={<AdminRestaurants />} />
                <Route path="restaurant" element={<Navigate to="/admin/restaurants" replace />} />
                <Route path="categories" element={<AdminCategory />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="deliveries" element={<AdminDeliveries />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="profile" element={<AdminProfile />} />
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
                  {isOpenProductModel && <ProductModel />}
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
                  {isOpenProductModel && <ProductModel />}
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
                  {isOpenProductModel && <ProductModel />}
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
                  {isOpenProductModel && <ProductModel />}
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
                  {isOpenProductModel && <ProductModel />}
                  <BackToTop />
                </>
              } />
              
              <Route path="/signin" element={
                <>
                  <main id="main-content">
                    <SignIn />
                  </main>
                  {isOpenProductModel && <ProductModel />}
                  <BackToTop />
                </>
              } />
              
              <Route path="/signup" element={
                <>
                  <main id="main-content">
                    <SignUp />
                  </main>
                  {isOpenProductModel && <ProductModel />}
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
                  {isOpenProductModel && <ProductModel />}
                  <BackToTop />
                </>
              } />

              {/* Restaurant Routes */}
              <Route path="/restaurant" element={
                <ProtectedRoute allowedRoles={['restaurantOwner', 'restaurant']}>
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
              
              {/* Delivery Routes */}
              <Route path="/delivery" element={
                <ProtectedRoute allowedRoles={['deliveryRider']}>
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
            </Routes>
          </MyContext.Provider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
export { MyContext };
