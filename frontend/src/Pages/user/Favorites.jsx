import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Input, Alert, Spinner, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { FaSearch, FaHeart, FaMapMarkerAlt, FaShoppingCart, FaExclamationTriangle, FaStar, FaUtensils, FaRegClock, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { getFullImageUrl, PLACEHOLDERS } from '../../utils/imageUtils';

const UserFavorites = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'items';
  const [activeTab, setActiveTab] = useState(initialTab);

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
      console.log('Fetching favorites...');
      const response = await api.get('/user/favorites');
      console.log('Favorites response:', response);
      
      if (response.data && response.data.success) {
        const fetchedFavorites = response.data.data?.favorites;
        if (Array.isArray(fetchedFavorites)) {
          setFavorites(fetchedFavorites);
          console.log('Favorites set:', fetchedFavorites);
        } else {
          console.warn('Favorites data is not an array:', fetchedFavorites);
          setFavorites([]);
        }
      } else {
        throw new Error(response.data?.error?.message || 'Failed to fetch favorites');
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Unable to load favorites. Please try again later.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Remove item from favorites
  const removeFavorite = async (itemId) => {
    setActionInProgress(itemId);
    setError(null);
    try {
      const response = await api.delete(`/user/favorites/${itemId}`);
      
      if (response.data && response.data.success) {
        setFavorites(prevFavorites => 
          prevFavorites.filter(item => getItemId(item) !== itemId)
        );
      } else {
        throw new Error(response.data?.error?.message || 'Failed to remove from favorites');
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
      setError(err.message || 'Failed to remove from favorites. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Navigate to menu item detail page
  const navigateToItem = (item) => {
    const itemId = getItemId(item);
    navigate(`/product/${itemId}`, { 
      state: { 
        fromFavorites: true,
        preselectedOptions: {
          quantity: 1,
          specialInstructions: ''
        }
      }
    });
  };

  // Update URL when tab changes
  const handleTabChange = (value) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  // Formatting helpers (defined before use)
  const getItemId = (item) => item?.id || item?._id || item?.menuItemId;
  const getItemName = (item) => item?.item_name || item?.name || 'Item';
  const getItemPrice = (item) => item?.price || item?.item_price || 0;
  const formatPrice = (price) => {
    return typeof price === 'number' ? price.toFixed(2) : '0.00';
  };

  // Extract and normalize restaurant data (defined before use in grouping/filtering)
  const getRestaurantData = (favorite) => {
    let restaurantData = { id: null, name: 'Restaurant', address: 'Address unavailable', cuisine: [], rating: 0, items: [] };
    
    const sourceRestaurant = favorite?.restaurant || favorite?.restaurantId;

    if (sourceRestaurant && typeof sourceRestaurant === 'object') {
      const details = sourceRestaurant.restaurantDetails;
      restaurantData = {
        id: sourceRestaurant.id || sourceRestaurant._id,
        name: details?.name || sourceRestaurant.name || 'Restaurant',
        address: details?.address || sourceRestaurant.address || 'Address unavailable',
        bannerImage: details?.bannerImage || sourceRestaurant.bannerImage,
        cuisine: details?.cuisine || sourceRestaurant.cuisine || [],
        rating: sourceRestaurant.rating || 0,
        items: []
      };
    } 
    
    return restaurantData;
  };

  // Group by restaurant for restaurant tab (defined before use in filtering)
  const restaurantsMap = favorites.reduce((acc, item) => {
    if (!item) return acc;
    const restaurantData = getRestaurantData(item);
    const restaurantId = restaurantData.id;
    
    if (restaurantId) {
      if (!acc[restaurantId]) {
        acc[restaurantId] = { ...restaurantData, items: [] };
      }
      if (item && typeof item === 'object') {
          acc[restaurantId].items.push(item);
      }
    }
    
    return acc;
  }, {});

  const restaurantsList = Object.values(restaurantsMap);

  // Filter favorites based on search query
  const lowerCaseQuery = searchQuery.toLowerCase();

  const filteredFavorites = favorites.filter(item => {
    if (!item) return false;
    const itemName = getItemName(item).toLowerCase(); // Now safe to use
    const restaurantData = getRestaurantData(item); // Now safe to use
    const restaurantName = restaurantData.name.toLowerCase();
    
    return itemName.includes(lowerCaseQuery) || restaurantName.includes(lowerCaseQuery);
  });
  
  const filteredRestaurants = restaurantsList.filter(restaurant => {
    if (!restaurant) return false;
    const restaurantName = (restaurant.name || '').toLowerCase();
    const restaurantAddress = (restaurant.address || '').toLowerCase();
    const cuisines = restaurant.cuisine || [];
    
    return restaurantName.includes(lowerCaseQuery) ||
           restaurantAddress.includes(lowerCaseQuery) ||
           cuisines.some(c => typeof c === 'string' && c.toLowerCase().includes(lowerCaseQuery));
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
        <span className="ml-3 text-lg text-gray-600 dark:text-gray-400">Loading Favorites...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-8 py-16 text-center border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
        <FaExclamationTriangle className="w-16 h-16 mx-auto mb-6 text-yellow-500" />
        <h2 className="mb-3 text-2xl font-semibold">Authentication Required</h2>
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">Please sign in to view and manage your favorites.</p>
        <Button 
          size="lg"
          variant="default" 
          onClick={() => navigate('/signin', { state: { from: '/user/favorites' } })}
        >
          Go to Sign In
        </Button>
      </div>
    );
  }

  if (error && favorites.length === 0) {
    return (
      <div className="p-8 py-16 text-center border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/30 dark:border-red-700">
        <FaExclamationTriangle className="w-16 h-16 mx-auto mb-6 text-red-500" />
        <h2 className="mb-3 text-2xl font-semibold text-red-800 dark:text-red-200">Loading Failed</h2>
        <p className="mb-6 text-lg text-red-700 dark:text-red-300">{error}</p>
        <Button 
          size="lg"
          variant="outline" 
          onClick={fetchFavorites}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (favorites.length === 0 && !error) {
    return (
      <div className="p-8 py-16 text-center border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
        <FaHeart className="w-16 h-16 mx-auto mb-6 text-gray-400 dark:text-gray-500" />
        <h3 className="mb-3 text-2xl font-semibold">No Favorites Yet</h3>
        <p className="mt-2 mb-8 text-lg text-gray-500 dark:text-gray-400">
          Find items you love and click the <FaHeart className="inline mx-1 text-red-500" size={16} /> icon to save them here!
        </p>
        <Button 
          size="lg"
          variant="default" 
          onClick={() => navigate('/')}
        >
          Browse Restaurants
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 mx-auto space-y-8">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <h1 className="text-3xl font-bold tracking-tight">My Favorites</h1>
        <div className="relative w-full md:w-72">
          <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <Input
            type="text"
            placeholder="Search items or restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="py-2 pl-10 pr-4 text-base"
          />
           {searchQuery && (
             <Button 
                variant="ghost" 
                size="icon" 
                className="absolute text-gray-500 transform -translate-y-1/2 right-1 top-1/2 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => setSearchQuery('')}
             >
               <FaTimes className="w-4 h-4" />
             </Button>
           )}
        </div>
      </div>

      {error && favorites.length > 0 && (
        <Alert variant="destructive">
          <FaExclamationTriangle className="w-4 h-4" />
          <span className="ml-2">{error}</span>
           <Button 
             variant="ghost" 
             size="sm" 
             className="ml-auto"
             onClick={() => setError(null)}
           >
             Dismiss
           </Button>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items" className="py-2 text-base">
            <FaUtensils className="w-4 h-4 mr-2" /> Menu Items
            <Badge variant={activeTab === 'items' ? 'default' : 'secondary'} className="ml-2">{filteredFavorites.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="restaurants" className="py-2 text-base">
            <FaMapMarkerAlt className="w-4 h-4 mr-2" /> Restaurants
            <Badge variant={activeTab === 'restaurants' ? 'default' : 'secondary'} className="ml-2">{filteredRestaurants.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="restaurants" className="mt-6">
          {filteredRestaurants.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRestaurants.map(restaurant => {
                 if (!restaurant || !restaurant.id) return null;
                 return (
                   <Card key={restaurant.id} className="flex flex-col overflow-hidden transition-shadow duration-200 rounded-lg shadow-sm hover:shadow-lg dark:bg-gray-800">
                     <div className="relative h-40 bg-gray-200 dark:bg-gray-700">
                       <img 
                         src={getFullImageUrl(restaurant.coverImage)}
                         alt={`${restaurant.name} banner`}
                         className="object-cover w-full h-full"
                         onError={(e) => { e.target.src = PLACEHOLDERS.RESTAURANT; }}
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
                       {restaurant.rating > 0 && (
                         <Badge variant="secondary" className="absolute flex items-center gap-1 text-white border-none bottom-2 left-2 bg-black/60">
                           <FaStar className="text-yellow-400" />
                           {restaurant.rating.toFixed(1)}
                         </Badge>
                       )}
                     </div>
                     <div className="flex flex-col flex-grow p-5">
                       <h3 className="mb-1 text-xl font-semibold group-hover:text-primary">{restaurant.name}</h3>
                       {Array.isArray(restaurant.cuisine) && restaurant.cuisine.length > 0 && (
                         <div className="flex flex-wrap gap-1.5 my-2">
                           {restaurant.cuisine.slice(0, 4).map((type, index) => (
                             <Badge key={index} variant="outline" className="text-xs font-normal">
                               {type}
                             </Badge>
                           ))}
                         </div>
                       )}
                       <div className="flex items-start gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                         <FaMapMarkerAlt className="flex-shrink-0 mt-1 text-gray-400" />
                         <span className="line-clamp-2">{restaurant.address}</span>
                       </div>
                       <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                         <FaHeart className="text-red-500" />
                         <span>
                           {restaurant.items.length} favorited {restaurant.items.length === 1 ? 'item' : 'items'}
                         </span>
                       </div>
                       <Button 
                         className="w-full pt-2 mt-auto"
                         onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                       >
                         View Restaurant Menu
                       </Button>
                     </div>
                   </Card>
                 );
              })}
            </div>
          ) : (
            <div className="py-16 text-center border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
              <FaSearch className="w-16 h-16 mx-auto mb-6 text-gray-400 dark:text-gray-500" />
              <h3 className="text-2xl font-semibold">No Matching Restaurants</h3>
              <p className="mt-2 mb-8 text-lg text-gray-500 dark:text-gray-400">
                {searchQuery ? `We couldn&apos;t find any favorited restaurants matching "${searchQuery}".` : 'Add items to favorites to see their restaurants here.'}
              </p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="items" className="mt-6">
          {filteredFavorites.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredFavorites.map(item => {
                if (!item) return null;
                const itemId = getItemId(item);
                const restaurantData = getRestaurantData(item);
                return (
                  <Card key={itemId} className="relative flex flex-col overflow-hidden transition-shadow duration-200 rounded-lg shadow-sm group hover:shadow-lg dark:bg-gray-800">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute z-10 w-8 h-8 transition-opacity shadow-md top-3 right-3 opacity-80 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); removeFavorite(itemId); }}
                      disabled={actionInProgress === itemId}
                      aria-label="Remove from favorites"
                    >
                      {actionInProgress === itemId ? (
                        <Spinner size="sm" className="w-4 h-4" />
                      ) : (
                        <FaTimes className="w-4 h-4" />
                      )}
                    </Button>
                    <div className="flex flex-col flex-grow cursor-pointer" onClick={() => navigateToItem(item)}>
                      <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                        <img 
                          src={getFullImageUrl(item.imageUrl)}
                          alt={getItemName(item)} 
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => { e.target.src = PLACEHOLDERS.FOOD; }}
                          loading="lazy"
                        />
                         <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-t from-black/30 to-transparent group-hover:opacity-100"></div>
                      </div>
                      <div className="flex flex-col flex-grow p-5">
                        <h3 className="mb-1 text-lg font-semibold truncate group-hover:text-primary">{getItemName(item)}</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <FaUtensils className="flex-shrink-0 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                          <span className="truncate">{restaurantData.name}</span>
                        </div>
                         {Array.isArray(item.categories) && item.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 my-2">
                            {item.categories.slice(0, 3).map((category, index) => (
                               <Badge key={index} variant="secondary" className="text-xs font-normal">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        )}
                         <div className="flex items-center gap-4 mt-2 text-sm">
                           {item.rating > 0 && (
                             <div className="flex items-center">
                               <FaStar className="w-4 h-4 mr-1 text-yellow-400" />
                               <span className="font-medium">{item.rating.toFixed(1)}</span>
                             </div>
                           )}
                           {item.preparationTime && (
                             <div className="flex items-center text-gray-600 dark:text-gray-400">
                               <FaRegClock className="w-4 h-4 mr-1 text-gray-400" />
                               <span>{item.preparationTime} min</span>
                             </div>
                           )}
                         </div>
                        
                        <div className="flex items-center justify-between pt-3 mt-auto">
                          <span className="text-xl font-bold">Rs.{formatPrice(getItemPrice(item))}</span>
                          <Button 
                            size="sm"
                            className="transition-transform group-hover:scale-105"
                            onClick={(e) => { 
                              e.stopPropagation();
                              navigateToItem(item); 
                            }}
                          >
                            <FaShoppingCart className="w-4 h-4 mr-1.5" />
                            Order
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
             <div className="py-16 text-center border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
              <FaSearch className="w-16 h-16 mx-auto mb-6 text-gray-400 dark:text-gray-500" />
              <h3 className="text-2xl font-semibold">No Matching Items</h3>
              <p className="mt-2 mb-8 text-lg text-gray-500 dark:text-gray-400">
                We couldn&apos;t find any favorite items matching &quot;{searchQuery}&quot;.
              </p>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserFavorites; 