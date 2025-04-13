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
  Separator,
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
} from "react-icons/fa";
import { format } from "date-fns";
import ErrorBoundary from "../../components/shared/ErrorBoundary";

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

// Status flow definition - what status can follow each current status
const STATUS_FLOW = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
  // Terminal states
  DELIVERED: null,
  CANCELLED: null,
};

const RestaurantOrdersContent = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isConfirmStatusDialogOpen, setIsConfirmStatusDialogOpen] =
    useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState({
    orderId: null,
    newStatus: null,
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

        // Set orders data, empty array is fine if no orders found
        setOrders(ordersData);
        
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

  const initiateStatusUpdate = (orderId, newStatus) => {
    // Find the order to update
    const orderToUpdate = orders.find((order) => order._id === orderId);
    if (!orderToUpdate) {
      setError("Order not found.");
      return;
    }

    setPendingStatusUpdate({ orderId, newStatus });
    setSelectedOrder(orderToUpdate);
    setIsConfirmStatusDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    const { orderId, newStatus } = pendingStatusUpdate;
    if (!orderId || !newStatus) {
      setError("Missing information for status update.");
      return;
    }

    setIsUpdatingStatus(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await restaurantAPI.updateOrderStatus(
        orderId,
        newStatus
      );
      if (response?.data?.success) {
        setSuccess(`Order status updated to ${newStatus} successfully!`);

        // Update the order in the local state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId
              ? {
                  ...order,
                  status: newStatus,
                  statusUpdates: [
                    ...(order.statusUpdates || []),
                    { status: newStatus, timestamp: new Date() },
                  ],
                }
              : order
          )
        );

        // Close dialog after successful update
        setIsConfirmStatusDialogOpen(false);
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

  const getNextStatus = (currentStatus) => {
    return STATUS_FLOW[currentStatus] || null;
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

  const renderActionButton = (order) => {
    if (!order || !order.status) return null;

    const nextStatus = getNextStatus(order.status);

    if (!nextStatus) {
      // Terminal state, just show the badge
      return (
        <Badge
          className={`${
            STATUS_COLORS[order.status] || "bg-gray-100"
          } px-2 py-1`}
        >
          {STATUS_ICONS[order.status] || null}
          {order.status}
        </Badge>
      );
    }

    return (
      <Button
        size="sm"
        onClick={() => initiateStatusUpdate(order._id, nextStatus)}
        disabled={isUpdatingStatus}
      >
        {isUpdatingStatus && pendingStatusUpdate.orderId === order._id
          ? "Updating..."
          : `Mark as ${nextStatus}`}
      </Button>
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

      {/* Order Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Order Details -{" "}
              {selectedOrder?.orderNumber ||
                `Order #${selectedOrder?._id?.substring(0, 6)}`}
            </DialogTitle>
            <DialogDescription>Detailed view of the order.</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-1 font-semibold">Customer Information</h4>
                  <p>
                    <strong>Name:</strong>{" "}
                    {selectedOrder.userId?.fullName || "N/A"}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {selectedOrder.userId?.email || "N/A"}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {selectedOrder.userId?.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold">Delivery Address</h4>
                  <p>{selectedOrder.deliveryAddress?.street || "N/A"}</p>
                  {selectedOrder.deliveryAddress?.city && (
                    <p>
                      {selectedOrder.deliveryAddress.city}
                      {selectedOrder.deliveryAddress.state
                        ? `, ${selectedOrder.deliveryAddress.state}`
                        : ""}
                      {selectedOrder.deliveryAddress.zipCode
                        ? ` ${selectedOrder.deliveryAddress.zipCode}`
                        : ""}
                    </p>
                  )}
                  <p>{selectedOrder.deliveryAddress?.country || ""}</p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Order Items</h4>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <div className="min-w-full">
                        <div className="grid grid-cols-4 gap-4 p-3 font-semibold text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300">
                          <div>Item</div>
                          <div className="text-center">Quantity</div>
                          <div className="text-center">Price</div>
                          <div className="text-right">Subtotal</div>
                        </div>
                        <Separator />
                        {selectedOrder.items?.length > 0 ? (
                          selectedOrder.items.map((item, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-4 gap-4 p-3 text-sm border-b last:border-0"
                            >
                              <div>{item.name || "Unnamed item"}</div>
                              <div className="text-center">
                                {item.quantity || 0}
                              </div>
                              <div className="text-center">
                                ${item.price?.toFixed(2) || "0.00"}
                              </div>
                              <div className="text-right">
                                $
                                {(
                                  (item.price || 0) * (item.quantity || 0)
                                ).toFixed(2)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-gray-500">
                            No items found
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-1 font-semibold">Payment Details</h4>
                  <p>
                    <strong>Method:</strong>{" "}
                    {selectedOrder.paymentMethod || "N/A"}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {selectedOrder.paymentStatus || "N/A"}
                  </p>
                  <p>
                    <strong>Subtotal:</strong> $
                    {selectedOrder.totalPrice?.toFixed(2) || "0.00"}
                  </p>
                  <p>
                    <strong>Delivery Fee:</strong> $
                    {selectedOrder.deliveryFee?.toFixed(2) || "0.00"}
                  </p>
                  <p>
                    <strong>Tax:</strong> $
                    {selectedOrder.tax?.toFixed(2) || "0.00"}
                  </p>
                  <p>
                    <strong>Tip:</strong> $
                    {selectedOrder.tip?.toFixed(2) || "0.00"}
                  </p>
                  <p className="font-bold">
                    <strong>Grand Total:</strong> $
                    {selectedOrder.grandTotal?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold">Status History</h4>
                  {selectedOrder.statusUpdates?.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {selectedOrder.statusUpdates.map((update, index) => (
                        <li key={index}>
                          <Badge
                            className={`${
                              STATUS_COLORS[update.status] || "bg-gray-100"
                            } mr-2`}
                          >
                            {update.status}
                          </Badge>
                          {formatDate(update.timestamp)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No status updates recorded
                    </p>
                  )}
                </div>
              </div>
              {selectedOrder.specialInstructions && (
                <div>
                  <h4 className="mb-1 font-semibold">Special Instructions</h4>
                  <p className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
                    {selectedOrder.specialInstructions}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Status Update Dialog */}
      <Dialog
        open={isConfirmStatusDialogOpen}
        onOpenChange={setIsConfirmStatusDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Status Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to update the status of this order?
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
                className={`${
                  STATUS_COLORS[selectedOrder?.status] || "bg-gray-100"
                }`}
              >
                {selectedOrder?.status || "UNKNOWN"}
              </Badge>
            </p>
            <p className="mt-2">
              <strong>New Status:</strong>{" "}
              <Badge
                className={`${
                  STATUS_COLORS[pendingStatusUpdate.newStatus] || "bg-gray-100"
                }`}
              >
                {pendingStatusUpdate.newStatus || "UNKNOWN"}
              </Badge>
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? "Updating..." : "Confirm Update"}
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
