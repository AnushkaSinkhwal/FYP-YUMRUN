import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import PropTypes from 'prop-types';
import { isValidObjectId, cleanObjectId } from '../utils/validationUtils';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

// Helper to generate a unique key for a cart item based on ID and customizations
const generateCartItemId = (item) => {
  const baseId = item.id || item._id;
  // Sort add-on IDs for consistency
  const addOnIds = (item.selectedAddOns || []).map(a => a.id).sort().join('-');
  // Include other relevant customizations if needed (e.g., serving size)
  const customizationKey = addOnIds; // Simplified for now
  return `${baseId}-${customizationKey}`;
};

export const CartProvider = ({ children }) => {
  // Initialize cart from localStorage or empty array
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    console.log('Loading cart from localStorage:', savedCart);
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('Parsed cart:', parsedCart);
        
        // Make sure unit prices are properly set
        return parsedCart.map(item => {
          // If unitPrice is missing but we have price and quantity, calculate it
          if (!item.unitPrice && item.price && item.quantity > 0) {
            item.unitPrice = item.price / item.quantity;
          }
          // If we have unitPrice but price is wrong or missing, fix it
          if (item.unitPrice && item.quantity > 0) {
            item.price = item.unitPrice * item.quantity;
          }
          return item;
        });
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        return [];
      }
    }
    return [];
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
    
    // CORRECTED: Calculate subTotal by summing the stored item.price 
    // (which already includes quantity and customizations)
    const subTotal = cartItems.reduce((total, item) => {
      return total + (item.price || 0); // Use the stored total price for the line item
    }, 0);
    
    // Calculate shipping based on subtotal
    // Always apply a Rs.100 delivery fee for any non-empty cart
    const shipping = subTotal > 0 ? 100 : 0; // Rs. 100 delivery fee per order

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
  const addToCart = (item) => { 
    // Extract necessary info from the item passed (from customizer or simple add)
    const { 
        id, name, image, quantity = 1, 
        basePrice = 0, selectedAddOns = [], customizationDetails = {}, 
        restaurantId, restaurantName
    } = item;

    // Ensure we have both a menuItemId (id) and restaurantId
    const menuItemId = id; // Store original id as menuItemId to avoid confusion
    
    if (!menuItemId) {
        console.error("Item missing menuItemId", item);
        addToast("Error adding item: Missing menu item information.", { type: 'error' });
        return;
    }

    if (!restaurantId) {
        console.error("Item missing restaurant ID", item);
        addToast("Error adding item: Missing restaurant information.", { type: 'error' });
        return;
    }

    // Clean and validate the IDs
    const cleanedMenuItemId = cleanObjectId(menuItemId);
    const cleanedRestaurantId = cleanObjectId(restaurantId);

    // Verify the IDs are in valid MongoDB format
    if (!isValidObjectId(cleanedMenuItemId)) {
        console.error("Invalid menu item ID format", menuItemId);
        addToast("Error adding item: Invalid menu item ID format.", { type: 'error' });
        return;
    }

    if (!isValidObjectId(cleanedRestaurantId)) {
        console.error("Invalid restaurant ID format", restaurantId);
        addToast("Error adding item: Invalid restaurant ID format.", { type: 'error' });
        return;
    }

    // *** ADDED LOGGING: Check values right before comparison ***
    console.log(`[CartContext] Comparing cleanedMenuItemId: ${cleanedMenuItemId} with cleanedRestaurantId: ${cleanedRestaurantId}`);
    // **********************************************************

    // Check for different restaurant conflict
    if (cartItems.length > 0 && cartItems[0].restaurantId !== cleanedRestaurantId) {
      console.error('Cart restaurant conflict:', {
        cartRestaurantId: cartItems[0].restaurantId,
        cartRestaurantName: cartItems[0].restaurantName,
        newItemRestaurantId: cleanedRestaurantId,
        newItemRestaurantName: restaurantName
      });
      addToast('Cannot add items from different restaurants. Clear cart first.', { type: 'error' });
      return;
    }

    // Modify cartItemId to include both menuItemId and restaurantId
    const cartItemId = generateCartItemId({...item, id: cleanedMenuItemId});

    // Directly use the unitPrice and price passed from the item argument.
    // The 'price' field from the customizer IS the total price for the quantity.
    // The 'unitPrice' field from the customizer IS the price for a single unit.
    const finalUnitPrice = item.unitPrice || 0; // Use the provided unitPrice
    const finalTotalPrice = item.price || 0;   // Use the provided total price

    console.log('Adding to cart:', {
      menuItemId: cleanedMenuItemId,
      restaurantId: cleanedRestaurantId,
      unitPrice: finalUnitPrice, // Log the correct unit price
      quantity, 
      totalPrice: finalTotalPrice // Log the correct total price
    });

    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        cartItem => cartItem.cartItemId === cartItemId
      );

      let updatedItems;
      let message;

      if (existingItemIndex >= 0) {
        // Update quantity and price of existing item
        updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        
        // Ensure we have a valid unitPrice
        const existingUnitPrice = existingItem.unitPrice || 
                                  (existingItem.price && existingItem.quantity ? 
                                   existingItem.price / existingItem.quantity : finalUnitPrice); // Fallback to correct unit price
        
        const newQuantity = existingItem.quantity + quantity; // Add the incoming quantity
        
        // Calculate new total price using the unit price
        const newTotalPrice = existingUnitPrice * newQuantity; 
        
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          unitPrice: existingUnitPrice, // Preserve the unit price
          price: Math.round(newTotalPrice * 100) / 100 // Update total price for this line item using correct unit price
        };
        message = `Updated ${name} quantity in cart`;
      } else {
        // Add new item with all details, including unitPrice
        updatedItems = [...prevItems, { 
            id: cleanedMenuItemId, // Store as menuItemId to be clear
            menuItemId: cleanedMenuItemId, // Explicitly store menuItemId
            cartItemId, 
            name,
            image,
            quantity,
            price: Math.round(finalTotalPrice * 100) / 100, // Use the total price passed in
            unitPrice: Math.round(finalUnitPrice * 100) / 100, // Use the unit price passed in
            basePrice,
            selectedAddOns,
            customizationDetails,
            restaurantId: cleanedRestaurantId, // Keep restaurant ID separate
            restaurantName
         }];
        message = `Added ${name} to cart`;
      }

      // Use setTimeout to avoid the React error about setState during render
      setTimeout(() => {
        addToast(message, { type: 'success', duration: 3000 });
      }, 0);
      
      return updatedItems;
    });
  };

  // Remove item from cart
  const removeFromCart = (cartItemId) => {
    // Get item name before removing it
    const itemToRemove = cartItems.find(item => item.cartItemId === cartItemId);
    
    setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemId));
    
    if (itemToRemove) {
      setTimeout(() => {
        addToast(`Removed ${itemToRemove.name} from cart`, { type: 'info', duration: 3000 });
      }, 0);
    }
  };

  // Update item quantity
  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    
    const itemToUpdate = cartItems.find(item => item.cartItemId === cartItemId);
    if (!itemToUpdate) return;

    const oldQuantity = itemToUpdate.quantity;
    
    // Ensure we have a valid unit price
    const unitPrice = itemToUpdate.unitPrice || itemToUpdate.basePrice || 
                     (itemToUpdate.price && itemToUpdate.quantity ? itemToUpdate.price / itemToUpdate.quantity : 0);
    
    // Calculate the new total price based on unit price
    const newTotalPrice = unitPrice * newQuantity;
    
    console.log('Updating quantity:', {
      itemId: itemToUpdate.id,
      name: itemToUpdate.name,
      oldQuantity,
      newQuantity,
      unitPrice,
      newTotalPrice
    });
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.cartItemId === cartItemId 
          ? { 
              ...item, 
              quantity: newQuantity, 
              price: Math.round(newTotalPrice * 100) / 100,
              unitPrice: unitPrice // Ensure unitPrice is always set
            } 
          : item
      )
    );
    
    if (newQuantity !== oldQuantity) {
      setTimeout(() => {
        addToast(`Updated ${itemToUpdate.name} quantity to ${newQuantity}`, { type: 'info', duration: 2000 });
      }, 0);
    }
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
    setTimeout(() => {
      addToast('Cart cleared', { type: 'info' });
    }, 0);
  };

  // Calculate subtotal for a specific item (using cartItemId)
  const getItemSubtotal = (cartItemId) => {
    const item = cartItems.find(item => item.cartItemId === cartItemId);
    // The stored price IS the subtotal for this item's quantity
    return item ? item.price : 0; 
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