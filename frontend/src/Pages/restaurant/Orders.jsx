import { useState, useEffect, useCallback } from "react";
import { restaurantAPI } from "../../utils/api";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Alert,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui";
import {
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaTruck,
  FaHourglassHalf,
  FaCalendarAlt,
  FaUser,
  FaDollarSign,
  FaSync,
  FaShoppingCart,
  FaMotorcycle,
  FaHistory,
} from "react-icons/fa";
import { format } from "date-fns";
import ErrorBoundary from "../../components/shared/ErrorBoundary";
import { useToast } from "../../context/ToastContext";

// Status colors for display
const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-indigo-100 text-indigo-800",
  READY: "bg-purple-100 text-purple-800",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const STATUS_ICONS = {
  PENDING: <FaHourglassHalf className="inline mr-1" />,
  CONFIRMED: <FaCheckCircle className="inline mr-1" />,
  PREPARING: <FaHourglassHalf className="inline mr-1" />,
  READY: <FaCheckCircle className="inline mr-1" />,
  OUT_FOR_DELIVERY: <FaTruck className="inline mr-1" />,
  DELIVERED: <FaCheckCircle className="inline mr-1 text-green-500" />,
  CANCELLED: <FaTimesCircle className="inline mr-1 text-red-500" />,
};

const RestaurantOrdersContent = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { addToast } = useToast();

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [isAssignRiderDialogOpen, setIsAssignRiderDialogOpen] = useState(false);
  const [isStatusHistoryDialogOpen, setIsStatusHistoryDialogOpen] = useState(false);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [isLoadingRiders, setIsLoadingRiders] = useState(false);
  const [isAssigningRider, setIsAssigningRider] = useState(false);
  const [statusHistory, setStatusHistory] = useState([]);
  const [isLoadingStatusHistory, setIsLoadingStatusHistory] = useState(false);
  const [selectedStatusOption, setSelectedStatusOption] = useState("");

  // Memoize the fetchOrders function to avoid recreation on each render
  const fetchOrders = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      console.log("Fetching restaurant orders...");
      // Try to fetch real orders from the API
      const response = await restaurantAPI.getOrders();
      console.log("Orders API response:", response?.data);
      
      // Check for successful response
      if (response?.data?.success) {
        const ordersData = response.data.data || [];
        console.log("Successfully fetched restaurant orders:", ordersData);

        // Map populated deliveryRiderId into assignedRider for consistency
        const mappedOrders = ordersData.map(order => ({
          ...order,
          assignedRider: order.deliveryRiderId || null
        }));
        // Set orders data
        setOrders(mappedOrders);
        
        // Clear any existing error since the request was successful
        setError(null);
      } else {
        // If API response indicates failure but returns a message
        if (response?.data?.message) {
          console.error("API Error Message:", response.data.message);

          // If there's an authentication issue, show a more specific error
          if (
            response.data.message.includes("authenticate") ||
            response.data.message.includes("token")
          ) {
            setError("Authentication error. Please log in again to continue.");
          } else {
            setError(response.data.message);
          }
        } else {
          setError("Failed to fetch orders. Please try again.");
        }

        // Set empty orders to avoid showing stale data
        setOrders([]);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      
      // Handle specific error types
      if (!navigator.onLine) {
        setError("You appear to be offline. Please check your internet connection.");
      } else if (err.message?.includes("Network Error")) {
        setError("Network error. Please check your internet connection.");
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Authentication error. Please log in again to continue.");
      } else if (err.response?.status === 404) {
        setError("Orders endpoint not found. The API may be misconfigured.");
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later or contact support.");
        console.error("Server error response:", err.response?.data);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to fetch orders. Please try again.");
      }

      // Set empty orders to avoid showing stale data
      setOrders([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh orders every 2 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchOrders(false); // Don't show full loading state on auto-refresh
    }, 120000); // 2 minutes

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  const openDetailsDialog = (order) => {
    setSelectedOrder(order);
    setIsDetailsDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder?._id || !selectedStatusOption) {
      setError("Missing information for status update.");
      return;
    }

    setIsUpdatingStatus(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await restaurantAPI.updateOrderStatus(
        selectedOrder._id,
        selectedStatusOption
      );
      if (response?.data?.success) {
        setSuccess(`Order status updated to ${selectedStatusOption} successfully!`);

        // Update the order in the local state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === selectedOrder._id
              ? {
                  ...order,
                  status: selectedStatusOption,
                  statusUpdates: [
                    ...(order.statusUpdates || []),
                    { status: selectedStatusOption, timestamp: new Date() },
                  ],
                }
              : order
          )
        );

        // Close dialog after successful update
        setIsDetailsDialogOpen(false);
      } else {
        setError(response?.data?.message || "Failed to update order status");
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to update order status. Please try again."
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      return format(new Date(dateString), "PPP p");
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Invalid date";
    }
  };

  // Helper function to format currency (reuse from admin/user)
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Reusable Badge variant logic (reuse from admin/user)
  const getStatusBadgeVariant = (status) => {
    if (!status) return 'default';
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'DELIVERED': return 'success';
      case 'PREPARING': case 'READY': case 'OUT_FOR_DELIVERY': case 'CONFIRMED': return 'info'; // Combined processing states
      case 'PENDING': return 'warning';
      case 'CANCELLED': return 'danger';
      default: return 'default';
    }
  };

  // Fetch available riders
  const fetchAvailableRiders = useCallback(async () => {
    setIsLoadingRiders(true);
    try {
      const response = await restaurantAPI.getAvailableRiders();
      if (response?.data?.success) {
        setAvailableRiders(response.data.data || []);
      } else {
        setError(response?.data?.message || "Failed to fetch available riders");
      }
    } catch (err) {
      console.error("Error fetching available riders:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to fetch available riders. Please try again."
      );
    } finally {
      setIsLoadingRiders(false);
    }
  }, []);

  // Open rider assignment dialog
  const openAssignRiderDialog = (order) => {
    setSelectedOrder(order);
    setSelectedRiderId("");
    fetchAvailableRiders();
    setIsAssignRiderDialogOpen(true);
  };

  // Handle rider assignment
  const handleAssignRider = async () => {
    if (!selectedOrder?._id || !selectedRiderId) {
      setError("Missing information for rider assignment.");
      return;
    }

    setIsAssigningRider(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await restaurantAPI.assignRider(
        selectedOrder._id,
        selectedRiderId
      );
      if (response?.data?.success) {
        setSuccess(`Rider assigned to order successfully!`);

        // Determine rider object for assignment
        const riderObj = availableRiders.find(r => r._id === selectedRiderId);

        // Update the order in the local state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === selectedOrder._id
              ? {
                  ...order,
                  // Assign full rider object for UI display
                  assignedRider: riderObj || selectedRiderId,
                  status: response.data.data.status || order.status,
                }
              : order
          )
        );

        // Close dialog after successful update
        setIsAssignRiderDialogOpen(false);
        
        // Show success toast notification
        addToast(`Rider has been successfully assigned to order #${selectedOrder.orderNumber || selectedOrder._id.substring(0, 6)}`, {
          type: 'success',
          duration: 5000
        });
        
        // Refresh orders after successful assignment
        fetchOrders();
      } else {
        setError(response?.data?.message || "Failed to assign rider");
      }
    } catch (err) {
      console.error("Error assigning rider:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to assign rider. Please try again."
      );
    } finally {
      setIsAssigningRider(false);
    }
  };

  // Fetch order status history
  const fetchOrderStatusHistory = async (orderId) => {
    setIsLoadingStatusHistory(true);
    try {
      const response = await restaurantAPI.getOrderStatusHistory(orderId);
      if (response?.data?.success) {
        setStatusHistory(response.data.data.statusHistory || []);
      } else {
        setError(response?.data?.message || "Failed to fetch status history");
      }
    } catch (err) {
      console.error("Error fetching status history:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to fetch status history. Please try again."
      );
    } finally {
      setIsLoadingStatusHistory(false);
    }
  };

  // Open status history dialog
  const openStatusHistoryDialog = (order) => {
    setSelectedOrder(order);
    fetchOrderStatusHistory(order._id);
    setIsStatusHistoryDialogOpen(true);
  };

  const renderActionButton = (order) => {
    if (!order || !order.status) return null;

    return (
      <div className="flex space-x-2">
        {/* Add a button for rider assignment for READY or PREPARING orders */}
        {(order.status === 'READY' || order.status === 'PREPARING') && !order.assignedRider && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openAssignRiderDialog(order)}
            disabled={isUpdatingStatus}
            className="flex items-center text-green-600 border-green-600 hover:bg-green-50"
          >
            <FaMotorcycle className="mr-1" />
            Assign Rider
          </Button>
        )}
        
        {/* Show assigned rider badge if rider is assigned */}
        {order.assignedRider && (
          <Badge 
            variant="outline" 
            className="flex items-center px-2 py-1 text-xs text-blue-600 border-blue-600"
          >
            <FaMotorcycle className="mr-1" />
            Rider Assigned
          </Badge>
        )}
        
        {/* Add a button to view status history */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => openStatusHistoryDialog(order)}
          className="flex items-center"
        >
          <FaHistory className="mr-1" />
          History
        </Button>
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
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Order Management
        </h1>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center space-x-1"
            onClick={() => fetchOrders(false)}
            disabled={isRefreshing}
          >
            <FaSync className={isRefreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          variant="success"
          className="mb-4"
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {orders.length === 0 ? (
        <div className="p-8 text-center bg-white border rounded-md shadow-sm dark:bg-gray-800">
          <div className="flex flex-col items-center justify-center mb-4">
            <FaShoppingCart className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No orders found.</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Orders will appear here when customers place them.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => fetchOrders(true)}
          >
            <FaSync className="mr-2" /> Refresh
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <Card key={order._id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div>
                  <h3 className="font-semibold">
                    {order.orderNumber ||
                      `Order #${order._id?.substring(0, 6)}`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <Badge
                  className={`${
                    STATUS_COLORS[order.status] || "bg-gray-100"
                  } px-2 py-1`}
                >
                  {STATUS_ICONS[order.status] || null}
                  {order.status || "UNKNOWN"}
                </Badge>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <FaUser className="mr-2 text-gray-400" />
                    <span>{order.userId?.fullName || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <FaDollarSign className="mr-2 text-gray-400" />
                    <span>${order.grandTotal?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-2 text-gray-400" />
                    <span>{order.items?.length || 0} items</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDetailsDialog(order)}
                >
                  <FaEye className="mr-1" /> Details
                </Button>
                {renderActionButton(order)}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Order Details Dialog - Enhanced with status update dropdown */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder ? (
            <>
              <DialogHeader>
                <DialogTitle>Order Details #{selectedOrder.orderNumber}</DialogTitle>
                <DialogDescription>
                  Placed on: {formatDate(selectedOrder.createdAt)} - Status: 
                  <Badge variant={getStatusBadgeVariant(selectedOrder.status)} className="ml-1">{selectedOrder.status}</Badge>
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="details" className="mt-4">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="details">Order Details</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="py-4 space-y-4">
                  {/* Customer Information */}
                  <div className="p-3 rounded-md bg-gray-50">
                    <h4 className="mb-2 text-sm font-semibold text-yumrun-primary">Customer Information</h4>
                    <p className="font-medium">{selectedOrder.userId?.fullName || selectedOrder.deliveryAddress?.fullName || "N/A"}</p>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                      <div>
                        <p className="text-gray-500">Email:</p>
                        <p>{selectedOrder.userId?.email || selectedOrder.deliveryAddress?.email || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phone:</p>
                        <p>{selectedOrder.userId?.phone || selectedOrder.deliveryAddress?.phone || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Delivery Address */}
                  <div className="p-3 rounded-md bg-gray-50">
                    <h4 className="mb-2 text-sm font-semibold text-yumrun-primary">Delivery Address</h4>
                    {typeof selectedOrder.deliveryAddress === "string" ? (
                      <p>{selectedOrder.deliveryAddress}</p>
                    ) : (
                      <div>
                        <p className="font-medium">{selectedOrder.deliveryAddress?.fullName || ""}</p>
                        <p>{selectedOrder.deliveryAddress?.address || selectedOrder.deliveryAddress?.street || ""}</p>
                        <p>{selectedOrder.deliveryAddress?.city || ""} {selectedOrder.deliveryAddress?.state || ""} {selectedOrder.deliveryAddress?.zipCode || ""}</p>
                        {selectedOrder.deliveryAddress?.phone && <p className="mt-1">Phone: {selectedOrder.deliveryAddress.phone}</p>}
                        {selectedOrder.deliveryAddress?.additionalInfo && (
                          <p className="mt-1 text-sm text-gray-500">Additional info: {selectedOrder.deliveryAddress.additionalInfo}</p>
                        )}
                      </div>
                    )}
                    {selectedOrder.specialInstructions && (
                      <div className="pt-2 mt-2 border-t border-gray-200">
                        <p className="text-sm font-medium">Special Instructions:</p>
                        <p className="text-sm text-gray-600">{selectedOrder.specialInstructions}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Items */}
                  <div className="p-3 rounded-md bg-gray-50">
                    <h4 className="mb-2 text-sm font-semibold text-yumrun-primary">Order Items</h4>
                    <ul className="divide-y divide-gray-200">
                      {selectedOrder.items?.map((item, index) => (
                        <li key={index} className="py-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{item.quantity}x {item.name}</span>
                            <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                          
                          {/* Customizations */}
                          {item.customization && (
                            <div className="pl-4 mt-1 text-sm text-gray-600">
                              {/* Added ingredients */}
                              {item.customization.addedIngredients && item.customization.addedIngredients.length > 0 && (
                                <div className="mt-1">
                                  <span className="text-gray-500">Add-ons:</span>
                                  <ul className="list-disc pl-5 space-y-0.5">
                                    {item.customization.addedIngredients.map((ingredient, idx) => (
                                      <li key={idx} className="text-xs">
                                        {ingredient.name} (+{formatCurrency(ingredient.price)})
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {/* Serving size */}
                              {item.customization.servingSize && (
                                <div className="mt-1 text-xs">
                                  <span className="text-gray-500">Size:</span> {item.customization.servingSize}
                                </div>
                              )}
                              
                              {/* Removed ingredients */}
                              {item.customization.removedIngredients && item.customization.removedIngredients.length > 0 && (
                                <div className="mt-1">
                                  <span className="text-gray-500">Remove:</span> {item.customization.removedIngredients.join(', ')}
                                </div>
                              )}
                              
                              {/* Special instructions */}
                              {item.customization.specialInstructions && (
                                <div className="mt-1 text-xs">
                                  <span className="text-gray-500">Instructions:</span> {item.customization.specialInstructions}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Legacy customization format */}
                          {item.customizationDetails && (
                            <div className="pl-4 mt-1 text-sm text-gray-600">
                              {item.customizationDetails.servingSize && (
                                <div className="text-xs">
                                  <span className="text-gray-500">Size:</span> {item.customizationDetails.servingSize}
                                </div>
                              )}
                              {item.customizationDetails.cookingMethod && (
                                <div className="text-xs">
                                  <span className="text-gray-500">Method:</span> {item.customizationDetails.cookingMethod}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Selected addons in legacy format */}
                          {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                            <div className="pl-4 mt-1 text-sm text-gray-600">
                              <span className="text-gray-500">Add-ons:</span>
                              <ul className="list-disc pl-5 space-y-0.5">
                                {item.selectedAddOns.map((addOn, idx) => (
                                  <li key={idx} className="text-xs">
                                    {addOn.name} (+{formatCurrency(addOn.price)})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Nutritional Information (if available) */}
                  {selectedOrder.totalNutritionalInfo && (
                    Object.values(selectedOrder.totalNutritionalInfo).some(val => val > 0) && (
                      <div className="p-3 rounded-md bg-gray-50">
                        <h4 className="mb-2 text-sm font-semibold text-yumrun-primary">Nutritional Information</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
                          <div className="p-1 text-center bg-white rounded shadow-sm">
                            <p className="text-xs text-gray-500">Calories</p>
                            <p className="font-medium">{selectedOrder.totalNutritionalInfo.calories || 0}</p>
                          </div>
                          <div className="p-1 text-center bg-white rounded shadow-sm">
                            <p className="text-xs text-gray-500">Protein</p>
                            <p className="font-medium">{selectedOrder.totalNutritionalInfo.protein || 0}g</p>
                          </div>
                          <div className="p-1 text-center bg-white rounded shadow-sm">
                            <p className="text-xs text-gray-500">Carbs</p>
                            <p className="font-medium">{selectedOrder.totalNutritionalInfo.carbs || 0}g</p>
                          </div>
                          <div className="p-1 text-center bg-white rounded shadow-sm">
                            <p className="text-xs text-gray-500">Fat</p>
                            <p className="font-medium">{selectedOrder.totalNutritionalInfo.fat || 0}g</p>
                          </div>
                          <div className="p-1 text-center bg-white rounded shadow-sm">
                            <p className="text-xs text-gray-500">Sodium</p>
                            <p className="font-medium">{selectedOrder.totalNutritionalInfo.sodium || 0}mg</p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                  
                  {/* Payment Details */}
                  <div className="p-3 rounded-md bg-gray-50">
                    <h4 className="mb-2 text-sm font-semibold text-yumrun-primary">Payment Details</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(selectedOrder.totalPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee:</span>
                        <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>{formatCurrency(selectedOrder.tax)}</span>
                      </div>
                      {selectedOrder.tip > 0 && (
                        <div className="flex justify-between">
                          <span>Tip:</span>
                          <span>{formatCurrency(selectedOrder.tip)}</span>
                        </div>
                      )}
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-{formatCurrency(selectedOrder.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 mt-1 font-bold border-t">
                        <span>Total:</span>
                        <span>{formatCurrency(selectedOrder.grandTotal)}</span>
                      </div>
                      <div className="flex justify-between pt-1 mt-2 text-sm border-t">
                        <span className="text-gray-500">Payment Method:</span>
                        <span>{selectedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Payment Status:</span>
                        <Badge variant={selectedOrder.paymentStatus === "COMPLETED" ? "success" : "warning"}>
                          {selectedOrder.paymentStatus}
                        </Badge>
                      </div>
                      {selectedOrder.paymentDetails && (
                        <div className="pt-1 mt-2 text-xs text-gray-500 border-t">
                          <p>Provider: {selectedOrder.paymentDetails.provider || "N/A"}</p>
                          <p>Session ID: {selectedOrder.paymentDetails.sessionId || "N/A"}</p>
                          <p>Initiated: {selectedOrder.paymentDetails.initiatedAt ? formatDate(selectedOrder.paymentDetails.initiatedAt) : "N/A"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="actions" className="py-4 space-y-4">
                  <div className="p-4 rounded-md bg-gray-50">
                    <h4 className="mb-3 text-sm font-semibold text-yumrun-primary">Update Status</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-1 text-sm font-medium">
                          Select Status
                        </label>
                        <select
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-800 dark:border-gray-700"
                          value={selectedStatusOption}
                          onChange={(e) => setSelectedStatusOption(e.target.value)}
                        >
                          <option value="" disabled>Select a status</option>
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PREPARING">PREPARING</option>
                          <option value="READY">READY</option>
                          <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>
                      
                      <Button
                        className="w-full"
                        disabled={!selectedStatusOption || isUpdatingStatus}
                        onClick={handleStatusUpdate}
                      >
                        {isUpdatingStatus ? "Updating..." : "Update Status"}
                      </Button>
                    </div>
                  </div>
                  
                  {((selectedOrder.status === 'READY' || selectedOrder.status === 'PREPARING') && 
                   !selectedOrder.assignedRider) && (
                    <div className="p-4 rounded-md bg-gray-50">
                      <h4 className="mb-3 text-sm font-semibold text-yumrun-primary">Assign Rider</h4>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => {
                          setIsDetailsDialogOpen(false);
                          openAssignRiderDialog(selectedOrder);
                        }}
                      >
                        <FaMotorcycle className="mr-2" />
                        Assign a Delivery Rider
                      </Button>
                    </div>
                  )}
                  
                  {selectedOrder.assignedRider && (
                    <div className="p-4 rounded-md bg-gray-50">
                      <h4 className="mb-2 text-sm font-semibold text-yumrun-primary">Assigned Rider</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {selectedOrder.assignedRider.fullName || 
                             `${selectedOrder.assignedRider.firstName} ${selectedOrder.assignedRider.lastName}` || 
                             "Unknown"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {selectedOrder.assignedRider.phone || "No phone number"}
                          </p>
                        </div>
                        {selectedOrder.assignedRider.deliveryRiderDetails?.vehicleType && (
                          <Badge variant="outline" className="ml-2 capitalize">
                            {selectedOrder.assignedRider.deliveryRiderDetails.vehicleType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="history" className="py-4">
                  <div className="p-4 rounded-md bg-gray-50">
                    <h4 className="mb-2 text-sm font-semibold text-yumrun-primary">Order Status History</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mb-3"
                      onClick={() => fetchOrderStatusHistory(selectedOrder._id)}
                    >
                      <FaSync className={isLoadingStatusHistory ? "animate-spin mr-2" : "mr-2"} />
                      Refresh History
                    </Button>
                    
                    {isLoadingStatusHistory ? (
                      <div className="py-4 text-center">
                        <div className="w-6 h-6 mx-auto border-t-2 border-b-2 rounded-full animate-spin border-yumrun-orange"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading history...</p>
                      </div>
                    ) : statusHistory && statusHistory.length > 0 ? (
                      <ul className="space-y-2">
                        {statusHistory.slice().reverse().map((update, index) => (
                          <li key={index} className="flex items-center justify-between p-2 text-xs bg-white border rounded">
                            <Badge variant={getStatusBadgeVariant(update.status)} size="sm">{update.status}</Badge>
                            <span className="text-gray-500">{formatDate(update.timestamp)}</span>
                            {update.updatedBy && (
                              <span className="text-gray-500">
                                by {update.updatedBy.fullName || update.updatedBy.name || 'System'}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No status history available</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          ) : (
            <p>Loading order details...</p> // Fallback if selectedOrder is null
          )}
        </DialogContent>
      </Dialog>

      {/* New Dialog for Rider Assignment */}
      <Dialog
        open={isAssignRiderDialogOpen}
        onOpenChange={setIsAssignRiderDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Delivery Rider</DialogTitle>
            <DialogDescription>
              Select a rider to assign to this order. The order status will automatically change to OUT_FOR_DELIVERY when assigned.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              <strong>Order:</strong>{" "}
              {selectedOrder?.orderNumber ||
                `Order #${selectedOrder?._id?.substring(0, 6)}`}
            </p>
            <p className="mt-2">
              <strong>Current Status:</strong>{" "}
              <Badge
                variant={getStatusBadgeVariant(selectedOrder?.status)}
              >
                {selectedOrder?.status || "UNKNOWN"}
              </Badge>
            </p>

            <div className="mt-4">
              <label className="block mb-1 text-sm font-medium">
                Select Rider
              </label>
              {isLoadingRiders ? (
                <div className="py-4 text-center">
                  <div className="w-6 h-6 mx-auto border-t-2 border-b-2 rounded-full animate-spin border-yumrun-orange"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading riders...</p>
                </div>
              ) : availableRiders.length > 0 ? (
                <>
                  <Select 
                    onValueChange={setSelectedRiderId} 
                    value={selectedRiderId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a rider" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRiders.map((rider) => (
                        <SelectItem key={rider._id} value={rider._id}>
                          {rider.fullName || `${rider.firstName} ${rider.lastName}`}
                          {rider.deliveryRiderDetails?.ratings?.average && 
                            ` (★${rider.deliveryRiderDetails.ratings.average.toFixed(1)})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Show selected rider details if any */}
                  {selectedRiderId && (
                    <div className="p-3 mt-3 border rounded-md bg-gray-50">
                      <h4 className="mb-2 text-sm font-semibold">Selected Rider</h4>
                      {(() => {
                        const selectedRider = availableRiders.find(r => r._id === selectedRiderId);
                        if (!selectedRider) return null;
                        
                        return (
                          <div className="text-sm">
                            <p className="font-medium">
                              {selectedRider.fullName || `${selectedRider.firstName} ${selectedRider.lastName}`}
                            </p>
                            {selectedRider.phone && (
                              <p className="text-gray-500">📱 {selectedRider.phone}</p>
                            )}
                            {selectedRider.deliveryRiderDetails?.vehicleType && (
                              <p className="text-gray-500">
                                🛵 {selectedRider.deliveryRiderDetails.vehicleType.charAt(0).toUpperCase() + 
                                    selectedRider.deliveryRiderDetails.vehicleType.slice(1)}
                              </p>
                            )}
                            {selectedRider.deliveryRiderDetails?.ratings?.average && (
                              <p className="text-gray-500">
                                ⭐ Rating: {selectedRider.deliveryRiderDetails.ratings.average.toFixed(1)}/5 
                                ({selectedRider.deliveryRiderDetails.ratings.count} reviews)
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 text-center border border-yellow-200 rounded-md bg-yellow-50">
                  <p className="text-sm text-yellow-700">No available riders found</p>
                  <p className="mt-1 text-xs text-yellow-600">Please try again later or contact rider support.</p>
                </div>
              )}
            </div>
            
            {error && (
              <div className="p-3 mt-4 text-sm text-red-600 border border-red-200 rounded-md bg-red-50">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 mt-4 text-sm text-green-600 border border-green-200 rounded-md bg-green-50">
                {success}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignRiderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssignRider} 
              disabled={isAssigningRider || !selectedRiderId}
              className={!selectedRiderId ? "opacity-50" : "bg-green-600 hover:bg-green-700"}
            >
              {isAssigningRider ? "Assigning..." : "Assign Rider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Dialog for Status History */}
      <Dialog
        open={isStatusHistoryDialogOpen}
        onOpenChange={setIsStatusHistoryDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order History</DialogTitle>
            <DialogDescription>
              View the complete status history for this order.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              <strong>Order:</strong>{" "}
              {selectedOrder?.orderNumber ||
                `Order #${selectedOrder?._id?.substring(0, 6)}`}
            </p>
            
            <div className="mt-4">
              {isLoadingStatusHistory ? (
                <div className="py-4 text-center">
                  <div className="w-6 h-6 mx-auto border-t-2 border-b-2 rounded-full animate-spin border-yumrun-orange"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading history...</p>
                </div>
              ) : statusHistory && statusHistory.length > 0 ? (
                <ul className="space-y-2">
                  {statusHistory.slice().reverse().map((update, index) => (
                    <li key={index} className="flex items-center justify-between p-2 text-xs bg-white border rounded">
                      <Badge variant={getStatusBadgeVariant(update.status)} size="sm">{update.status}</Badge>
                      <span className="text-gray-500">{formatDate(update.timestamp)}</span>
                      {update.updatedBy && (
                        <span className="text-gray-500">
                          by {update.updatedBy.fullName || update.updatedBy.name || 'System'}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No status history available</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsStatusHistoryDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Main component with error boundary
const RestaurantOrders = () => {
  return (
    <ErrorBoundary 
      title="Orders Error" 
      errorMessage="We encountered an issue loading your orders. Please try again or contact support if the problem persists."
      onRetry={() => window.location.reload()}
    >
      <RestaurantOrdersContent />
    </ErrorBoundary>
  );
};

export default RestaurantOrders;


