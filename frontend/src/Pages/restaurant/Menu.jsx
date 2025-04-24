import { useState, useEffect } from 'react';
import { Card, Button, Input, Textarea, Label, Alert, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui';
import { FaPlus, FaTrash, FaTimes, FaSave, FaUtensils } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { getFullImageUrl, PLACEHOLDERS } from '../../utils/imageUtils';
import { toast } from 'react-hot-toast';

// API URL from environment or default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_BASE = API_URL.endsWith('/api') ? API_URL.substring(0, API_URL.length - 4) : API_URL;

console.log('API configuration:', { 
  API_URL,
  API_BASE
});

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
  const [menuItemsByCategory, setMenuItemsByCategory] = useState({});
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
    try {
      console.log('Fetching menu items...');
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/menu/restaurant`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      console.log('API response for menu items:', response.data);
      
      if (response.data && response.data.success) {
        const items = response.data.data || [];
        console.log('Received menu items:', items.length);
        
        // Debug each item to check the data structure
        items.forEach((item, index) => {
          console.log(`Menu item ${index + 1}:`, {
            id: item.id || item._id,
            name: item.name || item.item_name,
            price: item.price || item.item_price,
            image: item.image || item.imageUrl,
            category: item.category || 'Other'
          });
        });
        
        // Map fields to ensure consistent naming
        const mappedItems = items.map(item => ({
          ...item,
          id: item.id || item._id,
          name: item.name || item.item_name,
          price: item.price || item.item_price,
          image: item.image || item.imageUrl,
          category: item.category || 'Other'
        }));
        
        console.log('Mapped items with consistent naming:', mappedItems.length);
        
        // Store the flat list of items
        setMenuItems(mappedItems);
        
        // Organize items by category
        const categorized = {};
        mappedItems.forEach(item => {
          const category = item.category || 'Other';
          if (!categorized[category]) {
            categorized[category] = [];
          }
          categorized[category].push(item);
        });
        
        console.log('Categories found:', Object.keys(categorized));
        
        // Set the categorized items separately
        setMenuItemsByCategory(categorized);
      } else {
        console.error('Failed to fetch menu items:', response.data?.message || 'Unknown error');
        toast.error('Failed to load menu items');
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
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
    console.log('Opening edit dialog for item:', item);
    setCurrentItem(item);
    
    // Determine the image preview URL
    let imagePreview = '';
    if (item.image && typeof item.image === 'string' && item.image.trim() !== '') {
      imagePreview = getFullImageUrl(item.image);
    } else if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim() !== '') {
      imagePreview = getFullImageUrl(item.imageUrl);
    }
    
    console.log('Image preview URL:', imagePreview);
    
    setFormData({
      name: item.name || item.item_name,
      description: item.description,
      price: (item.price || item.item_price).toString(),
      category: item.category,
      image: null,
      imagePreview: imagePreview,
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
    
    try {
      console.log('Form data before submission:', formData);
      
      // Create FormData for file upload
      const formDataObj = new FormData();
      
      // Add all fields to the form data
      formDataObj.append('name', formData.name);
      formDataObj.append('description', formData.description);
      formDataObj.append('price', formData.price);
      formDataObj.append('category', formData.category);
      formDataObj.append('isAvailable', formData.isAvailable ? 'true' : 'false');
      
      if (formData.calories) formDataObj.append('calories', formData.calories);
      if (formData.protein) formDataObj.append('protein', formData.protein);
      if (formData.carbs) formDataObj.append('carbs', formData.carbs);
      if (formData.fat) formDataObj.append('fat', formData.fat);
      
      formDataObj.append('isVegetarian', formData.isVegetarian ? 'true' : 'false');
      formDataObj.append('isVegan', formData.isVegan ? 'true' : 'false');
      formDataObj.append('isGlutenFree', formData.isGlutenFree ? 'true' : 'false');
      
      // Add the image file if it exists
      if (formData.image instanceof File) {
        formDataObj.append('image', formData.image);
        console.log('Image file being uploaded:', formData.image.name, formData.image.type, formData.image.size);
      }
      
      // Configure the request with the correct content type for FormData
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
      };
      
      console.log('Submitting new menu item...');
      const response = await axios.post(`${API_URL}/menu`, formDataObj, config);
      console.log('Add menu item response:', response.data);
      
      if (response.data && response.data.success) {
        toast.success('Menu item added successfully!');
        // Clear the form
        resetForm();
        setIsAddDialogOpen(false);
        
        // Refresh the menu items
        fetchMenuItems();
      } else {
        console.error('Failed to add menu item:', response.data?.message || 'Unknown error');
        toast.error(response.data?.message || 'Failed to add menu item');
      }
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast.error(error.response?.data?.message || 'Failed to add menu item');
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
      
      // Get the item ID from currentItem
      const itemId = currentItem?.id || currentItem?._id;
      if (!itemId) {
        setError('Item ID is missing');
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
      
      const response = await axios.put(`${API_URL}/menu/${itemId}`, data, {
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
      // Get the item ID from currentItem
      const itemId = currentItem?.id || currentItem?._id;
      if (!itemId) {
        setError('Item ID is missing');
        setIsSubmitting(false);
        return;
      }
      
      const response = await axios.delete(`${API_URL}/menu/${itemId}`, {
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

  const renderMenuItem = (item) => {
    // Ensure we have a valid item object to work with
    if (!item) {
      console.error('Invalid menu item received:', item);
      return null;
    }
    
    // Log the item details for debugging
    console.log('Rendering menu item:', { 
      id: item.id || item._id,
      name: item.name,
      image: item.image,
      price: item.price
    });
    
    // Get the image URL or use placeholder if not available
    let imageUrl = '';
    
    if (item.image && typeof item.image === 'string' && item.image.trim() !== "") {
      imageUrl = getFullImageUrl(item.image);
      console.log(`Using image URL for ${item.name}:`, imageUrl);
    } else if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim() !== "") {
      imageUrl = getFullImageUrl(item.imageUrl);
      console.log(`Using imageUrl for ${item.name}:`, imageUrl);
    } else {
      imageUrl = PLACEHOLDERS.FOOD;
      console.log(`Using placeholder for ${item.name}:`, imageUrl);
    }
    
    // Generate a unique key using id or _id
    const itemKey = item.id || item._id || `menu-item-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div key={itemKey} className="p-4 bg-white rounded-lg shadow">
        <div className="relative h-48 mb-4">
          <img
            src={imageUrl}
            alt={item.name || item.item_name || 'Menu item'}
            className="object-cover w-full h-full rounded"
            onError={(e) => {
              console.error(`Error loading image for ${item.name}:`, e);
              e.target.src = PLACEHOLDERS.FOOD;
            }}
          />
        </div>
        <h3 className="text-xl font-semibold">{item.name || item.item_name || 'Unnamed item'}</h3>
        <p className="my-2 text-gray-600">{item.description || 'No description available'}</p>
        <p className="font-bold text-red-500">
          £{parseFloat(item.price || item.item_price || 0).toFixed(2)}
        </p>
        <div className="flex flex-wrap gap-2 mt-2 mb-3">
          {item.isVegan && (
            <span className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded">Vegan</span>
          )}
          {item.isGlutenFree && (
            <span className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded">Gluten Free</span>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={() => openEditDialog(item)} 
            className="px-3 py-1 text-white transition bg-blue-500 rounded hover:bg-blue-600"
          >
            Edit
          </button>
          <button 
            onClick={() => openDeleteDialog(item)} 
            className="px-3 py-1 text-white transition bg-red-500 rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

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
              {items.map(item => renderMenuItem(item))}
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