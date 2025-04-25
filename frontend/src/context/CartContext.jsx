import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import PropTypes from 'prop-types';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  // Initialize cart from localStorage or empty array
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  // Access toast functionality
  const { addToast } = useToast();
  
  // Calculate cart statistics
  const [cartStats, setCartStats] = useState({
    totalItems: 0,
    subTotal: 0,
    total: 0,
    shipping: 0,
  });

  // Update cart stats whenever cartItems changes
  useEffect(() => {
    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    const subTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Calculate shipping based on subtotal
    let shipping = 0;
    if (subTotal > 0 && subTotal < 1000) {
      shipping = 100; // Rs. 100 delivery fee for orders under Rs. 1000
    }
    
    setCartStats({
      totalItems: itemCount,
      subTotal,
      shipping,
      total: subTotal + shipping,
    });
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Add item to cart
  const addToCart = (item, quantity = 1) => {
    // Try to get restaurantId from different possible locations
    let restaurantId = item.restaurantId || item.restaurant?.id || item.restaurant?._id;
    
    // If still no restaurantId, try to extract from item ID
    if (!restaurantId && item.id) {
      // Try colon separator first
      const colonParts = item.id.split(':');
      if (colonParts.length === 2) {
        restaurantId = colonParts[0];
      } else {
        // Try underscore separator as fallback
        const underscoreParts = item.id.split('_');
        if (underscoreParts.length > 1) {
          restaurantId = underscoreParts[0];
        }
      }
    }

    // If still no restaurantId, use the item ID itself as a last resort
    if (!restaurantId) {
      restaurantId = item.id;
      console.warn('Using item ID as restaurant ID:', restaurantId);
    }

    // Check if cart has items from a different restaurant
    if (cartItems.length > 0) {
      const existingRestaurantId = cartItems[0].restaurantId || 
                                 cartItems[0].restaurant?.id || 
                                 cartItems[0].restaurant?._id;
      
      if (existingRestaurantId && restaurantId && existingRestaurantId !== restaurantId) {
        addToast('Cannot add items from different restaurants to cart. Please clear your cart first.', { 
          type: 'error',
          duration: 7000 
        });
        return;
      }
    }

    // Get restaurant name
    let restaurantName = 'Restaurant';
    if (typeof item.restaurant === 'object' && item.restaurant?.name) {
      restaurantName = item.restaurant.name;
    } else if (typeof item.restaurant === 'string') {
      restaurantName = item.restaurant;
    }

    // Ensure the item has the restaurantId and restaurant info
    const itemWithRestaurant = {
      ...item,
      restaurantId,
      // Store restaurant as a string if it's just the name, otherwise normalize the object
      restaurant: typeof item.restaurant === 'string' 
        ? item.restaurant 
        : restaurantName
    };
    
    setCartItems(prevItems => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(
        cartItem => cartItem.id === item.id
      );

      let updatedItems;
      let message;

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };
        message = `Updated ${item.name} quantity in cart`;
      } else {
        // Add new item if it doesn't exist
        updatedItems = [...prevItems, { ...itemWithRestaurant, quantity }];
        message = `Added ${item.name} to cart`;
      }

      // Show toast notification
      addToast(message, { 
        type: 'success',
        duration: 3000
      });

      return updatedItems;
    });
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    // Get item name before removing it
    const itemToRemove = cartItems.find(item => item.id === itemId);
    
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    
    if (itemToRemove) {
      addToast(`Removed ${itemToRemove.name} from cart`, { 
        type: 'info',
        duration: 3000
      });
    }
  };

  // Update item quantity
  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    const itemToUpdate = cartItems.find(item => item.id === itemId);
    const oldQuantity = itemToUpdate?.quantity || 0;
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
    
    if (itemToUpdate && quantity !== oldQuantity) {
      addToast(`Updated ${itemToUpdate.name} quantity to ${quantity}`, { 
        type: 'info',
        duration: 2000
      });
    }
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
    addToast('Cart cleared', { type: 'info' });
  };

  // Calculate subtotal for a specific item
  const getItemSubtotal = (itemId) => {
    const item = cartItems.find(item => item.id === itemId);
    return item ? item.price * item.quantity : 0;
  };

  const value = {
    cartItems,
    cartStats,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemSubtotal
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

CartProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default CartContext; 