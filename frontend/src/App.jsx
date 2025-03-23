import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
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

// Admin imports
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./Pages/admin/Dashboard";
import AdminLogin from "./Pages/admin/Login";
import AdminProducts from "./Pages/admin/Products";
import AdminCategory from "./Pages/admin/Category";
import AdminUsers from "./Pages/admin/Users";
import AdminSettings from "./Pages/admin/Settings";
import AdminRestaurants from "./Pages/admin/Restaurants";

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
  }, [setIsAdminPath, setisHeaderFooterShow]);

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
            <div className="page-loading">
              <div className="page-loading-spinner"></div>
            </div>
          )}
          <a href="#main-content" className="skip-to-content">Skip to content</a>
          
          <Routes>
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
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
              <Route path="settings" element={<AdminSettings />} />
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
