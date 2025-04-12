import { useState, useEffect } from 'react';
import { Card, Button, Input, Textarea, Label, Alert, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSave, FaUtensils } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { getFullImageUrl, PLACEHOLDERS } from '../../utils/imageUtils';

// API URL from environment or default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_BASE = API_URL.endsWith('/api') ? API_URL.substring(0, API_URL.length - 4) : API_URL;

console.log('API configuration:', { 
  API_URL,
  API_BASE
});

// Helper function to get the complete image URL
const getImageUrl = (imagePath) => {
  return getFullImageUrl(imagePath);
};

const CATEGORIES = [
  'Appetizers',
  'Main Course',
  'Desserts',
  'Drinks',
  'Beverages',
  'Sides',
  'Specials',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Vegan',
  'Vegetarian',
  'Gluten-Free'
];

const initialFormData = {
  name: '',
  description: '',
  price: '',
  image: null,
  imagePreview: '',
  category: 'Main Course',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  isVegetarian: false,
  isVegan: false,
  isGlutenFree: false,
  isAvailable: true
};

const RestaurantMenu = () => {
  // eslint-disable-next-line no-unused-vars
  const { currentUser, isRestaurantOwner } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState(initialFormData);
  const [currentItem, setCurrentItem] = useState(null);

  useEffect(() => {
    console.log('RestaurantMenu component mounted, API_BASE =', API_BASE);
    console.log('VITE_API_URL =', import.meta.env.VITE_API_URL);
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setIsLoading(false);
        return;
      }

      console.log('Fetching menu items from API...');
      const response = await axios.get('/api/menu/restaurant', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        console.log('Menu items received:', response.data.data.length);
        
        // Process and log each menu item's image
        const processedItems = response.data.data.map(item => {
          console.log(`Processing menu item: ${item.id} - ${item.name}`);
          console.log(`Original image path: ${item.image}`);
          
          // For debugging, log the full path that will be used
          if (item.image) {
            const fullImageUrl = getImageUrl(item.image);
            console.log(`Full image URL: ${fullImageUrl}`);
            
            // Test if the image URL is accessible
            fetch(fullImageUrl, { method: 'HEAD' })
              .then(res => {
                console.log(`Image fetch status for ${item.id}: ${res.status} ${res.statusText}`);
              })
              .catch(err => {
                console.error(`Failed to fetch image for ${item.id}:`, err);
              });
          }
          
          return item;
        });
        
        setMenuItems(processedItems);
      } else {
        setError(response.data.message || 'Failed to fetch menu items');
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError(err.response?.data?.message || 'Failed to fetch menu items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      const file = e.target.files[0];
      if (file) {
        console.log('File selected:', file.name, file.type, file.size);
        // Handle image file
        const reader = new FileReader();
        reader.onload = (event) => {
          console.log('FileReader loaded image, preview URL length:', event.target.result.length);
          setFormData(prev => ({
            ...prev,
            image: file,
            imagePreview: event.target.result
          }));
        };
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
        };
        reader.readAsDataURL(file);
      } else {
        console.log('No file selected or file selection canceled');
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setCurrentItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      image: null,
      imagePreview: item.image ? getImageUrl(item.image) : '',
      isAvailable: item.isAvailable,
      calories: item.calories?.toString() || '',
      protein: item.protein?.toString() || '',
      carbs: item.carbs?.toString() || '',
      fat: item.fat?.toString() || '',
      isVegetarian: item.isVegetarian || false,
      isVegan: item.isVegan || false,
      isGlutenFree: item.isGlutenFree || false
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item) => {
    setCurrentItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.name || !formData.description || !formData.price) {
        setError('Please fill all required fields');
        setIsSubmitting(false);
        return;
      }

      // Get and validate auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Auth token for menu item creation:', token.substring(0, 10) + '...');
      
      // Create form data for file upload
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('category', formData.category);
      data.append('isAvailable', formData.isAvailable ? 'true' : 'false');
      
      if (formData.calories) data.append('calories', formData.calories);
      if (formData.protein) data.append('protein', formData.protein);
      if (formData.carbs) data.append('carbs', formData.carbs);
      if (formData.fat) data.append('fat', formData.fat);
      
      data.append('isVegetarian', formData.isVegetarian ? 'true' : 'false');
      data.append('isVegan', formData.isVegan ? 'true' : 'false');
      data.append('isGlutenFree', formData.isGlutenFree ? 'true' : 'false');
      
      if (formData.image instanceof File) {
        console.log('Image being uploaded:', formData.image.name, formData.image.type, formData.image.size);
        data.append('image', formData.image);
      } else {
        console.log('No image file to upload');
      }
      
      console.log('Sending menu item data:', {
        name: formData.name,
        description: formData.description?.substring(0, 20) + '...',
        price: formData.price,
        category: formData.category,
        hasImage: !!formData.image
      });
      
      const response = await axios.post('/api/menu', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        console.log('Menu item added successfully!', response.data);
        if (response.data.data.image) {
          console.log('Image path in response:', response.data.data.image);
          console.log('Full image URL would be:', getImageUrl(response.data.data.image));
        }
        
        setSuccess('Menu item added successfully!');
        setIsAddDialogOpen(false);
        fetchMenuItems(); // Refresh the menu items
        resetForm();
      }
    } catch (err) {
      console.error('Error adding menu item:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add menu item. Please check all fields and try again.';
      console.log('Error response data:', err.response?.data);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMenuItem = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.name || !formData.description || !formData.price) {
        setError('Please fill all required fields');
        setIsSubmitting(false);
        return;
      }
      
      // Create form data for file upload
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('category', formData.category);
      data.append('isAvailable', formData.isAvailable);
      
      if (formData.calories) data.append('calories', formData.calories);
      if (formData.protein) data.append('protein', formData.protein);
      if (formData.carbs) data.append('carbs', formData.carbs);
      if (formData.fat) data.append('fat', formData.fat);
      
      data.append('isVegetarian', formData.isVegetarian);
      data.append('isVegan', formData.isVegan);
      data.append('isGlutenFree', formData.isGlutenFree);
      
      if (formData.image) {
        data.append('image', formData.image);
      }
      
      const response = await axios.put(`/api/menu/${currentItem.id}`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setSuccess('Menu item updated successfully!');
        setIsEditDialogOpen(false);
        fetchMenuItems(); // Refresh the menu items
      }
    } catch (err) {
      console.error('Error updating menu item:', err);
      setError(err.response?.data?.message || 'Failed to update menu item. Please check all fields and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMenuItem = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await axios.delete(`/api/menu/${currentItem.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.data.success) {
        setSuccess('Menu item deleted successfully!');
        setIsDeleteDialogOpen(false);
        fetchMenuItems(); // Refresh the menu items
      }
    } catch (err) {
      console.error('Error deleting menu item:', err);
      setError(err.response?.data?.message || 'Failed to delete menu item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group menu items by category
  const menuItemsByCategory = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const renderForm = (submitHandler) => (
    <form onSubmit={submitHandler} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="name">Item Name*</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Enter item name"
          />
        </div>
        
        <div>
          <Label htmlFor="price">Price*</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={handleInputChange}
            required
            placeholder="Enter price"
          />
        </div>
        
        <div>
          <Label htmlFor="category">Category*</Label>
          <select 
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            {CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center justify-start h-full">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isAvailable"
              name="isAvailable"
              checked={formData.isAvailable}
              onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
              className="w-4 h-4"
            />
            <Label htmlFor="isAvailable" className="ml-2">Available for order</Label>
          </div>
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description*</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          placeholder="Describe the item"
          rows={3}
        />
      </div>
      
      <div>
        <Label htmlFor="image">Image</Label>
        <Input
          id="image"
          name="image"
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="cursor-pointer"
        />
        {formData.imagePreview && (
          <div className="mt-2">
            <img 
              src={formData.imagePreview} 
              alt="Preview" 
              className="object-cover w-auto border border-gray-300 rounded-md h-28"
              onError={(e) => {
                console.error('Error loading image preview:', formData.imagePreview);
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/300x200?text=Preview+Not+Available';
              }}
            />
          </div>
        )}
      </div>
      
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="mb-3 font-medium text-gray-700 dark:text-gray-300">Nutritional Information (Optional)</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <Label htmlFor="calories">Calories</Label>
            <Input
              id="calories"
              name="calories"
              type="number"
              value={formData.calories}
              onChange={handleInputChange}
              placeholder="kcal"
            />
          </div>
          <div>
            <Label htmlFor="protein">Protein</Label>
            <Input
              id="protein"
              name="protein"
              type="number"
              value={formData.protein}
              onChange={handleInputChange}
              placeholder="g"
            />
          </div>
          <div>
            <Label htmlFor="carbs">Carbs</Label>
            <Input
              id="carbs"
              name="carbs"
              type="number"
              value={formData.carbs}
              onChange={handleInputChange}
              placeholder="g"
            />
          </div>
          <div>
            <Label htmlFor="fat">Fat</Label>
            <Input
              id="fat"
              name="fat"
              type="number"
              value={formData.fat}
              onChange={handleInputChange}
              placeholder="g"
            />
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="mb-3 font-medium text-gray-700 dark:text-gray-300">Dietary Information</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isVegetarian"
              name="isVegetarian"
              checked={formData.isVegetarian}
              onChange={(e) => setFormData(prev => ({ ...prev, isVegetarian: e.target.checked }))}
              className="w-4 h-4"
            />
            <Label htmlFor="isVegetarian" className="ml-2">Vegetarian</Label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isVegan"
              name="isVegan"
              checked={formData.isVegan}
              onChange={(e) => setFormData(prev => ({ ...prev, isVegan: e.target.checked }))}
              className="w-4 h-4"
            />
            <Label htmlFor="isVegan" className="ml-2">Vegan</Label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isGlutenFree"
              name="isGlutenFree"
              checked={formData.isGlutenFree}
              onChange={(e) => setFormData(prev => ({ ...prev, isGlutenFree: e.target.checked }))}
              className="w-4 h-4"
            />
            <Label htmlFor="isGlutenFree" className="ml-2">Gluten Free</Label>
          </div>
        </div>
      </div>
    </form>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-yumrun-orange"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Menu Management</h1>
        <Button className="flex items-center gap-2" onClick={openAddDialog}>
          <FaPlus size={16} />
          Add Menu Item
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-4" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {menuItems.length === 0 ? (
        <Card className="p-6 text-center">
          <FaUtensils className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold">No Menu Items</h3>
          <p className="mb-4 text-gray-600">You haven&apos;t added any menu items yet.</p>
          <Button onClick={openAddDialog}>Add Your First Menu Item</Button>
        </Card>
      ) : (
        Object.entries(menuItemsByCategory).map(([category, items]) => (
        <div key={category} className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">{category}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map(item => (
                <Card key={item.id} className="overflow-hidden">
                  {item.image ? (
                    <div className="bg-gray-200 aspect-w-16 aspect-h-9 dark:bg-gray-700">
                      <img 
                        src={getImageUrl(item.image)} 
                        alt={item.name} 
                        className="object-cover w-full h-48"
                        onError={(e) => {
                          console.error('Error loading image:', item.image);
                          e.target.onerror = null;
                          e.target.src = PLACEHOLDERS.FOOD;
                          
                          // Add border to make it clear this is a placeholder
                          e.target.style.border = '2px dashed #ff0000';
                          e.target.style.padding = '8px';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full h-48 bg-gray-300 dark:bg-gray-600">
                      <FaUtensils className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{item.name}</h3>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${parseFloat(item.price).toFixed(2)}
                      </span>
                    </div>
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          item.isAvailable ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                          <FaEdit className="mr-1" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(item)}>
                          <FaTrash className="mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
        ))
      )}

      {/* Add Menu Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" aria-describedby="add-menu-item-description">
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
            <p id="add-menu-item-description" className="text-sm text-gray-500">
              Fill in the details to add a new menu item to your restaurant.
            </p>
          </DialogHeader>
          
          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}
          
          {renderForm(handleAddMenuItem)}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
              <FaTimes className="mr-2" /> Cancel
            </Button>
            <Button onClick={handleAddMenuItem} disabled={isSubmitting}>
              <FaSave className="mr-2" /> {isSubmitting ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Menu Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" aria-describedby="edit-menu-item-description">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <p id="edit-menu-item-description" className="text-sm text-gray-500">
              Update the details of your menu item.
            </p>
          </DialogHeader>
          
          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}
          
          {renderForm(handleEditMenuItem)}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              <FaTimes className="mr-2" /> Cancel
            </Button>
            <Button onClick={handleEditMenuItem} disabled={isSubmitting}>
              <FaSave className="mr-2" /> {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Menu Item Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby="delete-menu-item-description">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <p id="delete-menu-item-description" className="text-sm text-gray-500">
              Are you sure you want to delete this menu item? This action cannot be undone.
            </p>
          </DialogHeader>
          
          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}
          
          <div className="py-4">
            <p className="mb-2 font-medium">{currentItem?.name}</p>
            <p className="text-gray-600">{currentItem?.description}</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              <FaTimes className="mr-2" /> Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteMenuItem} disabled={isSubmitting}>
              <FaTrash className="mr-2" /> {isSubmitting ? 'Deleting...' : 'Delete Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantMenu; 