const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { promisify } = require('util');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
const User = require('../models/user');
const { Restaurant } = require('../models/restaurant');
const { MenuItem } = require('../models/menuItem');
const { Review } = require('../models/review');
const Order = require('../models/order');

// Create uploads directory structure if it doesn't exist
const createDirIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
};

// Setup uploads directories
const uploadsDir = path.resolve(__dirname, '../uploads');
const restaurantsDir = path.resolve(uploadsDir, 'restaurants');
const menuDir = path.resolve(uploadsDir, 'menu');

createDirIfNotExists(uploadsDir);
createDirIfNotExists(restaurantsDir);
createDirIfNotExists(menuDir);

// Download image and save to file
async function downloadImage(url, filepath) {
  try {
    // Check if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`Image already exists: ${filepath}`);
      return filepath;
    }

    // For demonstration purposes, we'll use placeholder images
    // In production, you'd download from the actual URL
    const placeholderUrl = `https://placehold.co/600x400?text=${encodeURIComponent(path.basename(filepath, path.extname(filepath)))}`;
    
    const response = await axios({
      method: 'GET',
      url: placeholderUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`Downloaded image: ${filepath}`);
        resolve(filepath);
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Error downloading image ${url}:`, error.message);
    return null;
  }
}

// Sample restaurant data
const sampleRestaurants = [
  {
    name: 'Burger Kingdom',
    location: '123 Main Street, Downtown',
    description: 'Serving the best burgers in town since 2010. Juicy, flavorful burgers with fresh ingredients.',
    cuisine: ['Fast Food', 'American', 'Burgers'],
    isOpen: true,
    deliveryRadius: 5,
    minimumOrder: 10,
    deliveryFee: 2.5,
    logo: '/uploads/restaurants/burger_kingdom_logo.jpg',
    owner: null // Will be set later
  },
  {
    name: 'Pizza Paradise',
    location: '456 Oak Avenue, West Village',
    description: 'Authentic Italian pizzas baked in a wood-fired oven. Traditional and creative toppings.',
    cuisine: ['Italian', 'Pizza'],
    isOpen: true,
    deliveryRadius: 7,
    minimumOrder: 15,
    deliveryFee: 3,
    logo: '/uploads/restaurants/pizza_paradise_logo.jpg',
    owner: null // Will be set later
  },
  {
    name: 'Sushi Sensation',
    location: '789 Maple Boulevard, East End',
    description: 'Fresh and flavorful sushi prepared by expert chefs. Premium quality fish and ingredients.',
    cuisine: ['Japanese', 'Sushi', 'Asian'],
    isOpen: true,
    deliveryRadius: 6,
    minimumOrder: 20,
    deliveryFee: 4,
    logo: '/uploads/restaurants/sushi_sensation_logo.jpg',
    owner: null // Will be set later
  },
  {
    name: 'Taco Temple',
    location: '101 Pine Street, West End',
    description: 'Authentic Mexican street food with a modern twist. Fresh ingredients and bold flavors.',
    cuisine: ['Mexican', 'Tacos', 'Latin American'],
    isOpen: false, // Currently closed
    deliveryRadius: 4,
    minimumOrder: 12,
    deliveryFee: 2,
    logo: '/uploads/restaurants/taco_temple_logo.jpg',
    owner: null // Will be set later
  },
  {
    name: 'Curry Corner',
    location: '202 Maple Drive, East Side',
    description: 'Authentic Indian cuisine with rich flavors and aromatic spices. From mild to spicy options.',
    cuisine: ['Indian', 'Curry', 'Asian'],
    isOpen: true,
    deliveryRadius: 8,
    minimumOrder: 18,
    deliveryFee: 3.5,
    logo: '/uploads/restaurants/curry_corner_logo.jpg',
    owner: null // Will be set later
  },
  {
    name: 'Noodle Nook',
    location: '303 Cedar Road, North District',
    description: 'Authentic Thai noodles and dishes with fresh herbs and spices. Flavorful and aromatic.',
    cuisine: ['Thai', 'Noodles', 'Asian'],
    isOpen: true,
    deliveryRadius: 5,
    minimumOrder: 15,
    deliveryFee: 3,
    logo: '/uploads/restaurants/noodle_nook_logo.jpg',
    owner: null // Will be set later
  }
];

// Sample menu items - will be associated with restaurants later
const generateMenuItems = (restaurantId, restaurantName) => {
  const menuItemsMap = {
    'Burger Kingdom': [
      {
        item_name: 'Classic Cheeseburger',
        item_price: 8.99,
        description: 'Juicy beef patty with melted cheese, lettuce, tomato, and special sauce',
        image: '/uploads/menu/classic_cheeseburger.jpg',
        category: 'Main Course',
        calories: 750,
        protein: 35,
        carbs: 40,
        fat: 45,
        sodium: 820,
        isVegetarian: false,
        isPopular: true,
        ingredients: [
          { name: 'Beef Patty', calories: 350, protein: 25, carbs: 0, fat: 28 },
          { name: 'Cheese Slice', calories: 80, protein: 5, carbs: 2, fat: 7 },
          { name: 'Lettuce', calories: 5, protein: 0, carbs: 1, fat: 0 },
          { name: 'Tomato', calories: 10, protein: 0, carbs: 2, fat: 0 },
          { name: 'Special Sauce', calories: 120, protein: 0, carbs: 10, fat: 10 },
          { name: 'Bun', calories: 185, protein: 5, carbs: 25, fat: 0 }
        ],
        healthAttributes: {
          isDiabeticFriendly: false,
          isLowSodium: false,
          isHeartHealthy: false,
          isLowGlycemicIndex: false,
          isHighProtein: true,
          isLowCarb: false
        }
      },
      {
        item_name: 'Double Bacon Burger',
        item_price: 11.99,
        description: 'Two beef patties with crispy bacon, cheddar cheese, and BBQ sauce',
        image: '/uploads/menu/double_bacon_burger.jpg',
        category: 'Main Course',
        calories: 950,
        protein: 55,
        carbs: 42,
        fat: 65,
        sodium: 1200,
        isVegetarian: false,
        isPopular: true,
        ingredients: [
          { name: 'Beef Patty (2)', calories: 700, protein: 50, carbs: 0, fat: 56 },
          { name: 'Bacon', calories: 80, protein: 5, carbs: 0, fat: 7 },
          { name: 'Cheddar Cheese', calories: 80, protein: 5, carbs: 2, fat: 7 },
          { name: 'BBQ Sauce', calories: 40, protein: 0, carbs: 10, fat: 0 },
          { name: 'Lettuce', calories: 5, protein: 0, carbs: 1, fat: 0 },
          { name: 'Tomato', calories: 10, protein: 0, carbs: 2, fat: 0 },
          { name: 'Bun', calories: 185, protein: 5, carbs: 25, fat: 0 }
        ],
        healthAttributes: {
          isDiabeticFriendly: false,
          isLowSodium: false,
          isHeartHealthy: false,
          isLowGlycemicIndex: false,
          isHighProtein: true,
          isLowCarb: false
        }
      },
      {
        item_name: 'Veggie Burger',
        item_price: 9.99,
        description: 'Plant-based patty with lettuce, tomato, avocado, and vegan mayo',
        image: '/uploads/menu/veggie_burger.jpg',
        category: 'Main Course',
        calories: 550,
        protein: 15,
        carbs: 65,
        fat: 25,
        sodium: 680,
        isVegetarian: true,
        isVegan: true,
        isPopular: false,
        ingredients: [
          { name: 'Plant-based Patty', calories: 200, protein: 10, carbs: 25, fat: 12 },
          { name: 'Lettuce', calories: 5, protein: 0, carbs: 1, fat: 0 },
          { name: 'Tomato', calories: 10, protein: 0, carbs: 2, fat: 0 },
          { name: 'Avocado', calories: 80, protein: 1, carbs: 4, fat: 8 },
          { name: 'Vegan Mayo', calories: 70, protein: 0, carbs: 1, fat: 7 },
          { name: 'Whole Grain Bun', calories: 185, protein: 5, carbs: 32, fat: 3 }
        ],
        healthAttributes: {
          isDiabeticFriendly: true,
          isLowSodium: true,
          isHeartHealthy: true,
          isLowGlycemicIndex: true,
          isHighProtein: false,
          isLowCarb: false
        }
      },
      {
        item_name: 'French Fries',
        item_price: 3.99,
        description: 'Crispy golden fries seasoned with sea salt',
        image: '/uploads/menu/french_fries.jpg',
        category: 'Sides',
        calories: 380,
        protein: 4,
        carbs: 50,
        fat: 19,
        sodium: 350,
        isVegetarian: true,
        isVegan: true,
        isPopular: true,
        ingredients: [
          { name: 'Potatoes', calories: 350, protein: 4, carbs: 49, fat: 17 },
          { name: 'Sea Salt', calories: 0, protein: 0, carbs: 0, fat: 0 },
          { name: 'Vegetable Oil', calories: 30, protein: 0, carbs: 0, fat: 3 }
        ],
        healthAttributes: {
          isDiabeticFriendly: false,
          isLowSodium: false,
          isHeartHealthy: false,
          isLowGlycemicIndex: false,
          isHighProtein: false,
          isLowCarb: false
        }
      },
      {
        item_name: 'Chocolate Milkshake',
        item_price: 4.99,
        description: 'Creamy chocolate shake topped with whipped cream',
        image: '/uploads/menu/chocolate_milkshake.jpg',
        category: 'Drinks',
        calories: 450,
        protein: 7,
        carbs: 72,
        fat: 15,
        sodium: 280,
        isVegetarian: true,
        isPopular: false,
        ingredients: [
          { name: 'Ice Cream', calories: 300, protein: 5, carbs: 40, fat: 12 },
          { name: 'Milk', calories: 80, protein: 2, carbs: 10, fat: 3 },
          { name: 'Chocolate Syrup', calories: 50, protein: 0, carbs: 15, fat: 0 },
          { name: 'Whipped Cream', calories: 20, protein: 0, carbs: 2, fat: 1 }
        ],
        healthAttributes: {
          isDiabeticFriendly: false,
          isLowSodium: true,
          isHeartHealthy: false,
          isLowGlycemicIndex: false,
          isHighProtein: false,
          isLowCarb: false
        }
      }
    ],
    'Pizza Paradise': [
      {
        item_name: 'Margherita Pizza',
        item_price: 12.99,
        description: 'Classic pizza with tomato sauce, mozzarella cheese, and fresh basil',
        image: '/uploads/menu/margherita_pizza.jpg',
        category: 'Main Course',
        calories: 820,
        protein: 32,
        carbs: 95,
        fat: 25,
        sodium: 1200,
        isVegetarian: true,
        isPopular: true,
        ingredients: [
          { name: 'Pizza Dough', calories: 400, protein: 12, carbs: 75, fat: 2 },
          { name: 'Tomato Sauce', calories: 50, protein: 1, carbs: 8, fat: 0 },
          { name: 'Mozzarella Cheese', calories: 350, protein: 18, carbs: 2, fat: 22 },
          { name: 'Fresh Basil', calories: 5, protein: 0, carbs: 1, fat: 0 },
          { name: 'Olive Oil', calories: 15, protein: 0, carbs: 0, fat: 2 }
        ],
        healthAttributes: {
          isDiabeticFriendly: false,
          isLowSodium: false,
          isHeartHealthy: false,
          isLowGlycemicIndex: false,
          isHighProtein: false,
          isLowCarb: false
        }
      },
      {
        item_name: 'Pepperoni Pizza',
        item_price: 14.99,
        description: 'Tomato sauce, mozzarella cheese, and spicy pepperoni slices',
        image: '/uploads/menu/pepperoni_pizza.jpg',
        category: 'Main Course',
        calories: 900,
        protein: 38,
        carbs: 95,
        fat: 45,
        sodium: 1600,
        isVegetarian: false,
        isPopular: true
      },
      {
        item_name: 'Vegetarian Pizza',
        item_price: 13.99,
        description: 'Tomato sauce, mozzarella, bell peppers, mushrooms, onions, and olives',
        image: '/uploads/menu/vegetarian_pizza.jpg',
        category: 'Main Course',
        calories: 760,
        protein: 28,
        carbs: 95,
        fat: 20,
        sodium: 1100,
        isVegetarian: true,
        isPopular: false
      },
      {
        item_name: 'Garlic Breadsticks',
        item_price: 5.99,
        description: 'Freshly baked breadsticks brushed with garlic butter and herbs',
        image: '/uploads/menu/garlic_breadsticks.jpg',
        category: 'Appetizers',
        calories: 320,
        protein: 6,
        carbs: 45,
        fat: 14,
        sodium: 580,
        isVegetarian: true,
        isPopular: true
      },
      {
        item_name: 'Tiramisu',
        item_price: 6.99,
        description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone cream',
        image: '/uploads/menu/tiramisu.jpg',
        category: 'Desserts',
        calories: 380,
        protein: 8,
        carbs: 42,
        fat: 18,
        sodium: 120,
        isVegetarian: true,
        isPopular: false
      }
    ],
    'Sushi Sensation': [
      {
        item_name: 'Salmon Sushi Roll',
        item_price: 14.99,
        description: 'Fresh salmon, avocado, and cucumber wrapped in seaweed and rice',
        image: '/uploads/menu/salmon_sushi_roll.jpg',
        category: 'Main Course',
        calories: 420,
        protein: 22,
        carbs: 55,
        fat: 12,
        sodium: 650,
        isVegetarian: false,
        isPopular: true
      },
      {
        item_name: 'Tuna Nigiri',
        item_price: 16.99,
        description: 'Fresh tuna slices over pressed vinegared rice',
        image: '/uploads/menu/tuna_nigiri.jpg',
        category: 'Main Course',
        calories: 320,
        protein: 24,
        carbs: 40,
        fat: 5,
        sodium: 420,
        isVegetarian: false,
        isPopular: true
      },
      {
        item_name: 'Vegetable Tempura',
        item_price: 8.99,
        description: 'Assorted vegetables in a light, crispy batter, served with tempura sauce',
        image: '/uploads/menu/vegetable_tempura.jpg',
        category: 'Appetizers',
        calories: 380,
        protein: 6,
        carbs: 42,
        fat: 21,
        sodium: 480,
        isVegetarian: true,
        isPopular: false
      },
      {
        item_name: 'Miso Soup',
        item_price: 3.99,
        description: 'Traditional Japanese soup with tofu, seaweed, and green onions',
        image: '/uploads/menu/miso_soup.jpg',
        category: 'Appetizers',
        calories: 120,
        protein: 8,
        carbs: 12,
        fat: 6,
        sodium: 750,
        isVegetarian: true,
        isPopular: true
      },
      {
        item_name: 'Green Tea Ice Cream',
        item_price: 5.99,
        description: 'Smooth and creamy matcha-flavored ice cream',
        image: '/uploads/menu/green_tea_ice_cream.jpg',
        category: 'Desserts',
        calories: 210,
        protein: 4,
        carbs: 28,
        fat: 12,
        sodium: 85,
        isVegetarian: true,
        isPopular: false
      }
    ],
    'Taco Temple': [
      {
        item_name: 'Beef Tacos',
        item_price: 9.99,
        description: 'Three soft tacos with seasoned beef, lettuce, cheese, and salsa',
        image: '/uploads/menu/beef_tacos.jpg',
        category: 'Main Course',
        calories: 580,
        protein: 32,
        carbs: 48,
        fat: 28,
        sodium: 980,
        isVegetarian: false,
        isPopular: true
      },
      {
        item_name: 'Chicken Quesadilla',
        item_price: 10.99,
        description: 'Grilled flour tortilla filled with seasoned chicken, melted cheese, and peppers',
        image: '/uploads/menu/chicken_quesadilla.jpg',
        category: 'Main Course',
        calories: 650,
        protein: 38,
        carbs: 52,
        fat: 32,
        sodium: 1050,
        isVegetarian: false,
        isPopular: true
      },
      {
        item_name: 'Vegetarian Burrito',
        item_price: 8.99,
        description: 'Flour tortilla filled with rice, beans, grilled vegetables, guacamole, and sour cream',
        image: '/uploads/menu/vegetarian_burrito.jpg',
        category: 'Main Course',
        calories: 720,
        protein: 18,
        carbs: 95,
        fat: 28,
        sodium: 880,
        isVegetarian: true,
        isPopular: false
      },
      {
        item_name: 'Loaded Nachos',
        item_price: 7.99,
        description: 'Crispy tortilla chips topped with melted cheese, jalapeños, guacamole, and sour cream',
        image: '/uploads/menu/loaded_nachos.jpg',
        category: 'Appetizers',
        calories: 850,
        protein: 22,
        carbs: 72,
        fat: 55,
        sodium: 1200,
        isVegetarian: true,
        isPopular: true
      },
      {
        item_name: 'Churros',
        item_price: 5.99,
        description: 'Fried dough pastries coated with cinnamon sugar, served with chocolate sauce',
        image: '/uploads/menu/churros.jpg',
        category: 'Desserts',
        calories: 290,
        protein: 3,
        carbs: 45,
        fat: 12,
        sodium: 150,
        isVegetarian: true,
        isPopular: false
      }
    ],
    'Curry Corner': [
      {
        item_name: 'Chicken Curry',
        item_price: 13.99,
        description: 'Tender chicken pieces in a rich and spicy curry sauce with rice',
        image: '/uploads/menu/chicken_curry.jpg',
        category: 'Main Course',
        calories: 620,
        protein: 35,
        carbs: 65,
        fat: 25,
        sodium: 950,
        isVegetarian: false,
        isPopular: true
      },
      {
        item_name: 'Vegetable Biryani',
        item_price: 11.99,
        description: 'Fragrant basmati rice cooked with mixed vegetables and aromatic spices',
        image: '/uploads/menu/vegetable_biryani.jpg',
        category: 'Main Course',
        calories: 560,
        protein: 12,
        carbs: 82,
        fat: 18,
        sodium: 720,
        isVegetarian: true,
        isPopular: true
      },
      {
        item_name: 'Butter Naan',
        item_price: 2.99,
        description: 'Soft, leavened flatbread brushed with butter, baked in a tandoor oven',
        image: '/uploads/menu/butter_naan.jpg',
        category: 'Sides',
        calories: 210,
        protein: 5,
        carbs: 35,
        fat: 6,
        sodium: 320,
        isVegetarian: true,
        isPopular: true
      },
      {
        item_name: 'Samosas',
        item_price: 5.99,
        description: 'Crispy pastries filled with spiced potatoes and peas, served with chutney',
        image: '/uploads/menu/samosas.jpg',
        category: 'Appetizers',
        calories: 280,
        protein: 4,
        carbs: 34,
        fat: 14,
        sodium: 380,
        isVegetarian: true,
        isPopular: false
      },
      {
        item_name: 'Mango Lassi',
        item_price: 3.99,
        description: 'Refreshing yogurt-based drink blended with mango and a hint of cardamom',
        image: '/uploads/menu/mango_lassi.jpg',
        category: 'Drinks',
        calories: 220,
        protein: 5,
        carbs: 42,
        fat: 2,
        sodium: 85,
        isVegetarian: true,
        isPopular: false
      }
    ],
    'Noodle Nook': [
      {
        item_name: 'Pad Thai',
        item_price: 11.99,
        description: 'Stir-fried rice noodles with eggs, tofu, bean sprouts, and peanuts',
        image: '/uploads/menu/pad_thai.jpg',
        category: 'Main Course',
        calories: 580,
        protein: 18,
        carbs: 80,
        fat: 22,
        sodium: 1100,
        isVegetarian: true,
        isPopular: true
      },
      {
        item_name: 'Green Curry with Chicken',
        item_price: 12.99,
        description: 'Spicy green curry with chicken, bamboo shoots, eggplant, and Thai basil',
        image: '/uploads/menu/green_curry_chicken.jpg',
        category: 'Main Course',
        calories: 650,
        protein: 32,
        carbs: 42,
        fat: 38,
        sodium: 1250,
        isVegetarian: false,
        isPopular: true
      },
      {
        item_name: 'Tom Yum Soup',
        item_price: 7.99,
        description: 'Hot and sour soup with lemongrass, lime leaves, galangal, and mushrooms',
        image: '/uploads/menu/tom_yum_soup.jpg',
        category: 'Appetizers',
        calories: 320,
        protein: 18,
        carbs: 15,
        fat: 22,
        sodium: 880,
        isVegetarian: true,
        isPopular: false
      },
      {
        item_name: 'Spring Rolls',
        item_price: 6.99,
        description: 'Crispy rolls filled with vegetables and glass noodles, served with sweet chili sauce',
        image: '/uploads/menu/spring_rolls.jpg',
        category: 'Appetizers',
        calories: 260,
        protein: 6,
        carbs: 32,
        fat: 12,
        sodium: 420,
        isVegetarian: true,
        isPopular: true
      },
      {
        item_name: 'Mango Sticky Rice',
        item_price: 5.99,
        description: 'Sweet sticky rice with fresh mango slices and coconut milk',
        image: '/uploads/menu/mango_sticky_rice.jpg',
        category: 'Desserts',
        calories: 380,
        protein: 4,
        carbs: 75,
        fat: 8,
        sodium: 65,
        isVegetarian: true,
        isPopular: false
      }
    ]
  };

  return menuItemsMap[restaurantName].map(item => ({
    ...item,
    restaurant: restaurantId
  }));
};

// Generate sample reviews for a menu item
const generateReviews = (menuItemId, userId, restaurantId, orderId) => {
  const ratings = [3, 4, 5];
  const comments = [
    'Really enjoyed this dish!',
    'Great flavor and presentation.',
    'Perfectly cooked and seasoned.',
    'Would definitely order again.',
    'One of my favorites from this restaurant.',
    'Delicious and satisfying meal.'
  ];
  
  // Generate 1-3 reviews per item
  const numReviews = Math.floor(Math.random() * 3) + 1;
  const reviews = [];
  
  for (let i = 0; i < numReviews; i++) {
    const rating = ratings[Math.floor(Math.random() * ratings.length)];
    const comment = comments[Math.floor(Math.random() * comments.length)];
    
    reviews.push({
      menuItem: menuItemId,
      user: userId,
      rating,
      comment,
      restaurant: restaurantId,
      orderId: orderId,
      dateCreated: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // Random date within last 30 days
    });
  }
  
  return reviews;
};

// Generate a sample order
const generateOrder = (userId, restaurantId, menuItems) => {
  // Use a random subset of menu items (1-3 items)
  const numItems = Math.floor(Math.random() * 3) + 1;
  const selectedItems = [];
  const usedIndices = new Set();
  
  for (let i = 0; i < numItems; i++) {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * menuItems.length);
    } while (usedIndices.has(randomIndex));
    
    usedIndices.add(randomIndex);
    const menuItem = menuItems[randomIndex];
    
    selectedItems.push({
      productId: menuItem._id,
      name: menuItem.item_name,
      price: menuItem.item_price,
      quantity: Math.floor(Math.random() * 2) + 1,
      nutritionalInfo: {
        calories: menuItem.calories,
        protein: menuItem.protein,
        carbs: menuItem.carbs,
        fat: menuItem.fat,
        sodium: menuItem.sodium
      }
    });
  }
  
  // Calculate total price
  const totalPrice = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 2.5;
  const tax = totalPrice * 0.13; // 13% tax rate
  
  return {
    orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: userId,
    restaurantId: restaurantId,
    items: selectedItems,
    totalPrice: totalPrice,
    deliveryFee: deliveryFee,
    tax: tax,
    grandTotal: totalPrice + deliveryFee + tax,
    status: 'DELIVERED',
    paymentMethod: 'CREDIT_CARD',
    paymentStatus: 'PAID',
    isPaid: true,
    paidAt: new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000), // Random date within last 14 days
    deliveryAddress: {
      street: '123 Customer Street',
      city: 'Cityville',
      state: 'State',
      zipCode: '12345',
      country: 'Country'
    },
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // Random date within last 30 days
  };
};

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Connect to the database
    await mongoose.connect(process.env.CONNECTION_STRING);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({ role: 'restaurant' });
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    
    // Only clear reviews created by this script
    // This is safer than deleting all reviews
    if (mongoose.models.Review) {
      await mongoose.models.Review.deleteMany({});
      console.log('Cleared existing reviews');
    }
    
    console.log('Cleared existing restaurant data');

    // Create restaurant owner users
    const restaurants = [];
    for (let i = 0; i < sampleRestaurants.length; i++) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Extract filename and create physical file path
      const logoFilename = path.basename(sampleRestaurants[i].logo);
      const logoFilePath = path.join(restaurantsDir, logoFilename);
      
      // Download the restaurant logo
      await downloadImage(`https://source.unsplash.com/random/?restaurant,${sampleRestaurants[i].name.toLowerCase().replace(/\s+/g, '-')}`, logoFilePath);
      
      // Create the restaurant owner
      const owner = new User({
        fullName: `Owner of ${sampleRestaurants[i].name}`,
        email: `owner${i + 1}@example.com`,
        password: hashedPassword,
        phone: `9876543${String(i + 1).padStart(3, '0')}`, // 10-digit format phone number
        address: sampleRestaurants[i].location, // Using restaurant location as owner address
        role: 'restaurant',
        restaurantDetails: {
          name: sampleRestaurants[i].name,
          address: sampleRestaurants[i].location,
          description: sampleRestaurants[i].description,
          panNumber: Math.floor(100000000 + Math.random() * 900000000).toString(),
          cuisine: sampleRestaurants[i].cuisine,
          approved: true,
          isOpen: sampleRestaurants[i].isOpen,
          deliveryRadius: sampleRestaurants[i].deliveryRadius,
          minimumOrder: sampleRestaurants[i].minimumOrder,
          deliveryFee: sampleRestaurants[i].deliveryFee,
          logo: sampleRestaurants[i].logo
        }
      });
      
      const savedOwner = await owner.save();
      restaurants.push(savedOwner);
      console.log(`Created restaurant owner: ${savedOwner.fullName}`);
    }

    // Create restaurants
    const createdRestaurants = [];
    for (let i = 0; i < sampleRestaurants.length; i++) {
      const restaurant = new Restaurant({
        name: sampleRestaurants[i].name,
        location: sampleRestaurants[i].location,
        description: sampleRestaurants[i].description,
        logo: sampleRestaurants[i].logo,
        owner: restaurants[i]._id,
        isApproved: true
      });
      const savedRestaurant = await restaurant.save();
      createdRestaurants.push(savedRestaurant);
      console.log(`Created restaurant: ${savedRestaurant.name}`);
    }

    // Create menu items for each restaurant
    let menuItemsCount = 0;
    const createdMenuItems = [];
    
    for (let i = 0; i < createdRestaurants.length; i++) {
      const restaurant = createdRestaurants[i];
      const menuItems = generateMenuItems(restaurant.owner, restaurant.name);
      
      for (const menuItem of menuItems) {
        // Download menu item image
        const imageFilename = path.basename(menuItem.image);
        const imageFilePath = path.join(menuDir, imageFilename);
        
        await downloadImage(`https://source.unsplash.com/random/?food,${menuItem.item_name.toLowerCase().replace(/\s+/g, '-')}`, imageFilePath);
        
        const item = new MenuItem(menuItem);
        const savedItem = await item.save();
        createdMenuItems.push(savedItem);
        menuItemsCount++;
      }
    }
    console.log(`Created ${menuItemsCount} menu items`);

    // Create sample customers (if they don't exist already)
    const sampleCustomers = [];
    for (let i = 0; i < 3; i++) {
      const existingUser = await User.findOne({ email: `customer${i + 1}@example.com` });
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const customer = new User({
          fullName: `Customer ${i + 1}`,
          email: `customer${i + 1}@example.com`,
          password: hashedPassword,
          phone: `1234567${String(i + 1).padStart(3, '0')}`,
          address: `${100 + i} Customer Street, Cityville`,
          role: 'customer'
        });
        const savedCustomer = await customer.save();
        sampleCustomers.push(savedCustomer);
        console.log(`Created customer: ${savedCustomer.fullName}`);
      } else {
        sampleCustomers.push(existingUser);
        console.log(`Using existing customer: ${existingUser.fullName}`);
      }
    }

    // Group menu items by restaurant
    const menuItemsByRestaurant = {};
    for (const menuItem of createdMenuItems) {
      const restaurantId = menuItem.restaurant.toString();
      if (!menuItemsByRestaurant[restaurantId]) {
        menuItemsByRestaurant[restaurantId] = [];
      }
      menuItemsByRestaurant[restaurantId].push(menuItem);
    }

    // Create sample orders
    console.log('Creating sample orders...');
    const createdOrders = [];
    for (const restaurantOwner of restaurants) {
      const restaurantId = createdRestaurants.find(r => r.owner.toString() === restaurantOwner._id.toString())._id;
      const menuItems = menuItemsByRestaurant[restaurantOwner._id.toString()] || [];
      
      if (menuItems.length > 0) {
        // Create 2-3 orders per restaurant
        const numOrders = Math.floor(Math.random() * 2) + 2;
        
        for (let i = 0; i < numOrders; i++) {
          // Randomly assign a customer to this order
          const randomCustomer = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
          
          const orderData = generateOrder(randomCustomer._id, restaurantId, menuItems);
          
          if (mongoose.models.Order) {
            const order = new mongoose.models.Order(orderData);
            const savedOrder = await order.save();
            createdOrders.push(savedOrder);
          }
        }
      }
    }
    console.log(`Created ${createdOrders.length} sample orders`);

    // Create reviews for menu items
    if (mongoose.models.Review) {
      let reviewCount = 0;
      
      for (const order of createdOrders) {
        // Create reviews for some (not all) items in the order
        for (const orderItem of order.items) {
          if (Math.random() > 0.3) { // 70% chance to review an item
            const menuItem = createdMenuItems.find(item => item._id.toString() === orderItem.productId.toString());
            
            if (menuItem) {
              const reviews = generateReviews(
                menuItem._id, 
                order.userId, 
                order.restaurantId,
                order._id
              );
              
              for (const reviewData of reviews) {
                const review = new mongoose.models.Review(reviewData);
                await review.save();
                reviewCount++;
                
                // Update menu item with average rating
                menuItem.averageRating = ((menuItem.averageRating * menuItem.numberOfRatings) + reviewData.rating) / (menuItem.numberOfRatings + 1);
                menuItem.numberOfRatings += 1;
                await menuItem.save();
              }
            }
          }
        }
      }
      
      console.log(`Created ${reviewCount} reviews`);
    }

    console.log('Database seeding completed successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeder
seedDatabase(); 