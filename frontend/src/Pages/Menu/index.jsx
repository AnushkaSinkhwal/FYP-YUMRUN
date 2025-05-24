import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Spinner, Button } from '../../components/ui';
import { FaFilter, FaSearch, FaShoppingCart, FaStar } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import axios from 'axios';
import { getBestImageUrl, PLACEHOLDERS } from '../../utils/imageUtils';
import { isValidObjectId, cleanObjectId } from '../../utils/validationUtils';

// Static menu categories matching restaurant dashboard options
const STATIC_MENU_CATEGORIES = [
  'Appetizers', 'Main Course', 'Desserts', 'Drinks', 'Beverages',
  'Sides', 'Specials', 'Breakfast', 'Lunch', 'Dinner', 'Vegan',
  'Vegetarian', 'Gluten-Free'
];

const Menu = () => {
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(
    () => searchParams.get('category')?.toLowerCase() || 'all'
  );
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    rating: 'all',
    sortBy: 'popularity'
  });

  // Use static categories for filtering
  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'popular', name: 'Most Popular' },
    ...STATIC_MENU_CATEGORIES.map(name => ({ id: name.toLowerCase(), name }))
  ];

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get API_URL from environment variables
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        
        // Fetch menu items from the API
        const response = await axios.get(`${API_URL}/menu`);
        console.log('Menu API response:', response.data);
        
        // *** ADDED LOGGING: Log raw data immediately after fetch ***
        console.log('[Menu Page] Raw data received from API:', response?.data?.data);
        // ***********************************************************

        if (response.data.success && Array.isArray(response.data.data)) {
          // Transform the API data to match our frontend format
          const formattedItems = response.data.data.map(item => {
            // Get menu item ID
            const menuItemId = item._id || item.id;
            
            // Get restaurant ID from various possible sources
            let restaurantId = null;
            if (item.restaurant?.id) {
              restaurantId = item.restaurant.id;
            } else if (item.restaurant?._id) {
              restaurantId = item.restaurant._id;
            } else if (typeof item.restaurant === 'string') {
              restaurantId = item.restaurant;
            }
            
            // Clean and validate both IDs
            const cleanedMenuItemId = cleanObjectId(menuItemId);
            const cleanedRestaurantId = restaurantId ? cleanObjectId(restaurantId) : null;
            
            // Check if menu item ID and restaurant ID are the same (invalid configuration)
            if (cleanedMenuItemId && cleanedRestaurantId && cleanedMenuItemId === cleanedRestaurantId) {
              console.warn(`Menu item ID and restaurant ID are the same for item "${item.name || 'Unknown'}"`);
              // *** ADDED LOGGING: Confirming this block is hit ***
              console.log(`[Menu Mapping] Nullifying restaurantId for item ${cleanedMenuItemId} because it matched restaurantId ${cleanedRestaurantId}`);
              // ***************************************************
              restaurantId = null; // Invalidate the restaurant ID so it gets filtered out
            }
            // Further validate the restaurant ID
            else if (restaurantId) {
              restaurantId = cleanedRestaurantId;
              if (!isValidObjectId(restaurantId)) {
                console.warn(`Invalid restaurant ID format for menu item ${item.name || item.item_name}: ${restaurantId}`);
                restaurantId = null;
              }
            }
            
            return {
              id: cleanedMenuItemId || `item-${Math.random().toString(36).substring(2, 9)}`,
              name: item.name || item.item_name || 'Unnamed Item',
              description: item.description || 'No description available',
              price: parseFloat(item.price || item.item_price || 0),
              originalPrice: item.originalPrice,
              discountedPrice: item.discountedPrice,
              offerDetails: item.offerDetails,
              rating: parseFloat(item.averageRating || 0),
              totalReviews: parseInt(item.numberOfRatings || 0, 10),
              category: (item.category || 'main course').toLowerCase(),
              restaurant: {
                id: restaurantId,
                name: item.restaurant?.name || 'Restaurant'
              },
              restaurantId: restaurantId, // Add explicit restaurantId field
              image: getBestImageUrl(item),
              isPopular: !!item.isPopular || item.numberOfRatings > 2 || item.averageRating > 4
            };
          });
          
          console.log('Formatted menu items:', formattedItems);
          // Filter out items with no valid restaurantId
          const validItems = formattedItems.filter(item => {
            if (!item.restaurantId) {
              return false;
            }
            // Double-check that menu item ID and restaurant ID are different
            if (item.id === item.restaurantId) {
              console.warn(`Filtering out menu item ${item.name} - ID and restaurant ID are the same`);
              return false;
            }
            return true;
          });
          console.log(`Filtered out ${formattedItems.length - validItems.length} items with missing/invalid restaurant IDs`);
          setMenuItems(validItems);
        } else {
          setError(response.data.message || 'Failed to fetch menu items');
          setMenuItems([]);
        }
      } catch (err) {
        console.error('Error fetching menu items:', err);
        setError('An error occurred while loading menu items');
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // Filter menu items based on active category, search, and other filters
  const filteredItems = menuItems.filter(item => {
    // Category filter
    if (activeCategory === 'popular' && !item.isPopular) {
      return false;
    } else if (activeCategory !== 'all' && activeCategory !== 'popular' && item.category !== activeCategory) {
      return false;
    }
    
    // Search filter
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Price range filter
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(val => parseFloat(val));
      if (item.price < min || (max && item.price > max)) {
        return false;
      }
    }
    
    // Rating filter
    if (filters.rating !== 'all') {
      const minRating = parseFloat(filters.rating);
      if (item.rating < minRating) {
        return false;
      }
    }
    
    return true;
  });

  // Sort items based on selected sort option
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (filters.sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'popularity':
      default:
        // For popularity, we'll use a combination of isPopular flag and rating
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return b.rating - a.rating;
    }
  });

  // Handle category change
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    // Update URL query param
    navigate(`/menu?category=${encodeURIComponent(categoryId)}`);
  };

  // Sync state when URL query param changes
  useEffect(() => {
    const param = searchParams.get('category');
    setActiveCategory(param?.toLowerCase() || 'all');
  }, [searchParams]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle add to cart
  const handleAddToCart = (item) => {
    // *** ADDED LOGGING: Inspect item object received by handler ***
    console.log('[Menu handleAddToCart] Item received:', JSON.stringify(item, null, 2));
    // ***************************************************************
    
    // First, clean the IDs
    const cleanedItemId = cleanObjectId(item.id);
    const cleanedRestaurantId = cleanObjectId(item.restaurantId);
    
    // Verify we have a valid restaurant ID
    if (!cleanedRestaurantId || !isValidObjectId(cleanedRestaurantId)) {
      console.error(`Cannot add to cart: Missing or invalid restaurant ID for ${item.name}`);
      addToast('Cannot add this item to cart due to missing restaurant information', { type: 'error' });
      return;
    }
    
    // Verify menu item ID is valid
    if (!cleanedItemId || !isValidObjectId(cleanedItemId)) {
      console.error(`Cannot add to cart: Invalid menu item ID for ${item.name}`);
      addToast('Cannot add this item to cart due to invalid item information', { type: 'error' });
      return;
    }
    
    // Verify menu item ID and restaurant ID are not the same (critical check)
    if (cleanedItemId === cleanedRestaurantId) {
      console.error(`Cannot add to cart: Menu item ID and restaurant ID are the same for ${item.name}`);
      addToast('Cannot add this item due to incorrect data configuration', { type: 'error' });
      return;
    }
    
    const priceToAdd = item.discountedPrice !== undefined ? item.discountedPrice : item.price;
    addToCart({
      id: cleanedItemId,
      name: item.name,
      price: priceToAdd,
      image: item.image,
      quantity: 1,
      restaurantId: cleanedRestaurantId,
      restaurantName: item.restaurant.name
    });
    console.log(`Added ${item.name} to cart at price ${priceToAdd}`);
  };

  return (
    <div className="py-10 bg-gray-50">
      <Container>
        <div className="mb-8">
          <h1 className="mb-6 text-3xl font-bold text-center">Our Menu</h1>
          
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yumrun-orange"
              />
              <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            </div>
          </div>
          
          {/* Categories Tabs */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex space-x-2 min-w-max">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === category.id 
                      ? 'bg-yumrun-orange text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Filters */}
          <div className="mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center mb-2 text-gray-700 hover:text-yumrun-orange"
            >
              <FaFilter className="mr-2" />
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </button>
            
            {showFilters && (
              <div className="p-4 bg-white rounded-lg shadow-md">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Price Range
                    </label>
                    <select
                      value={filters.priceRange}
                      onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yumrun-orange"
                    >
                      <option value="all">Any Price</option>
                      <option value="0-5">Under $5</option>
                      <option value="5-10">$5 to $10</option>
                      <option value="10-15">$10 to $15</option>
                      <option value="15-">$15 and above</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Rating
                    </label>
                    <select
                      value={filters.rating}
                      onChange={(e) => handleFilterChange('rating', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yumrun-orange"
                    >
                      <option value="all">Any Rating</option>
                      <option value="4.5">4.5+ Stars</option>
                      <option value="4">4+ Stars</option>
                      <option value="3.5">3.5+ Stars</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Sort By
                    </label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yumrun-orange"
                    >
                      <option value="popularity">Popularity</option>
                      <option value="rating">Rating</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="large" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600 bg-red-100 rounded-lg">
              {error}
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="p-4 text-center text-gray-600 bg-gray-100 rounded-lg">
              No menu items found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedItems.map(item => (
                <div key={item.id} onClick={() => navigate(`/product/${item.id}`)} className="overflow-hidden transition-transform bg-white border rounded-lg shadow-sm hover:shadow-md hover:scale-[1.01] cursor-pointer">
                  <div className="relative">
                    <img 
                      src={getBestImageUrl(item)} 
                      alt={item.name} 
                      className="object-cover w-full h-48"
                      onError={(e) => {
                        console.error(`Image load error for ${item.name}:`, e);
                        e.target.src = PLACEHOLDERS.FOOD;
                      }}
                    />
                    {item.offerDetails && (
                      <div className="absolute top-0 right-0 p-2 text-white rounded-bl-lg bg-yumrun-orange">
                        <span className="font-semibold">{item.offerDetails.percentage}% OFF</span>
                      </div>
                    )}
                    {item.isPopular && (
                      <div className="absolute top-0 left-0 m-2">
                        <span className="flex items-center px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
                          POPULAR
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-grow p-4">
                    <h3 className="mb-2 text-lg font-semibold text-gray-800 truncate">
                        {item.name}
                    </h3>
                    <p className="flex-grow mb-3 text-sm text-gray-600 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center text-sm text-gray-500">
                        <FaStar className="mr-1 text-yellow-500" />
                        <span>{item.rating.toFixed(1)} ({item.totalReviews})</span>
                      </div>
                      <div className="text-right">
                        {item.offerDetails ? (
                          <>
                            <div>
                              <span className="text-sm text-gray-500 line-through mr-1.5">
                                Rs. {item.originalPrice.toFixed(2)}
                              </span>
                              <span className="text-lg font-bold text-yumrun-red">
                                Rs. {item.discountedPrice.toFixed(2)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <span className="text-lg font-semibold text-gray-900">
                            Rs. {item.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button 
                      onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }} 
                      variant="primary" 
                      className="w-full mt-auto"
                    >
                      <FaShoppingCart className="mr-2" /> Add to Cart
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default Menu; 