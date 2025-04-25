import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Spinner, Button } from '../../components/ui';
import { FaFilter, FaSearch, FaShoppingCart, FaStar } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { getBestImageUrl, PLACEHOLDERS } from '../../utils/imageUtils';

const Menu = () => {
  const { addToCart } = useCart();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    rating: 'all',
    sortBy: 'popularity'
  });

  // Categories - will be dynamically populated based on available menu items
  const [categories, setCategories] = useState([
    { id: 'all', name: 'All Items' },
    { id: 'popular', name: 'Most Popular' }
  ]);

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
        
        if (response.data.success && Array.isArray(response.data.data)) {
          // Transform the API data to match our frontend format
          const formattedItems = response.data.data.map(item => {
            const restaurantId = item.restaurant?.id || item.restaurant?._id || 
              (typeof item.restaurant === 'string' ? item.restaurant : null);
            
            return {
              id: item._id || item.id || `item-${Math.random().toString(36).substring(2, 9)}`,
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
              image: getBestImageUrl(item),
              isPopular: !!item.isPopular || item.numberOfRatings > 2 || item.averageRating > 4
            };
          });
          
          console.log('Formatted menu items:', formattedItems);
          setMenuItems(formattedItems);
          
          // Extract all unique categories from the menu items
          const uniqueCategories = [...new Set(formattedItems.map(item => item.category))];
          // Create the categories array with 'all' and 'popular' at the beginning
          setCategories([
            { id: 'all', name: 'All Items' },
            { id: 'popular', name: 'Most Popular' },
            ...uniqueCategories.map(category => ({
              id: category,
              name: category.charAt(0).toUpperCase() + category.slice(1) // Capitalize first letter
            }))
          ]);
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
  };

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
    const priceToAdd = item.discountedPrice !== undefined ? item.discountedPrice : item.price;
    addToCart({
      id: item.id,
      name: item.name,
      price: priceToAdd,
      image: item.image,
      quantity: 1,
      restaurantId: item.restaurant.id,
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
                <div key={item.id} className="overflow-hidden transition-transform bg-white border rounded-lg shadow-sm hover:shadow-md hover:scale-[1.01]">
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
                      <div className="absolute top-0 right-0 p-2 bg-yumrun-orange text-white rounded-bl-lg">
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
                      <Link to={`/product/${item.id}`} className="hover:text-yumrun-orange">
                        {item.name}
                      </Link>
                    </h3>
                    <p className="mb-3 text-sm text-gray-600 flex-grow line-clamp-2">
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
                                ${item.originalPrice.toFixed(2)}
                              </span>
                              <span className="text-lg font-bold text-yumrun-red">
                                ${item.discountedPrice.toFixed(2)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <span className="text-lg font-semibold text-gray-900">
                            ${item.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleAddToCart(item)} 
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