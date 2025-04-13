import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, Spinner, Alert } from '../../components/ui';
import { FaStar, FaMapMarkerAlt, FaUtensils, FaPhone, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { getFullImageUrl, PLACEHOLDERS } from '../../utils/imageUtils';

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
            console.log(`Processing menu item: ${item.name}, Restaurant:`, item.restaurant);
            
            return {
              id: item._id || item.id,
              name: item.name,
              description: item.description || 'No description available',
              price: item.price || 0,
              category: item.category || 'Uncategorized',
              image: item.image ? getFullImageUrl(item.image) : PLACEHOLDERS.FOOD,
              isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
              isVegetarian: item.isVegetarian || false,
              isVegan: item.isVegan || false,
              isGlutenFree: item.isGlutenFree || false,
              isPopular: item.isPopular || false,
              rating: item.averageRating > 0 ? item.averageRating : 0,
              totalReviews: item.numberOfRatings || 0,
              calories: item.nutritionInfo?.calories || null,
              allergens: item.allergens || [],
              restaurant: {
                id: restaurant.id || restaurant._id,
                name: restaurant.name
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

  // Handle add to cart
  const handleAddToCart = (item) => {
    if (!restaurant) return;
    
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      restaurantId: restaurant.id || restaurant._id,
      restaurantName: restaurant.name
    });
  };

  return (
    <div className="py-8">
      <Container>
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
                  src={restaurant.image ? getFullImageUrl(restaurant.image) : 
                       restaurant.logo ? getFullImageUrl(restaurant.logo) : 
                       PLACEHOLDERS.RESTAURANT} 
                  alt={restaurant.name} 
                  className="object-cover w-full h-full"
                />
                <div className="absolute top-0 right-0 m-4">
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${restaurant.isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {restaurant.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
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
                        <span>{restaurant.address || restaurant.location || 'Address not available'}</span>
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
                  {filteredMenuItems.map(item => (
                    <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:scale-[1.02]">
                      <div className="relative">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="object-cover w-full h-48 cursor-pointer"
                          onClick={() => navigate(`/product/${item.id}`)}
                        />
                        {item.isPopular && (
                          <div className="absolute top-0 left-0 m-2">
                            <span className="flex items-center px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
                              Popular
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
                          <div className="flex items-center">
                            {item.rating > 0 ? (
                              <>
                                <FaStar className="mr-1 text-yellow-500" />
                                <span className="text-sm font-medium">{item.rating}</span>
                                <span className="ml-1 text-sm text-gray-500">({item.totalReviews || 0} reviews)</span>
                              </>
                            ) : (
                              <span className="text-sm text-gray-500">No ratings yet</span>
                            )}
                          </div>
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
          </>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-500">Restaurant not found</p>
          </div>
        )}
      </Container>
    </div>
  );
};

export default RestaurantDetails; 