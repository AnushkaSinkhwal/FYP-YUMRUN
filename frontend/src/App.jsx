import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./Pages/Home";
import Header from "./components/Header";
import Footer from './components/footer';
import { useState, createContext } from 'react';
import ProductModel from './components/ProductModel';
import Listing from './Pages/Listing';
import ProductDetails from './Pages/ProductDetails';
import Cart from './Pages/Cart';
import SignIn from "./Pages/SignIn";
import SignUp from './Pages/SignUp';

// Create MyContext
const MyContext = createContext();

function App() {
  const [isOpenProductModel, setIsOpenProductModel] = useState(false);
  const [isHeaderFooterShow, setisHeaderFooterShow] = useState(true);
  const[isLogin,setIsLogin]=useState(false);

  const values = {
    setIsOpenProductModel,
    isOpenProductModel,
    isHeaderFooterShow,
    setisHeaderFooterShow,
    isLogin,
    setIsLogin
  };

  return (
    <BrowserRouter>
      <MyContext.Provider value={values}>
        {isHeaderFooterShow && <Header />}

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cat/:id" element={<Listing />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/signIn" element={<SignIn />} />
          <Route path="/signUp" element={<SignUp/>} />
        </Routes>

        {isHeaderFooterShow && <Footer />} {/* ✅ Fix applied here */}

        {isOpenProductModel && <ProductModel />}
      </MyContext.Provider>
    </BrowserRouter>
  );
}

export default App;
export { MyContext };
