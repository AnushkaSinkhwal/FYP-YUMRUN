import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Button, Spinner } from '../../components/ui';
import { FaStar, FaMapMarkerAlt, FaUtensils, FaClock, FaSearch } from 'react-icons/fa';
import axios from 'axios';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    cuisine: 'all',
    rating: 'all',
    priceRange: 'all'
  });

  // Fetch restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // In a real app, this would include query params for filtering
        const response = await axios.get('/api/restaurants');
        if (response.data.success) {
          setRestaurants(response.data.data || []);
        } else {
          setError(response.data.message || 'Failed to fetch restaurants');
        }
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setError('An error occurred while loading restaurants');
        
        // For demo purposes, set some mock data if API fails
        setRestaurants([
          {
            id: 1,
            name: 'Burger Kingdom',
            rating: 4.5,
            totalReviews: 120,
            cuisine: 'Fast Food',
            priceRange: '$$',
            deliveryTime: '20-30 min',
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
            address: '123 Main St, Foodie District',
            isOpen: true
          },
          {
            id: 2,
            name: 'Pizza Paradise',
            rating: 4.2,
            totalReviews: 85,
            cuisine: 'Italian',
            priceRange: '$$',
            deliveryTime: '25-35 min',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
            address: '456 Oak Avenue, Downtown',
            isOpen: true
          },
          {
            id: 3,
            name: 'Sushi Supreme',
            rating: 4.8,
            totalReviews: 210,
            cuisine: 'Japanese',
            priceRange: '$$$',
            deliveryTime: '30-40 min',
            image: 'https://images.unsplash.com/photo-1563612116625-3012372fccce?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
            address: '789 Cherry Lane, Uptown',
            isOpen: true
          },
          {
            id: 4,
            name: 'Taco Temple',
            rating: 4.1,
            totalReviews: 65,
            cuisine: 'Mexican',
            priceRange: '$',
            deliveryTime: '15-25 min',
            image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
            address: '101 Pine Street, West End',
            isOpen: false
          },
          {
            id: 5,
            name: 'Curry Corner',
            rating: 4.4,
            totalReviews: 95,
            cuisine: 'Indian',
            priceRange: '$$',
            deliveryTime: '35-45 min',
            image: 'https://images.unsplash.com/photo-1585937421612-70a008356c36?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
            address: '202 Maple Drive, East Side',
            isOpen: true
          },
          {
            id: 6,
            name: 'Noodle Nook',
            rating: 4.3,
            totalReviews: 78,
            cuisine: 'Thai',
            priceRange: '$$',
            deliveryTime: '25-35 min',
            image: 'https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80',
            address: '303 Cedar Road, North District',
            isOpen: true
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  // Filter restaurants based on search and filters
  const filteredRestaurants = restaurants.filter(restaurant => {
    // Search filter
    if (searchQuery && !restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Cuisine filter
    if (filters.cuisine !== 'all' && restaurant.cuisine !== filters.cuisine) {
      return false;
    }
    
    // Rating filter
    if (filters.rating !== 'all') {
      const minRating = parseInt(filters.rating);
      if (restaurant.rating < minRating) {
        return false;
      }
    }
    
    // Price range filter
    if (filters.priceRange !== 'all' && restaurant.priceRange !== filters.priceRange) {
      return false;
    }
    
    return true;
  });

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

  return (
    <div className="py-10">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6 text-center">All Restaurants</h1>
          
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
              <div className="flex-1 mb-4 md:mb-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search restaurants or cuisines..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yumrun-orange"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <select
                  value={filters.cuisine}
                  onChange={(e) => handleFilterChange('cuisine', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yumrun-orange"
                >
                  <option value="all">All Cuisines</option>
                  <option value="Fast Food">Fast Food</option>
                  <option value="Italian">Italian</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Mexican">Mexican</option>
                  <option value="Indian">Indian</option>
                  <option value="Thai">Thai</option>
                </select>
                
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yumrun-orange"
                >
                  <option value="all">All Ratings</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </select>
                
                <select
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yumrun-orange"
                >
                  <option value="all">All Prices</option>
                  <option value="$">$</option>
                  <option value="$$">$$</option>
                  <option value="$$$">$$$</option>
                </select>
              </div>
            </div>
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
          ) : filteredRestaurants.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FaUtensils className="mx-auto text-4xl text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Restaurants Found</h3>
              <p className="text-gray-600 mb-4">
                We couldn't find any restaurants matching your criteria.
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setFilters({ cuisine: 'all', rating: 'all', priceRange: 'all' });
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRestaurants.map(restaurant => (
                <div key={restaurant.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:scale-[1.02]">
                  <Link to={`/restaurant/${restaurant.id}`} className="block">
                    <div className="relative">
                      <img 
                        src={restaurant.image} 
                        alt={restaurant.name} 
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-0 right-0 m-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${restaurant.isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                          {restaurant.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-1 text-gray-800">{restaurant.name}</h3>
                      
                      <div className="flex items-center mb-2">
                        <div className="flex items-center mr-2">
                          <FaStar className="text-yellow-500 mr-1" />
                          <span className="text-sm font-medium">{restaurant.rating}</span>
                        </div>
                        <span className="text-sm text-gray-500">({restaurant.totalReviews} reviews)</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <FaMapMarkerAlt className="mr-1 text-gray-400" />
                        <span className="truncate">{restaurant.address}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded">{restaurant.cuisine}</span>
                        <span className="text-sm font-medium">{restaurant.priceRange}</span>
                      </div>
                      
                      <div className="flex items-center mt-3 text-sm text-gray-600">
                        <FaClock className="mr-1 text-gray-400" />
                        <span>Delivery: {restaurant.deliveryTime}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default Restaurants; 