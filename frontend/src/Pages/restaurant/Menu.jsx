import { useState } from 'react';
import { Card, Button } from '../../components/ui';
import { FaPlus } from 'react-icons/fa';

const RestaurantMenu = () => {
  const [menuItems] = useState([
    {
      id: 1,
      name: 'Classic Burger',
      description: 'Juicy beef patty with lettuce, tomato, and special sauce',
      price: 12.99,
      category: 'Burgers',
      image: 'https://example.com/burger.jpg',
      isAvailable: true
    },
    // Add more menu items here
  ]);

  const categories = [...new Set(menuItems.map(item => item.category))];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Menu Management</h1>
        <Button className="flex items-center gap-2">
          <FaPlus size={16} />
          Add Menu Item
        </Button>
      </div>

      {categories.map(category => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems
              .filter(item => item.category === category)
              .map(item => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                    {/* Replace with actual image component */}
                    <div className="w-full h-48 bg-gray-300 dark:bg-gray-600" />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{item.name}</h3>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          item.isAvailable ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RestaurantMenu; 