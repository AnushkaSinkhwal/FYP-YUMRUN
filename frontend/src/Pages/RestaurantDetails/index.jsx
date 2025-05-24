import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, Spinner, Alert, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui';
import { FaStar, FaMapMarkerAlt, FaUtensils, FaPhone, FaEnvelope, FaArrowLeft, FaShoppingCart, FaTag } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { getFullImageUrl, getBestImageUrl, PLACEHOLDERS } from '../../utils/imageUtils';
import IngredientCustomizer from '../../components/MenuItemCustomization/IngredientCustomizer';
import { Link } from 'react-router-dom';

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuError, setMenuError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [itemToCustomize, setItemToCustomize] = useState(null);
  const [restaurantOffers, setRestaurantOffers] = useState([]);

  // Fetch restaurant details
  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`/api/restaurants/${id}`);
        if (response.data.success) {
          setRestaurant(response.data.data);
        } else {
          setError(response.data.message || 'Failed to load restaurant details');
        }
      } catch (err) {
        console.error('Error fetching restaurant details:', err);
        setError('Failed to load restaurant details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchRestaurantDetails();
    }
  }, [id]);

  // Fetch public offers for this restaurant
  useEffect(() => {
    const fetchRestaurantOffers = async () => {
      console.log(`[RestaurantDetails] Fetching offers for restaurant ${id}`);
      try {
        const response = await axios.get(`/api/offers/public/restaurant/${id}`);
        console.log('[RestaurantDetails] Offers endpoint response:', response);
        if (response.data.success) {
          console.log('[RestaurantDetails] Offers data received:', response.data.data);
          setRestaurantOffers(response.data.data);
        } else {
          console.warn('[RestaurantDetails] Fetch offers responded with success=false:', response.data.message);
        }
      } catch (err) {
        console.error('[RestaurantDetails] Error fetching restaurant offers:', err);
      }
    };
    if (id) fetchRestaurantOffers();
  }, [id]);

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      setMenuLoading(true);
      setMenuError(null);
      
      try {
        console.log(`Fetching menu items for restaurant: ${id}`);
        const response = await axios.get(`/api/menu?restaurantId=${id}`);
        console.log('Menu API response:', response.data);
        
        if (response.data.success && Array.isArray(response.data.data)) {
          // Transform API data to match frontend format
          const formattedMenuItems = response.data.data.map(item => {
            // Extract discount info if present
            const discountPercentage = item.discount || 0;
            const discountedPrice = item.discountedPrice != null ? item.discountedPrice : (item.price || item.item_price || 0);
            
            return {
              id: item._id || item.id,
              name: item.name || item.item_name,
              description: item.description || 'No description available',
              price: item.price || item.item_price || 0,
              discountedPrice,
              offerDetails: { percentage: discountPercentage },
              category: item.category || 'Uncategorized',
              image: getBestImageUrl(item),
              isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
              isVegetarian: item.isVegetarian || false,
              isVegan: item.isVegan || false,
              isGlutenFree: item.isGlutenFree || false,
              isPopular: item.isPopular || false,
              rating: item.averageRating > 0 ? item.averageRating : 0,
              totalReviews: item.numberOfRatings || 0,
              calories: item.nutritionInfo?.calories || null,
              allergens: item.allergens || [],
              customizationOptions: {
                 availableAddOns: item.customizationOptions?.availableAddOns || []
              },
              restaurant: item.restaurant || {
                id: restaurant?.id || restaurant?._id,
                name: restaurant?.name
              }
            };
          });
          
          console.log('Formatted menu items:', formattedMenuItems);
          setMenuItems(formattedMenuItems);
        } else {
          console.error('Failed to load menu items:', response.data.message);
          setMenuError(response.data.message || 'Failed to load menu items');
          setMenuItems([]);
        }
      } catch (err) {
        console.error('Error fetching menu items:', err);
        setMenuError('Failed to load menu items');
        setMenuItems([]);
      } finally {
        setMenuLoading(false);
      }
    };
    
    if (id && !loading && restaurant) {
      fetchMenuItems();
    }
  }, [id, loading, restaurant]);

  // Get unique categories from menu items
  const categories = ['all', ...new Set(menuItems.map(item => item.category))];
  
  // Filter menu items by category
  const filteredMenuItems = activeCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  // Open customization modal
  const handleOpenCustomizeModal = (item) => {
    console.log("Opening customize modal for:", item);
    setItemToCustomize(item);
    setIsCustomizeModalOpen(true);
  };

  // Function called by the customizer component when user confirms adding to cart
  const handleConfirmAddToCart = (customizedItemData) => {
     console.log("Adding customized item to cart:", customizedItemData);
     addToCart({
       ...customizedItemData, // Includes id, name, quantity, selectedAddOns, finalPrice etc. from customizer
       restaurantId: restaurant.id || restaurant._id,
       restaurantName: restaurant.name,
       // Base price might be needed separately in cart context if not included in finalPrice calculation details
       basePrice: itemToCustomize.price 
     });
     setIsCustomizeModalOpen(false);
     setItemToCustomize(null);
     // Add toast notification maybe
  };

  // Handle simple add to cart (for items without customization)
  const handleSimpleAddToCart = (item) => {
    if (!restaurant) return;
    console.log("Adding simple item to cart:", item);
    // Use discountedPrice if there's an active offer, otherwise original price
    const priceToUse = item.discountedPrice != null ? item.discountedPrice : item.price;
    addToCart({
      id: item.id,
      name: item.name,
      price: priceToUse,
      unitPrice: priceToUse,
      image: item.image,
      quantity: 1,
      restaurantId: restaurant.id || restaurant._id,
      restaurantName: restaurant.name,
      selectedAddOns: [] // No add-ons for simple add
    });
    // Add toast notification maybe
  };

  return (
    <div className="py-8">
      <Container>
        {/* Restaurant-level offers badges */}
        {restaurantOffers.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-semibold">Current Offers</h2>
            <div className="flex flex-wrap gap-2">
              {restaurantOffers.map(offer => (
                <span 
                  key={offer._id || offer.id} 
                  className="flex items-center gap-1 px-3 py-1 text-sm font-semibold text-white rounded-full shadow-sm bg-yumrun-red"
                  title={offer.description}
                >
                  <FaTag className="w-3 h-3" />
                  {offer.discountPercentage}% OFF {offer.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        ) : restaurant ? (
          <>
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center mb-4 text-gray-600 hover:text-yumrun-orange"
            >
              <FaArrowLeft className="mr-2" />
              <span>Back to Restaurants</span>
            </button>
            
            {/* Restaurant Header */}
            <div className="mb-8 overflow-hidden bg-white rounded-lg shadow-md">
              <div className="relative h-64">
                <img 
                  src={
                    restaurant.coverImage 
                      ? getFullImageUrl(restaurant.coverImage) 
                      : PLACEHOLDERS.RESTAURANT
                  } 
                  alt={`${restaurant.name} cover`} 
                  className="object-cover w-full h-full"
                  onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDERS.RESTAURANT; }}
                />
                <div className="absolute top-0 right-0 m-4">
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${restaurant.isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {restaurant.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 flex items-center p-6 bg-gradient-to-t from-black to-transparent">
                  <img
                    src={
                      restaurant.logo 
                        ? getFullImageUrl(restaurant.logo) 
                        : PLACEHOLDERS.RESTAURANT
                    }
                    alt={`${restaurant.name} logo`}
                    className="object-cover w-16 h-16 mr-4 border-2 border-white rounded-full"
                    onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDERS.RESTAURANT; }}
                  />
                  <div>
                    <h1 className="mb-2 text-3xl font-bold text-white">{restaurant.name}</h1>
                    <div className="flex items-center mb-2 text-white">
                      <div className="flex items-center mr-4">
                        <FaStar className="mr-1 text-yellow-400" />
                        <span className="font-medium">{restaurant.rating || '0'}</span>
                        <span className="ml-1 text-gray-300">({restaurant.totalReviews || '0'} reviews)</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">{Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine}</span>
                        <span>•</span>
                        <span className="ml-2">{restaurant.priceRange || ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="mb-2 text-xl font-semibold">About</h2>
                  <p className="text-gray-700">{restaurant.description || 'No description available'}</p>
                </div>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <h2 className="mb-2 text-xl font-semibold">Contact</h2>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <FaMapMarkerAlt className="mr-2 text-gray-400" />
                        <span>
                          {typeof (restaurant.address || restaurant.location) === 'object' 
                            ? [
                                (restaurant.address || restaurant.location).street, 
                                (restaurant.address || restaurant.location).city, 
                                (restaurant.address || restaurant.location).state, 
                                (restaurant.address || restaurant.location).zipCode,
                                (restaurant.address || restaurant.location).country
                              ].filter(Boolean).join(', ') // Join parts with comma, filtering out empty ones
                            : (restaurant.address || restaurant.location || 'Address not available') // Render as string if already a string or null
                          }
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FaPhone className="mr-2 text-gray-400" />
                        <span>{restaurant.phone || 'Phone not available'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FaEnvelope className="mr-2 text-gray-400" />
                        <span>{restaurant.email || 'Email not available'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="mb-2 text-xl font-semibold">Hours</h2>
                    <div className="space-y-1">
                      {restaurant.openingHours ? (
                        Object.entries(restaurant.openingHours).map(([day, hours]) => (
                          <div key={day} className="flex justify-between text-gray-600">
                            <span className="capitalize">{day}</span>
                            <span>{hours.open} - {hours.close}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-600">Opening hours not available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Menu Section */}
            <div className="mt-8">
              <h2 className="mb-6 text-2xl font-bold">Menu</h2>
              
              {/* Category Tabs */}
              <div className="mb-6 overflow-x-auto">
                <div className="flex space-x-2 min-w-max">
                  {categories.map((category, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors capitalize ${
                        activeCategory === category 
                          ? 'bg-yumrun-orange text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              
              {menuLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : menuError ? (
                <Alert variant="error" className="mb-4">
                  {menuError}
                </Alert>
              ) : filteredMenuItems.length === 0 ? (
                <div className="py-8 text-center">
                  <FaUtensils className="mx-auto mb-4 text-4xl text-gray-300" />
                  <p className="text-gray-500">No menu items available</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredMenuItems.map(item => {
                    const hasAddOns = item.customizationOptions?.availableAddOns && item.customizationOptions.availableAddOns.length > 0;
                    const hasOffer = item.offerDetails && item.offerDetails.percentage > 0;
                    
                    return (
                      <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:scale-[1.02] flex flex-col">
                        <div className="relative">
                          <Link to={`/product/${item.id}`} className="block h-48">
                            <img 
                              src={getBestImageUrl(item)} 
                              alt={item.name}
                              className="object-cover w-full h-48"
                              onError={(e) => {
                                console.error(`Image load error for ${item.name}:`, e);
                                e.target.src = PLACEHOLDERS.FOOD;
                              }}
                            />
                          </Link>
                          
                          {hasOffer && (
                            <div className="absolute top-2 right-2 p-1.5 bg-yumrun-red text-white rounded-md text-xs font-semibold flex items-center gap-1 z-10">
                               <FaTag className="w-3 h-3"/>
                               <span>{item.offerDetails.percentage}% OFF</span>
                            </div>
                          )}
                          
                          {item.isPopular && (
                            <div className="absolute z-10 m-0 top-2 left-2">
                              <span className="flex items-center px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
                                Popular
                              </span>
                            </div>
                          )}
                          
                          {!item.isAvailable && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
                              <span className="px-2 py-1 text-sm font-bold text-white bg-red-500 rounded">
                                Unavailable
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col flex-grow p-4">
                           <h3 className="mb-1 text-lg font-semibold truncate">{item.name}</h3>
                           <p className="flex-grow mb-3 text-sm text-gray-600 line-clamp-2">{item.description}</p>
                           
                           <div className="flex items-center justify-between mt-auto">
                              <div className="text-left">
                                  {hasOffer ? (
                                    <>
                                      <div>
                                        <span className="text-sm text-gray-500 line-through mr-1.5">
                                          Rs. {parseFloat(item.price).toFixed(2)} 
                                        </span>
                                        <span className="text-lg font-bold text-yumrun-red">
                                          Rs. {parseFloat(item.discountedPrice).toFixed(2)}
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <span className="text-lg font-semibold text-gray-800">
                                       Rs. {parseFloat(item.price).toFixed(2)}
                                    </span>
                                  )}
                              </div>
                              
                              {item.isAvailable ? (
                                hasAddOns ? (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleOpenCustomizeModal(item)}
                                    className="gap-1"
                                  >
                                     <FaUtensils className="w-3 h-3"/> Customize
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="primary" 
                                    onClick={() => handleSimpleAddToCart(item)}
                                    className="gap-1"
                                  >
                                     <FaShoppingCart className="w-3 h-3"/> Add
                                  </Button>
                                )
                              ) : (
                                 <span className="text-sm font-semibold text-red-500">Unavailable</span>
                              )}
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-8 text-center">
             <p className="text-gray-500">Restaurant not found.</p>
          </div>
        )}

        {/* Customization Modal */}
        <Dialog open={isCustomizeModalOpen} onOpenChange={setIsCustomizeModalOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Customize {itemToCustomize?.name}</DialogTitle>
                    <DialogDescription>
                        Select your preferred options and add-ons.
                    </DialogDescription>
                </DialogHeader>
                
                {itemToCustomize && (
                   <IngredientCustomizer 
                      menuItem={itemToCustomize} 
                      onChange={handleConfirmAddToCart} // Pass the function to call on confirm
                      onClose={() => setIsCustomizeModalOpen(false)} // Pass function to close modal
                   />
                )}
            </DialogContent>
        </Dialog>

      </Container>
    </div>
  );
};

export default RestaurantDetails; 