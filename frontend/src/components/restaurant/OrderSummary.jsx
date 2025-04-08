import { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Card, 
  Badge, 
  Button, 
  Alert, 
  Dialog, 
  Textarea,
  Spinner 
} from '../ui';
import { 
  FiClock, 
  FiUser, 
  FiMapPin, 
  FiPhone, 
  FiDollarSign, 
  FiPrinter, 
  FiMessageSquare, 
  FiCheck, 
  FiX 
} from 'react-icons/fi';
import { restaurantAPI } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const OrderStatusBadge = ({ status }) => {
  let color = 'secondary';
  let icon = <FiClock className="mr-1" />;
  
  switch (status) {
    case 'pending':
      color = 'warning';
      break;
    case 'confirmed':
      color = 'primary';
      icon = <FiCheck className="mr-1" />;
      break;
    case 'preparing':
      color = 'info';
      break;
    case 'ready':
      color = 'success';
      break;
    case 'delivered':
      color = 'success';
      icon = <FiCheck className="mr-1" />;
      break;
    case 'cancelled':
      color = 'error';
      icon = <FiX className="mr-1" />;
      break;
    default:
      break;
  }
  
  return (
    <Badge variant={color} className="ml-2">
      {icon} {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

OrderStatusBadge.propTypes = {
  status: PropTypes.string.isRequired
};

const OrderSummary = ({ order, onStatusChange }) => {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'cancelled' && !rejectionReason) {
      setShowRejectDialog(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await restaurantAPI.updateOrderStatus(
        order.id, 
        newStatus, 
        newStatus === 'cancelled' ? rejectionReason : undefined
      );
      
      if (response.data.success) {
        addToast(`Order status updated to ${newStatus}`, { type: 'success' });
        
        // Close dialog if open
        if (showRejectDialog) {
          setShowRejectDialog(false);
          setRejectionReason('');
        }
        
        // Notify parent component
        if (onStatusChange) {
          onStatusChange({
            ...order,
            status: newStatus,
            statusHistory: [
              ...(order.statusHistory || []),
              {
                status: newStatus,
                timestamp: new Date().toISOString(),
                note: newStatus === 'cancelled' ? rejectionReason : undefined
              }
            ]
          });
        }
      } else {
        addToast(response.data.message || 'Failed to update order status', { type: 'error' });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      addToast('Error connecting to server. Please try again.', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const closeRejectDialog = () => {
    setShowRejectDialog(false);
    setRejectionReason('');
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const formatPrice = (price) => {
    return `Rs.${parseFloat(price).toFixed(2)}`;
  };
  
  const calculateTotal = () => {
    const subtotal = order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryFee = order.deliveryFee || 0;
    return subtotal + deliveryFee;
  };

  // Define available actions based on order status
  const getAvailableActions = () => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex space-x-2">
            <Button 
              variant="success" 
              size="sm" 
              onClick={() => handleStatusChange('confirmed')}
              disabled={isLoading}
            >
              <FiCheck className="mr-1" />
              Accept Order
            </Button>
            <Button 
              variant="error" 
              size="sm" 
              onClick={() => handleStatusChange('cancelled')}
              disabled={isLoading}
            >
              <FiX className="mr-1" />
              Reject Order
            </Button>
          </div>
        );
      case 'confirmed':
        return (
          <Button 
            variant="info" 
            size="sm" 
            onClick={() => handleStatusChange('preparing')}
            disabled={isLoading}
          >
            Start Preparing
          </Button>
        );
      case 'preparing':
        return (
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => handleStatusChange('ready')}
            disabled={isLoading}
          >
            Mark as Ready
          </Button>
        );
      case 'ready':
        return (
          <Button 
            variant="outline" 
            size="sm" 
            disabled={true}
          >
            Waiting for Pickup
          </Button>
        );
      case 'delivered':
      case 'cancelled':
        return null;
      default:
        return null;
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-100">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex items-center">
            <h2 className="text-lg font-medium">
              Order #{order.orderNumber || order.id.substring(0, 8)}
            </h2>
            <OrderStatusBadge status={order.status} />
          </div>
          
          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <span className="text-sm text-gray-500">
              {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
            </span>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.print()}
              className="print:hidden"
            >
              <FiPrinter className="mr-1" /> Print
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {isLoading && (
          <Alert variant="info" className="mb-4">
            <div className="flex items-center">
              <Spinner size="sm" className="mr-2" />
              <span>Updating order status...</span>
            </div>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Customer Information</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <FiUser className="text-gray-400 mr-2" />
                <span>{order.customer.name}</span>
              </div>
              
              <div className="flex items-center">
                <FiPhone className="text-gray-400 mr-2" />
                <span>{order.customer.phone}</span>
              </div>
              
              <div className="flex items-start">
                <FiMapPin className="text-gray-400 mr-2 mt-1" />
                <span>{order.deliveryAddress}</span>
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>
                  {formatPrice(order.items.reduce((total, item) => total + (item.price * item.quantity), 0))}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span>{formatPrice(order.deliveryFee || 0)}</span>
              </div>
              
              <div className="flex items-center justify-between font-medium">
                <span>Total</span>
                <span className="text-yumrun-primary">{formatPrice(calculateTotal())}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="flex items-center">
                  <FiDollarSign className="mr-1 text-gray-400" />
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Khalti'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Order Items */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Order Items</h3>
          <div className="bg-gray-50 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {item.options && item.options.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.options.map(option => option.name).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatPrice(item.price)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {formatPrice(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Customer Notes */}
        {order.customerNotes && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Customer Notes</h3>
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <p className="text-sm text-gray-700">{order.customerNotes}</p>
            </div>
          </div>
        )}
        
        {/* Status History */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Order Timeline</h3>
            <div className="border-l-2 border-gray-200 pl-4 ml-2 space-y-3">
              {order.statusHistory.map((status, index) => (
                <div key={index} className="relative">
                  <div className="absolute -left-6 mt-1 w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                  <div className="text-sm">
                    <p className="font-medium">
                      {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {formatDate(status.timestamp)} at {formatTime(status.timestamp)}
                    </p>
                    {status.note && (
                      <p className="text-gray-600 text-xs mt-1 italic">
                        Note: {status.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Order Actions */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
          {getAvailableActions()}
        </div>
      </div>
      
      {/* Rejection Dialog */}
      <Dialog 
        open={showRejectDialog} 
        onOpenChange={closeRejectDialog}
        title="Reject Order"
      >
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Please provide a reason for rejecting this order. This will be visible to the customer.
          </p>
          
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason... (e.g., 'Out of stock', 'Restaurant closed')"
            rows={4}
            className="w-full"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={closeRejectDialog}
          >
            Cancel
          </Button>
          <Button 
            variant="error" 
            onClick={() => handleStatusChange('cancelled')}
            disabled={!rejectionReason.trim() || isLoading}
          >
            <FiMessageSquare className="mr-2" />
            Reject Order
          </Button>
        </div>
      </Dialog>
    </Card>
  );
};

OrderSummary.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.string.isRequired,
    orderNumber: PropTypes.string,
    status: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    customer: PropTypes.shape({
      name: PropTypes.string.isRequired,
      phone: PropTypes.string.isRequired,
    }).isRequired,
    deliveryAddress: PropTypes.string.isRequired,
    deliveryFee: PropTypes.number,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        quantity: PropTypes.number.isRequired,
        options: PropTypes.arrayOf(
          PropTypes.shape({
            name: PropTypes.string.isRequired,
          })
        ),
      })
    ).isRequired,
    paymentMethod: PropTypes.string.isRequired,
    customerNotes: PropTypes.string,
    statusHistory: PropTypes.arrayOf(
      PropTypes.shape({
        status: PropTypes.string.isRequired,
        timestamp: PropTypes.string.isRequired,
        note: PropTypes.string,
      })
    ),
  }).isRequired,
  onStatusChange: PropTypes.func
};

export default OrderSummary; 