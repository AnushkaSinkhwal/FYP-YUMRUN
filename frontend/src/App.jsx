// import 'bootstrap/dist/css/bootstrap.min.css';
// import './App.css';
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
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
import { AuthProvider } from './context/AuthContext';
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
        <MyContext.Provider value={values}>
          <ScrollToTop />
          <RouteChangeDetector />
          {isLoading && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
              <Spinner size="lg" className="text-white" />
            </div>
          )}
          <a href="#main-content" className="skip-to-content">Skip to content</a>
          
          <Routes>
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="restaurants" element={<AdminRestaurants />} />
              <Route path="categories" element={<AdminCategory />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="deliveries" element={<AdminDeliveries />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="profile" element={<AdminProfile />} />
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
          </Routes>
        </MyContext.Provider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
export { MyContext };
