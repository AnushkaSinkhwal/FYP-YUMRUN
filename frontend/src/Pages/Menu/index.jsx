import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Spinner, Button } from '../../components/ui';
import { FaStar, FaFire, FaFilter, FaUtensils, FaSearch } from 'react-icons/fa';
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

  // Categories
  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'popular', name: 'Most Popular' },
    { id: 'breakfast', name: 'Breakfast' },
    { id: 'lunch', name: 'Lunch' },
    { id: 'dinner', name: 'Dinner' },
    { id: 'appetizers', name: 'Appetizers' },
    { id: 'desserts', name: 'Desserts' },
    { id: 'drinks', name: 'Drinks' }
  ];

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // In a real app, this would include query params for filtering
        const response = await axios.get('/api/menu-items');
        if (response.data.success) {
          setMenuItems(response.data.data || []);
        } else {
          setError(response.data.message || 'Failed to fetch menu items');
        }
      } catch (err) {
        console.error('Error fetching menu items:', err);
        setError('An error occurred while loading menu items');
        
        // For demo purposes, set some mock data if API fails
        setMenuItems([
          {
            id: 1,
            name: 'Classic Cheeseburger',
            description: 'Juicy beef patty with melted cheese, lettuce, tomato, and special sauce',
            price: 8.99,
            rating: 4.7,
            totalReviews: 120,
            category: 'lunch',
            restaurant: { id: 1, name: 'Burger Kingdom' },
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
            isPopular: true
          },
          {
            id: 2,
            name: 'Margherita Pizza',
            description: 'Classic pizza with tomato sauce, mozzarella cheese, and fresh basil',
            price: 12.99,
            rating: 4.5,
            totalReviews: 85,
            category: 'dinner',
            restaurant: { id: 2, name: 'Pizza Paradise' },
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
            isPopular: true
          },
          {
            id: 3,
            name: 'Salmon Sushi Roll',
            description: 'Fresh salmon, avocado, and cucumber wrapped in seaweed and rice',
            price: 14.99,
            rating: 4.9,
            totalReviews: 65,
            category: 'dinner',
            restaurant: { id: 3, name: 'Sushi Supreme' },
            image: 'https://images.unsplash.com/photo-1563612116625-3012372fccce?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
            isPopular: true
          },
          {
            id: 4,
            name: 'Beef Tacos',
            description: 'Three soft tacos with seasoned beef, lettuce, cheese, and salsa',
            price: 9.99,
            rating: 4.2,
            totalReviews: 45,
            category: 'lunch',
            restaurant: { id: 4, name: 'Taco Temple' },
            image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
            isPopular: false
          },
          {
            id: 5,
            name: 'Chicken Curry',
            description: 'Tender chicken pieces in a rich and spicy curry sauce with rice',
            price: 13.99,
            rating: 4.6,
            totalReviews: 78,
            category: 'dinner',
            restaurant: { id: 5, name: 'Curry Corner' },
            image: 'https://images.unsplash.com/photo-1585937421612-70a008356c36?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
            isPopular: true
          },
          {
            id: 6,
            name: 'Pad Thai',
            description: 'Stir-fried rice noodles with eggs, tofu, bean sprouts, and peanuts',
            price: 11.99,
            rating: 4.4,
            totalReviews: 56,
            category: 'dinner',
            restaurant: { id: 6, name: 'Noodle Nook' },
            image: 'https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
            isPopular: false
          },
          {
            id: 7,
            name: 'Avocado Toast',
            description: 'Toasted sourdough bread topped with mashed avocado, eggs, and microgreens',
            price: 8.99,
            rating: 4.3,
            totalReviews: 42,
            category: 'breakfast',
            restaurant: { id: 2, name: 'Pizza Paradise' },
            image: 'https://images.unsplash.com/photo-1603046891726-56f56a782bbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
            isPopular: false
          },
          {
            id: 8,
            name: 'Chocolate Lava Cake',
            description: 'Warm chocolate cake with a gooey molten center, served with vanilla ice cream',
            price: 6.99,
            rating: 4.8,
            totalReviews: 89,
            category: 'desserts',
            restaurant: { id: 1, name: 'Burger Kingdom' },
            image: 'https://images.unsplash.com/photo-1615583724355-e4b6f6f5a5f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
            isPopular: true
          },
          {
            id: 9,
            name: 'Fresh Strawberry Smoothie',
            description: 'Blend of fresh strawberries, yogurt, and a hint of honey',
            price: 4.99,
            rating: 4.5,
            totalReviews: 37,
            category: 'drinks',
            restaurant: { id: 5, name: 'Curry Corner' },
            image: 'https://images.unsplash.com/photo-1553530666-ba11a7d3be3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
            isPopular: false
          },
          {
            id: 10,
            name: 'Loaded Nachos',
            description: 'Crispy tortilla chips topped with melted cheese, jalapeños, guacamole, and sour cream',
            price: 7.99,
            rating: 4.1,
            totalReviews: 29,
            category: 'appetizers',
            restaurant: { id: 4, name: 'Taco Temple' },
            image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
            isPopular: false
          }
        ]);
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
          <h1 className="text-3xl font-bold mb-6 text-center">Our Menu</h1>
          
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yumrun-orange"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
              className="flex items-center text-gray-700 hover:text-yumrun-orange mb-2"
            >
              <FaFilter className="mr-2" />
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </button>
            
            {showFilters && (
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
              {error}
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FaUtensils className="mx-auto text-4xl text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Menu Items Found</h3>
              <p className="text-gray-600 mb-4">
                We couldn't find any items matching your criteria.
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
                      className="w-full h-48 object-cover"
                      onClick={() => navigate(`/product/${item.id}`)}
                      style={{ cursor: 'pointer' }}
                    />
                    {item.isPopular && (
                      <div className="absolute top-0 left-0 m-2">
                        <span className="flex items-center px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
                          <FaFire className="mr-1" /> Popular
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 
                        className="text-lg font-semibold text-gray-800 hover:text-yumrun-orange cursor-pointer"
                        onClick={() => navigate(`/product/${item.id}`)}
                      >
                        {item.name}
                      </h3>
                      <span className="font-bold text-yumrun-orange">${item.price.toFixed(2)}</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center mb-3">
                      <div className="flex items-center">
                        <FaStar className="text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">{item.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500 ml-1">({item.totalReviews} reviews)</span>
                      <Link 
                        to={`/restaurant/${item.restaurant.id}`} 
                        className="ml-auto text-sm text-gray-600 hover:text-yumrun-orange"
                      >
                        {item.restaurant.name}
                      </Link>
                    </div>
                    
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