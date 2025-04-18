import { Link } from "react-router-dom";
import Rating from '@mui/material/Rating';
import QuantityBox from "../../components/QuantityBox";
import { FiShoppingCart, FiTrash2, FiArrowLeft } from "react-icons/fi";
import { RiSecurePaymentLine } from "react-icons/ri";
import { IoStorefrontOutline } from "react-icons/io5";
import { useCart } from "../../context/CartContext";
import PropTypes from 'prop-types';
import {
  Card,
  Alert,
  Button,
  Container
} from "../../components/ui";

const CartItem = ({ item, updateQuantity, removeFromCart }) => {
  // Extract restaurant name safely
  const restaurantName = typeof item.restaurant === 'object' ? 
    item.restaurant.name : 
    typeof item.restaurant === 'string' ? 
      item.restaurant : 
      'Restaurant';

  return (
    <div className="flex flex-col gap-4 p-4 border-b border-gray-100 sm:flex-row">
      <div className="flex-shrink-0 w-full h-32 sm:w-32">
        <Link to={`/product/${item.id}`}>
          <img
            src={item.image}
            alt={item.name}
            className="object-cover w-full h-full rounded-md"
          />
        </Link>
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap justify-between">
          <div>
            <Link to={`/product/${item.id}`} className="text-lg font-medium transition-colors hover:text-yumrun-primary">
              {item.name}
            </Link>
            <div className="text-sm text-gray-500">
              {item.restaurant && (
                <div className="flex items-center">
                  <IoStorefrontOutline className="mr-1 text-yumrun-secondary h-3.5 w-3.5" />
                  <span>{restaurantName}</span>
                </div>
              )}
            </div>
            {item.rating && (
              <div className="mt-1">
                <Rating name="read-only" value={item.rating} readOnly precision={0.5} size="small" />
              </div>
            )}
            {item.cookingMethod && (
              <div className="mt-1 text-xs text-gray-500">
                <span>Method: {item.cookingMethod}</span>
                {item.servingSize && <span> • Size: {item.servingSize} person</span>}
              </div>
            )}
          </div>
          
          <div className="text-lg font-medium text-yumrun-accent">
            Rs.{item.price}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <QuantityBox
            initialValue={item.quantity}
            onChange={(newQuantity) => updateQuantity(item.id, newQuantity)}
            className="max-w-28"
          />
          
          <div className="flex items-center gap-4">
            <div className="text-lg font-medium">
              Rs.{item.price * item.quantity}
            </div>
            
            <button
              onClick={() => removeFromCart(item.id)}
              className="text-red-500 transition-colors hover:text-red-700"
              aria-label="Remove item"
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

CartItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    quantity: PropTypes.number.isRequired,
    rating: PropTypes.number,
    restaurant: PropTypes.string,
    cookingMethod: PropTypes.string,
    servingSize: PropTypes.number
  }).isRequired,
  updateQuantity: PropTypes.func.isRequired,
  removeFromCart: PropTypes.func.isRequired
};

const EmptyCart = () => {
  return (
    <Card className="p-8 text-center">
      <div className="flex justify-center mb-4">
        <FiShoppingCart className="w-16 h-16 text-gray-300" />
      </div>
      <h3 className="mb-2 text-xl font-medium">Your cart is empty</h3>
      <p className="mb-6 text-gray-500">Looks like you haven't added anything to your cart yet.</p>
      <Button asChild>
        <Link to="/">Browse Food</Link>
      </Button>
    </Card>
  );
};

const Cart = () => {
  const { cartItems, cartStats, removeFromCart, updateQuantity } = useCart();

  return (
    <section className="py-10">
      <Container>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Shopping Cart</h1>
          {cartItems.length > 0 && (
            <div className="text-gray-600">
              {cartStats.totalItems} {cartStats.totalItems === 1 ? 'item' : 'items'}
            </div>
          )}
        </div>

        {cartItems.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <h2 className="font-medium">Cart Items</h2>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      updateQuantity={updateQuantity}
                      removeFromCart={removeFromCart}
                    />
                  ))}
                </div>
                
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <Link 
                    to="/" 
                    className="inline-flex items-center transition-colors text-yumrun-primary hover:text-yumrun-secondary"
                  >
                    <FiArrowLeft className="mr-2" />
                    Continue Shopping
                  </Link>
                </div>
              </Card>
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <Card className="overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-medium">Order Summary</h2>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">Rs.{cartStats.subTotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium">
                        {cartStats.shipping === 0 ? 'Free' : `Rs.${cartStats.shipping.toFixed(2)}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Estimated for</span>
                      <span className="font-medium">Bhaktapur</span>
                    </div>
                    
                    <div className="h-px my-3 bg-gray-100"></div>
                    
                    <div className="flex items-center justify-between font-medium">
                      <span>Total</span>
                      <span className="text-lg text-yumrun-accent">Rs.{cartStats.total.toFixed(2)}</span>
                    </div>
                    
                    <div className="pt-4 mt-4">
                      <Button 
                        className="w-full py-3" 
                        size="lg"
                        asChild
                      >
                        <Link to="/checkout" className="flex items-center justify-center">
                          <RiSecurePaymentLine className="w-5 h-5 mr-2" />
                          Proceed to Checkout
                        </Link>
                      </Button>
                      
                      <div className="mt-4 text-xs text-center text-gray-500">
                        <p>By completing your purchase, you agree to these <Link to="/terms" className="underline">Terms of Service</Link>.</p>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 mt-4">
                  <Alert variant="info" className="mb-0">
                    <p className="text-sm">Free delivery on orders above Rs.1000</p>
                  </Alert>
                </Card>
              </div>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
};

export default Cart;
