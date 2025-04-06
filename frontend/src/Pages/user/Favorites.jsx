import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Alert, Spinner, Badge } from '../../components/ui';
import { FaSearch, FaHeart, FaMapMarkerAlt, FaShoppingCart, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const UserFavorites = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('items');
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Fetch favorites from API
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/favorites');
        
        if (!response.ok) {
          throw new Error('Failed to fetch favorites');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setFavorites(data.data.favorites || []);
        } else {
          throw new Error(data.error.message || 'Failed to fetch favorites');
        }
      } catch (err) {
        console.error('Error fetching favorites:', err);
        setError('Unable to load favorites. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavorites();
  }, [isAuthenticated]);

  // Remove item from favorites
  const removeFavorite = async (itemId) => {
    setActionInProgress(itemId);
    try {
      const response = await fetch(`/api/favorites/${itemId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Update local state after successful API call
        setFavorites(prevFavorites => 
          prevFavorites.filter(item => item.id !== itemId)
        );
      } else {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to remove from favorites');
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
      setError('Failed to remove from favorites. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Navigate to order page with pre-filled options
  const orderFromFavorite = (item) => {
    navigate(`/product/${item.id}`, { 
      state: { 
        fromFavorites: true,
        preselectedOptions: {
          quantity: 1,
          specialInstructions: ''
        }
      }
    });
  };

  // Filter favorites based on search query
  const filteredFavorites = favorites.filter(item =>
    item.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.restaurant?.restaurantDetails?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by restaurant for restaurant tab
  const restaurantsMap = favorites.reduce((acc, item) => {
    if (item.restaurant && item.restaurant.id) {
      if (!acc[item.restaurant.id]) {
        acc[item.restaurant.id] = {
          id: item.restaurant.id,
          name: item.restaurant.restaurantDetails?.name || 'Restaurant',
          address: item.restaurant.restaurantDetails?.address || 'Address unavailable',
          items: []
        };
      }
      acc[item.restaurant.id].items.push(item);
    }
    return acc;
  }, {});
  
  const restaurantsList = Object.values(restaurantsMap);
  
  const filteredRestaurants = restaurantsList.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg p-8">
        <FaExclamationTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-gray-600 mb-6">You need to sign in to view and manage your favorites.</p>
        <Button 
          variant="brand" 
          onClick={() => navigate('/signin', { state: { from: '/user/favorites' } })}
        >
          Sign In
        </Button>
      </div>
    );
  }

  if (favorites.length === 0 && !error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Favorites</h1>
        </div>
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaHeart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No favorites yet</h3>
          <p className="text-gray-500 mt-2 mb-6">
            Look for the <FaHeart className="inline text-red-500 mx-1" size={14} /> icon when browsing menus to save your favorite items!
          </p>
          <Button 
            variant="brand" 
            onClick={() => navigate('/')}
          >
            Browse Restaurants
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Favorites</h1>
        <div className="relative w-64">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'items' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('items')}
        >
          Menu Items 
          {favorites.length > 0 && (
            <Badge className="ml-2" variant="secondary">{favorites.length}</Badge>
          )}
        </Button>
        <Button
          variant={activeTab === 'restaurants' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('restaurants')}
        >
          Restaurants
          {restaurantsList.length > 0 && (
            <Badge className="ml-2" variant="secondary">{restaurantsList.length}</Badge>
          )}
        </Button>
      </div>

      {activeTab === 'restaurants' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map(restaurant => (
            <Card key={restaurant.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <FaMapMarkerAlt className="text-gray-400" />
                  <span>{restaurant.address}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {restaurant.items.length} favorited {restaurant.items.length === 1 ? 'item' : 'items'}
                </p>
                <Button 
                  className="w-full mt-4"
                  onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                >
                  View Menu
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {searchQuery && filteredFavorites.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FaInfoCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No matching favorites</h3>
              <p className="text-gray-500 mt-2">
                No items match your search for "{searchQuery}"
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFavorites.map(item => (
                <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-48">
                    <img
                      src={item.image || `https://source.unsplash.com/random/300x200/?${item.category || 'food'}`}
                      alt={item.item_name}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white/75"
                      onClick={() => removeFavorite(item.id)}
                      disabled={actionInProgress === item.id}
                    >
                      {actionInProgress === item.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <FaHeart className="h-5 w-5 text-red-500" />
                      )}
                    </Button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{item.item_name}</h3>
                    <p className="text-sm text-gray-500">
                      {item.restaurant?.restaurantDetails?.name || 'Restaurant'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        {item.isVegetarian && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded">Veg</span>
                        )}
                        {item.isGlutenFree && (
                          <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded ml-1">GF</span>
                        )}
                      </div>
                      <span className="font-semibold">Rs. {item.item_price}</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        className="flex-1"
                        onClick={() => navigate(`/product/${item.id}`)}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-1"
                        onClick={() => orderFromFavorite(item)}
                      >
                        <FaShoppingCart /> Order
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {filteredRestaurants.length === 0 && activeTab === 'restaurants' && searchQuery && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaInfoCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No matching restaurants</h3>
          <p className="text-gray-500 mt-2">
            No restaurants match your search for "{searchQuery}"
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setSearchQuery('')}
          >
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserFavorites; 