import { useState } from 'react';
import { Card, Button, Input } from '../../components/ui';
import { FaSearch, FaHeart, FaStar, FaClock, FaUtensils, FaMapMarkerAlt } from 'react-icons/fa';

const UserFavorites = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('restaurants');

  // Sample data - replace with API data
  const favoriteRestaurants = [
    {
      id: 1,
      name: "Burger Palace",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      rating: 4.5,
      deliveryTime: "30-45 min",
      cuisine: "American",
      address: "123 Food Street, City",
      isFavorite: true
    },
    {
      id: 2,
      name: "Pizza Express",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      rating: 4.8,
      deliveryTime: "25-35 min",
      cuisine: "Italian",
      address: "456 Pizza Avenue, City",
      isFavorite: true
    }
  ];

  const favoriteItems = [
    {
      id: 1,
      name: "Classic Burger",
      restaurant: "Burger Palace",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      price: 12.99,
      rating: 4.7,
      isFavorite: true
    },
    {
      id: 2,
      name: "Margherita Pizza",
      restaurant: "Pizza Express",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      price: 15.99,
      rating: 4.9,
      isFavorite: true
    }
  ];

  const filteredRestaurants = favoriteRestaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredItems = favoriteItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.restaurant.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'restaurants' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('restaurants')}
        >
          Restaurants
        </Button>
        <Button
          variant={activeTab === 'items' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('items')}
        >
          Menu Items
        </Button>
      </div>

      {activeTab === 'restaurants' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map(restaurant => (
            <Card key={restaurant.id} className="overflow-hidden">
              <div className="relative h-48">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                >
                  <FaHeart className="h-5 w-5 text-red-500" />
                </Button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <FaStar className="text-yellow-400" />
                  <span>{restaurant.rating}</span>
                  <span>•</span>
                  <FaClock className="text-gray-400" />
                  <span>{restaurant.deliveryTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <FaUtensils className="text-gray-400" />
                  <span>{restaurant.cuisine}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <FaMapMarkerAlt className="text-gray-400" />
                  <span>{restaurant.address}</span>
                </div>
                <Button className="w-full mt-4">View Menu</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative h-48">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                >
                  <FaHeart className="h-5 w-5 text-red-500" />
                </Button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.restaurant}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <FaStar className="text-yellow-400" />
                    <span className="text-sm">{item.rating}</span>
                  </div>
                  <span className="font-semibold">${item.price.toFixed(2)}</span>
                </div>
                <Button className="w-full mt-4">Add to Cart</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredRestaurants.length === 0 && activeTab === 'restaurants' && (
        <div className="text-center py-12">
          <FaHeart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No favorite restaurants yet</h3>
          <p className="text-gray-500 mt-2">Start adding restaurants to your favorites!</p>
        </div>
      )}

      {filteredItems.length === 0 && activeTab === 'items' && (
        <div className="text-center py-12">
          <FaHeart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No favorite menu items yet</h3>
          <p className="text-gray-500 mt-2">Start adding menu items to your favorites!</p>
        </div>
      )}
    </div>
  );
};

export default UserFavorites; 