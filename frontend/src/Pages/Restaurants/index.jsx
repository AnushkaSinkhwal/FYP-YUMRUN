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
        // Fetch restaurants from the API
        const response = await axios.get('/api/restaurants');
        console.log('Restaurant API response:', response.data);
        
        if (response.data.success && Array.isArray(response.data.data)) {
          // Transform the API data to match our frontend format
          const formattedRestaurants = response.data.data.map(restaurant => ({
            id: restaurant._id || restaurant.id,
            name: restaurant.name,
            description: restaurant.description,
            rating: restaurant.rating || 0,
            totalReviews: restaurant.totalReviews || 0,
            cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine[0] : restaurant.cuisine || 'Various',
            priceRange: restaurant.priceRange || '',
            deliveryTime: restaurant.deliveryTime || '',
            image: restaurant.logo || restaurant.image || `/uploads/restaurants/default_restaurant.jpg`,
            address: restaurant.location || restaurant.address || 'Address not available',
            isOpen: restaurant.isOpen !== undefined ? restaurant.isOpen : false
          }));
          
          console.log('Formatted restaurants:', formattedRestaurants);
          setRestaurants(formattedRestaurants);
        } else {
          setError(response.data.message || 'Failed to fetch restaurants');
          setRestaurants([]);
        }
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setError('An error occurred while loading restaurants');
        setRestaurants([]);
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

  // Get unique cuisines from restaurants data
  const availableCuisines = ['all', ...new Set(restaurants.map(r => r.cuisine).filter(Boolean))];

  return (
    <div className="py-10">
      <Container>
        <div className="mb-8">
          <h1 className="mb-6 text-3xl font-bold text-center">All Restaurants</h1>
          
          {/* Search and Filters */}
          <div className="p-6 mb-8 bg-white rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
              <div className="flex-1 mb-4 md:mb-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search restaurants or cuisines..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yumrun-orange"
                  />
                  <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <select
                  value={filters.cuisine}
                  onChange={(e) => handleFilterChange('cuisine', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yumrun-orange"
                >
                  <option value="all">All Cuisines</option>
                  {availableCuisines.filter(c => c !== 'all').map(cuisine => (
                    <option key={cuisine} value={cuisine}>{cuisine}</option>
                  ))}
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
            <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg shadow-md">
              <FaUtensils className="mx-auto mb-4 text-4xl text-gray-300" />
              <h3 className="mb-2 text-xl font-semibold">No Restaurants Found</h3>
              <p className="mb-4 text-gray-600">
                We couldn&apos;t find any restaurants matching your criteria.
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
                        className="object-cover w-full h-48"
                      />
                      <div className="absolute top-0 right-0 m-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${restaurant.isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                          {restaurant.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="mb-1 text-lg font-semibold text-gray-800">{restaurant.name}</h3>
                      
                      <div className="flex items-center mb-2">
                        <div className="flex items-center mr-2">
                          <FaStar className="mr-1 text-yellow-500" />
                          <span className="text-sm font-medium">{restaurant.rating}</span>
                        </div>
                        <span className="text-sm text-gray-500">({restaurant.totalReviews} reviews)</span>
                      </div>
                      
                      <div className="flex items-center mb-2 text-sm text-gray-600">
                        <FaMapMarkerAlt className="mr-1 text-gray-400" />
                        <span className="truncate">{restaurant.address}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="px-2 py-1 text-sm bg-gray-100 rounded">{restaurant.cuisine}</span>
                        <span className="text-sm font-medium">{restaurant.priceRange}</span>
                      </div>
                      
                      {restaurant.deliveryTime && (
                        <div className="flex items-center mt-3 text-sm text-gray-600">
                          <FaClock className="mr-1 text-gray-400" />
                          <span>Delivery: {restaurant.deliveryTime}</span>
                        </div>
                      )}
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