import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Alert, Spinner, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { FaSearch, FaHeart, FaMapMarkerAlt, FaShoppingCart, FaExclamationTriangle, FaInfoCircle, FaStar, FaUtensils, FaRegClock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const UserFavorites = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();

  // Fetch favorites from API
  useEffect(() => {
    fetchFavorites();
  }, [isAuthenticated]);

  const fetchFavorites = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/favorites');
      
      if (response.data && response.data.success) {
        setFavorites(response.data.data?.favorites || []);
      } else {
        throw new Error(response.data?.error?.message || 'Failed to fetch favorites');
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Unable to load favorites. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Remove item from favorites
  const removeFavorite = async (itemId) => {
    setActionInProgress(itemId);
    try {
      const response = await api.delete(`/favorites/${itemId}`);
      
      if (response.data && response.data.success) {
        // Update local state after successful API call
        setFavorites(prevFavorites => 
          prevFavorites.filter(item => item.id !== itemId && item._id !== itemId)
        );
      } else {
        throw new Error(response.data?.error?.message || 'Failed to remove from favorites');
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
      setError('Failed to remove from favorites. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Navigate to menu item detail page
  const navigateToItem = (item) => {
    navigate(`/product/${item.id || item._id || item.menuItemId}`, { 
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
  const filteredFavorites = favorites.filter(item => {
    const itemName = item.item_name || item.name || '';
    const restaurantName = item.restaurant?.restaurantDetails?.name || 
                          (item.restaurantId && typeof item.restaurantId === 'object' ? 
                            item.restaurantId.name || item.restaurantId.restaurantDetails?.name : '');
    
    return itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           restaurantName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Extract and normalize restaurant data
  const getRestaurantData = (favorite) => {
    let restaurantData = { items: [] };
    
    if (favorite.restaurant && typeof favorite.restaurant === 'object') {
      const restaurant = favorite.restaurant;
      restaurantData = {
        id: restaurant.id || restaurant._id,
        name: restaurant.restaurantDetails?.name || restaurant.name || 'Restaurant',
        address: restaurant.restaurantDetails?.address || restaurant.address || 'Address unavailable',
        cuisine: restaurant.restaurantDetails?.cuisine || restaurant.cuisine || [],
        rating: restaurant.rating || 0,
        items: []
      };
    } else if (favorite.restaurantId && typeof favorite.restaurantId === 'object') {
      const restaurant = favorite.restaurantId;
      restaurantData = {
        id: restaurant.id || restaurant._id,
        name: restaurant.name || restaurant.restaurantDetails?.name || 'Restaurant',
        address: restaurant.address || restaurant.restaurantDetails?.address || 'Address unavailable',
        cuisine: restaurant.cuisine || restaurant.restaurantDetails?.cuisine || [],
        rating: restaurant.rating || 0,
        items: []
      };
    }
    
    return restaurantData;
  };

  // Group by restaurant for restaurant tab
  const restaurantsMap = favorites.reduce((acc, item) => {
    const restaurantData = getRestaurantData(item);
    const restaurantId = restaurantData.id;
    
    if (restaurantId && !acc[restaurantId]) {
      acc[restaurantId] = restaurantData;
    }
    
    if (restaurantId && acc[restaurantId]) {
      acc[restaurantId].items.push(item);
    }
    
    return acc;
  }, {});
  
  const restaurantsList = Object.values(restaurantsMap);
  
  const filteredRestaurants = restaurantsList.filter(restaurant => {
    if (!restaurant) return false;
    
    const restaurantName = restaurant.name || '';
    const restaurantAddress = restaurant.address || '';
    const cuisines = restaurant.cuisine || [];
    
    return restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           restaurantAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
           cuisines.some(c => c.toLowerCase?.includes(searchQuery.toLowerCase()));
  });

  // Formatting helpers
  const getItemId = (item) => item.id || item._id || item.menuItemId;
  const getItemName = (item) => item.item_name || item.name || 'Item';
  const getItemPrice = (item) => item.price || item.item_price || 0;
  const formatPrice = (price) => {
    if (typeof price !== 'number') return '0.00';
    return price.toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-8 py-12 text-center rounded-lg bg-gray-50">
        <FaExclamationTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
        <h2 className="mb-2 text-xl font-semibold">Authentication Required</h2>
        <p className="mb-6 text-gray-600">You need to sign in to view and manage your favorites.</p>
        <Button 
          variant="default" 
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Favorites</h1>
        </div>
        <div className="py-12 text-center rounded-lg bg-gray-50 dark:bg-gray-800">
          <FaHeart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold">No favorites yet</h3>
          <p className="mt-2 mb-6 text-gray-500">
            Look for the <FaHeart className="inline mx-1 text-red-500" size={14} /> icon when browsing menus to save your favorite items!
          </p>
          <Button 
            variant="default" 
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Favorites</h1>
        <div className="relative w-64">
          <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <Input
            placeholder="Search favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <Tabs defaultValue="items">
        <TabsList className="mb-4">
          <TabsTrigger value="items" className="flex items-center gap-2">
            Menu Items
            <Badge variant="secondary">{favorites.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="restaurants" className="flex items-center gap-2">
            Restaurants
            <Badge variant="secondary">{restaurantsList.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="restaurants">
          {filteredRestaurants.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRestaurants.map(restaurant => (
                <Card key={restaurant.id} className="overflow-hidden transition-shadow hover:shadow-md">
                  <div className="relative h-32 bg-gray-200">
                    <img 
                      src={restaurant.coverImage || `https://source.unsplash.com/random/600x400/?restaurant,${encodeURIComponent(restaurant.name)}`} 
                      alt={restaurant.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      {restaurant.rating > 0 && (
                        <div className="flex items-center mr-3">
                          <FaStar className="mr-1 text-yellow-400" />
                          <span>{restaurant.rating.toFixed(1)}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 my-1">
                        {Array.isArray(restaurant.cuisine) && restaurant.cuisine.slice(0, 3).map((type, index) => (
                          <span key={index} className="px-2 py-0.5 bg-gray-100 text-xs rounded-full">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <FaMapMarkerAlt className="text-gray-400" />
                      <span className="truncate">{restaurant.address}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <FaUtensils className="text-gray-400" />
                      <span>
                        {restaurant.items.length} favorited {restaurant.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
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
            <div className="py-12 text-center rounded-lg bg-gray-50 dark:bg-gray-800">
              <FaInfoCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold">No restaurants match your search</h3>
              <p className="mt-2 text-gray-500">
                {searchQuery ? `No restaurants match your search for "${searchQuery}"` : "Add items to favorites to see restaurants here"}
              </p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="items">
          {searchQuery && filteredFavorites.length === 0 ? (
            <div className="py-12 text-center rounded-lg bg-gray-50 dark:bg-gray-800">
              <FaInfoCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold">No matching favorites</h3>
              <p className="mt-2 text-gray-500">
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredFavorites.map(item => {
                const itemId = getItemId(item);
                return (
                  <Card key={itemId} className="overflow-hidden transition-all duration-200 hover:shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="relative h-48 bg-gray-200 dark:bg-gray-800">
                      <img 
                        src={item.image || `https://source.unsplash.com/random/600x400/?food,${encodeURIComponent(getItemName(item))}`} 
                        alt={getItemName(item)}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          e.target.src = 'https://source.unsplash.com/random/600x400/?food';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-90 hover:opacity-100 shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFavorite(itemId);
                        }}
                        disabled={actionInProgress === itemId}
                      >
                        {actionInProgress === itemId ? (
                          <Spinner size="sm" />
                        ) : (
                          <FaHeart className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" onClick={() => navigateToItem(item)}>
                      <h3 className="font-semibold text-lg truncate">{getItemName(item)}</h3>
                      
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <FaUtensils className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span className="truncate">
                          {item.restaurant?.restaurantDetails?.name || 
                          (item.restaurantId && typeof item.restaurantId === 'object' ? 
                            item.restaurantId.name || item.restaurantId.restaurantDetails?.name : 'Restaurant')}
                        </span>
                      </div>
                      
                      {item.categories && item.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.categories.slice(0, 3).map((category, index) => (
                            <span key={index} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                              {category}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center mt-2">
                        {item.rating > 0 && (
                          <div className="flex items-center text-sm">
                            <FaStar className="mr-1 text-yellow-400" />
                            <span>{item.rating.toFixed(1)}</span>
                          </div>
                        )}
                        
                        {item.preparationTime && (
                          <div className="flex items-center ml-3 text-sm">
                            <FaRegClock className="mr-1 text-gray-400" />
                            <span>{item.preparationTime} min</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold">${formatPrice(getItemPrice(item))}</span>
                        <Button 
                          size="sm"
                          className="transition-transform hover:scale-105"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToItem(item);
                          }}
                        >
                          <FaShoppingCart className="w-4 h-4 mr-2" />
                          Order
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserFavorites; 