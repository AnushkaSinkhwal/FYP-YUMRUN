import { useState, useEffect } from 'react';
import { Card, Button, Input, Textarea, Label, Alert, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Switch, Badge } from '../../components/ui';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSave, FaGift, FaCheck, FaBan, FaCalendarAlt, FaPercent } from 'react-icons/fa';
import axios from 'axios';
import { restaurantAPI } from '../../utils/api';
import { format } from 'date-fns';

const OFFER_TYPES = [
  'Discount',
  'Special Menu',
  'Buy One Get One',
  'Combo Deal',
  'Other'
];

const APPLIES_TO_OPTIONS = [
  'All Menu',
  'Selected Items'
];

const initialFormData = {
  title: '',
  description: '',
  offerType: 'Discount',
  discountPercentage: 0,
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd'),
  isActive: true,
  appliesTo: 'All Menu',
  menuItems: []
};

const RestaurantOffers = () => {
  const [offers, setOffers] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState(initialFormData);
  const [currentOffer, setCurrentOffer] = useState(null);

  useEffect(() => {
    fetchOffers();
    fetchMenuItems();
  }, []);

  const fetchOffers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setIsLoading(false);
        return;
      }

      const response = await restaurantAPI.getOffers();
      
      if (response.data.success) {
        setOffers(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch offers');
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError(err.response?.data?.message || 'Failed to fetch offers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get('/api/menu/restaurant', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setMenuItems(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'discountPercentage') {
      // Ensure discount percentage is between 0 and 100
      const parsedValue = Math.min(Math.max(parseInt(value) || 0, 0), 100);
      setFormData(prev => ({ ...prev, [name]: parsedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMenuItemSelection = (itemId) => {
    setFormData(prev => {
      // If the item is already selected, remove it
      if (prev.menuItems.includes(itemId)) {
        return {
          ...prev,
          menuItems: prev.menuItems.filter(id => id !== itemId)
        };
      }
      // Otherwise add it
      return {
        ...prev,
        menuItems: [...prev.menuItems, itemId]
      };
    });
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (offer) => {
    setCurrentOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      offerType: offer.offerType,
      discountPercentage: offer.discountPercentage,
      startDate: format(new Date(offer.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(offer.endDate), 'yyyy-MM-dd'),
      isActive: offer.isActive,
      appliesTo: offer.appliesTo,
      menuItems: offer.menuItems?.map(item => item._id || item) || []
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (offer) => {
    setCurrentOffer(offer);
    setIsDeleteDialogOpen(true);
  };

  const handleAddOffer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.startDate || !formData.endDate) {
        setError('Please fill all required fields');
        setIsSubmitting(false);
        return;
      }

      // Validate dates
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate < startDate) {
        setError('End date must be after start date');
        setIsSubmitting(false);
        return;
      }

      // Validate menuItems if appliesTo is 'Selected Items'
      if (formData.appliesTo === 'Selected Items' && formData.menuItems.length === 0) {
        setError('Please select at least one menu item');
        setIsSubmitting(false);
        return;
      }

      const response = await restaurantAPI.createOffer(formData);
      
      if (response.data.success) {
        setSuccess('Offer added successfully!');
        setIsAddDialogOpen(false);
        fetchOffers(); // Refresh the offers
        resetForm();
      } else {
        setError(response.data.message || 'Failed to add offer');
      }
    } catch (err) {
      console.error('Error adding offer:', err);
      setError(err.response?.data?.message || 'Failed to add offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditOffer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.startDate || !formData.endDate) {
        setError('Please fill all required fields');
        setIsSubmitting(false);
        return;
      }

      // Validate dates
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate < startDate) {
        setError('End date must be after start date');
        setIsSubmitting(false);
        return;
      }

      // Validate menuItems if appliesTo is 'Selected Items'
      if (formData.appliesTo === 'Selected Items' && formData.menuItems.length === 0) {
        setError('Please select at least one menu item');
        setIsSubmitting(false);
        return;
      }
      
      const response = await restaurantAPI.updateOffer(currentOffer.id, formData);
      
      if (response.data.success) {
        setSuccess('Offer updated successfully!');
        setIsEditDialogOpen(false);
        fetchOffers(); // Refresh the offers
      } else {
        setError(response.data.message || 'Failed to update offer');
      }
    } catch (err) {
      console.error('Error updating offer:', err);
      setError(err.response?.data?.message || 'Failed to update offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (offer) => {
    try {
      const response = await restaurantAPI.toggleOfferActive(offer.id);
      
      if (response.data.success) {
        setSuccess(`Offer ${response.data.data.isActive ? 'activated' : 'deactivated'} successfully!`);
        fetchOffers(); // Refresh the offers
      } else {
        setError(response.data.message || 'Failed to toggle offer status');
      }
    } catch (err) {
      console.error('Error toggling offer status:', err);
      setError(err.response?.data?.message || 'Failed to toggle offer status. Please try again.');
    }
  };

  const handleDeleteOffer = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await restaurantAPI.deleteOffer(currentOffer.id);
      
      if (response.data.success) {
        setSuccess('Offer deleted successfully!');
        setIsDeleteDialogOpen(false);
        fetchOffers(); // Refresh the offers
      } else {
        setError(response.data.message || 'Failed to delete offer');
      }
    } catch (err) {
      console.error('Error deleting offer:', err);
      setError(err.response?.data?.message || 'Failed to delete offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadgeVariant = (isActive, isExpired) => {
    if (isExpired) return 'warning';
    return isActive ? 'success' : 'secondary';
  };

  const getOfferStatus = (offer) => {
    const now = new Date();
    const startDate = new Date(offer.startDate);
    const endDate = new Date(offer.endDate);
    
    if (now < startDate) return { status: 'Upcoming', expired: false };
    if (now > endDate) return { status: 'Expired', expired: true };
    return { status: offer.isActive ? 'Active' : 'Inactive', expired: false };
  };

  const renderForm = (submitHandler) => (
    <form onSubmit={submitHandler} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="title">Offer Title*</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            placeholder="Enter offer title"
          />
        </div>
        
        <div>
          <Label htmlFor="offerType">Offer Type*</Label>
          <select 
            id="offerType"
            name="offerType"
            value={formData.offerType}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            {OFFER_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
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
          placeholder="Describe the offer"
          rows={3}
        />
      </div>
      
      {(formData.offerType === 'Discount') && (
        <div>
          <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
          <Input
            id="discountPercentage"
            name="discountPercentage"
            type="number"
            min="0"
            max="100"
            value={formData.discountPercentage}
            onChange={handleInputChange}
            placeholder="Enter discount percentage"
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="startDate">Start Date*</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="endDate">End Date*</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
        <Label htmlFor="isActive">Offer Active</Label>
      </div>
      
      <div>
        <Label htmlFor="appliesTo">Applies To*</Label>
        <select 
          id="appliesTo"
          name="appliesTo"
          value={formData.appliesTo}
          onChange={handleInputChange}
          required
          className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          {APPLIES_TO_OPTIONS.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      
      {formData.appliesTo === 'Selected Items' && (
        <div>
          <Label>Select Menu Items</Label>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {menuItems.length === 0 ? (
              <p className="text-gray-500">No menu items available</p>
            ) : (
              menuItems.map(item => (
                <div 
                  key={item.id}
                  className={`border rounded-md p-2 cursor-pointer ${formData.menuItems.includes(item.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'}`}
                  onClick={() => handleMenuItemSelection(item.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 mt-1">
                      {formData.menuItems.includes(item.id) && <FaCheck className="text-blue-500" />}
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">${parseFloat(item.price).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {menuItems.length > 0 && formData.menuItems.length === 0 && (
            <p className="mt-2 text-sm text-red-500">Please select at least one menu item</p>
          )}
        </div>
      )}
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Offers Management</h1>
        <Button className="flex items-center gap-2" onClick={openAddDialog}>
          <FaPlus size={16} />
          Add Offer
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

      {offers.length === 0 ? (
        <Card className="p-6 text-center">
          <FaGift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold">No Offers</h3>
          <p className="mb-4 text-gray-600">You haven&apos;t added any offers yet.</p>
          <Button onClick={openAddDialog}>Add Your First Offer</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {offers.map(offer => {
            const { status, expired } = getOfferStatus(offer);
            return (
              <Card key={offer.id} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{offer.title}</h3>
                    <Badge variant={getBadgeVariant(offer.isActive, expired)}>
                      {status}
                    </Badge>
                  </div>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">{offer.description}</p>
                  
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FaCalendarAlt />
                      <span>
                        {format(new Date(offer.startDate), 'MMM d, yyyy')} - {format(new Date(offer.endDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {offer.offerType === 'Discount' && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <FaPercent />
                        <span>{offer.discountPercentage}% off</span>
                      </div>
                    )}
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <span className="font-medium">Type:</span> {offer.offerType}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <span className="font-medium">Applies to:</span> {offer.appliesTo}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Button 
                      variant={offer.isActive ? "outline" : "default"}
                      size="sm" 
                      onClick={() => handleToggleActive(offer)}
                      disabled={expired}
                    >
                      {offer.isActive ? (
                        <><FaBan className="mr-1" /> Deactivate</>
                      ) : (
                        <><FaCheck className="mr-1" /> Activate</>
                      )}
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(offer)}>
                        <FaEdit className="mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(offer)}>
                        <FaTrash className="mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Offer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Offer</DialogTitle>
            <p className="text-sm text-gray-500">
              Create a new offer for your customers.
            </p>
          </DialogHeader>
          
          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}
          
          {renderForm(handleAddOffer)}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
              <FaTimes className="mr-2" /> Cancel
            </Button>
            <Button onClick={handleAddOffer} disabled={isSubmitting}>
              <FaSave className="mr-2" /> {isSubmitting ? 'Adding...' : 'Add Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Offer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Offer</DialogTitle>
            <p className="text-sm text-gray-500">
              Update the details of your offer.
            </p>
          </DialogHeader>
          
          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}
          
          {renderForm(handleEditOffer)}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              <FaTimes className="mr-2" /> Cancel
            </Button>
            <Button onClick={handleEditOffer} disabled={isSubmitting}>
              <FaSave className="mr-2" /> {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Offer Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this offer? This action cannot be undone.
            </p>
          </DialogHeader>
          
          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}
          
          <div className="py-4">
            <p className="mb-2 font-medium">{currentOffer?.title}</p>
            <p className="text-gray-600">{currentOffer?.description}</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              <FaTimes className="mr-2" /> Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteOffer} disabled={isSubmitting}>
              <FaTrash className="mr-2" /> {isSubmitting ? 'Deleting...' : 'Delete Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantOffers; 