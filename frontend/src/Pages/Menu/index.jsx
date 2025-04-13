import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Spinner, Button } from '../../components/ui';
import { FaFire, FaFilter, FaUtensils, FaSearch } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import axios from 'axios';

const Menu = () => {
  const navigate = useNavigate();
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
            // Extract restaurant info safely
            const restaurantId = item.restaurant?.id || item.restaurant?._id || 
              (typeof item.restaurant === 'string' ? item.restaurant : null);
            
            return {
              id: item._id || item.id || `item-${Math.random().toString(36).substring(2, 9)}`,
              name: item.name || item.item_name || 'Unnamed Item',
              description: item.description || 'No description available',
              price: parseFloat(item.price || item.item_price || 0),
              rating: parseFloat(item.averageRating || 0),
              totalReviews: parseInt(item.numberOfRatings || 0, 10),
              category: (item.category || 'main course').toLowerCase(),
              restaurant: {
                id: restaurantId,
                name: item.restaurant?.name || 'Restaurant'
              },
              image: item.image || `https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=300&auto=format&q=80`,
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
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      restaurantId: item.restaurant.id,
      restaurantName: item.restaurant.name
    });
  };

  return (
    <div className="py-10">
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
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg shadow-md">
              <FaUtensils className="mx-auto mb-4 text-4xl text-gray-300" />
              <h3 className="mb-2 text-xl font-semibold">No Menu Items Found</h3>
              <p className="mb-4 text-gray-600">
                We couldn&apos;t find any items matching your criteria.
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                  setFilters({ priceRange: 'all', rating: 'all', sortBy: 'popularity' });
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:scale-[1.02]">
                  <div className="relative">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="object-cover w-full h-48"
                      onClick={() => navigate(`/product/${item.id}`)}
                      style={{ cursor: 'pointer' }}
                    />
                    {item.isPopular && (
                      <div className="absolute top-0 left-0 m-2">
                        <span className="flex items-center px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
                          <FaFire className="mr-1" /> Popular
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 
                        className="text-lg font-semibold text-gray-800 cursor-pointer hover:text-yumrun-orange"
                        onClick={() => navigate(`/product/${item.id}`)}
                      >
                        {item.name}
                      </h3>
                      <span className="font-bold text-yumrun-orange">${item.price.toFixed(2)}</span>
                    </div>
                    
                    <p className="mb-3 text-sm text-gray-600 line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center mb-3">
                      <div className="flex items-center mr-2">
                        <span className="mr-1 text-yellow-400">★</span>
                        <span>{item.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        ({item.totalReviews} {item.totalReviews === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                    
                    <Link 
                      to={`/restaurant/${item.restaurant.id}`} 
                      className="mb-3 text-sm text-gray-600 hover:text-yumrun-orange"
                    >
                      {item.restaurant.name}
                    </Link>
                    
                    <Button 
                      onClick={() => handleAddToCart(item)}
                      className="w-full"
                    >
                      Add to Cart
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