import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Badge, Alert, Spinner } from './ui';
import { 
  FiMapPin, 
  FiUser, 
  FiClock, 
  FiPhoneCall,
  FiNavigation,
  FiCheck
} from 'react-icons/fi';

const DeliveryTracking = ({ 
  orderId, 
  deliveryStatus = 'pending',
  estimatedDeliveryTime,
  deliveryAgent = null,
  customerLocation = null,
  restaurantLocation = null,
  currentLocation = null
}) => {
  const [status, setStatus] = useState(deliveryStatus);
  const [agent, setAgent] = useState(deliveryAgent);
  const [estimatedTime, setEstimatedTime] = useState(estimatedDeliveryTime);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Simulate tracking updates - this would be replaced with real-time updates
  useEffect(() => {
    const simulateTracking = () => {
      // Only simulate updates for active deliveries
      if (['assigned', 'picked_up', 'on_the_way'].includes(status)) {
        setIsLoading(true);
        
        // Simulate API call delay
        setTimeout(() => {
          // Update agent information if none exists yet
          if (!agent && status === 'assigned') {
            setAgent({
              name: 'Rahul Singh',
              phone: '9804567890',
              rating: 4.8,
              photo: '/images/delivery-agent.jpg',
              vehicleType: 'Motorcycle',
              vehicleNumber: 'BA 75 PA 2021'
            });
          }
          
          // Simulate status changes based on current status
          if (status === 'assigned') {
            setStatus('picked_up');
            setEstimatedTime(prevTime => Math.max(prevTime - 5, 10));
          } else if (status === 'picked_up') {
            setStatus('on_the_way');
            setEstimatedTime(prevTime => Math.max(prevTime - 3, 5));
          } else if (status === 'on_the_way' && estimatedTime <= 5) {
            setStatus('arrived');
            setEstimatedTime(0);
          } else {
            // Just update the estimated time
            setEstimatedTime(prevTime => Math.max(prevTime - 2, 0));
          }
          
          setIsLoading(false);
        }, 2000);
      }
    };
    
    // Run simulation immediately for demo purposes
    simulateTracking();
    
    // Set up interval for updates every 30 seconds (for demo purposes)
    const intervalId = setInterval(simulateTracking, 30000);
    
    return () => clearInterval(intervalId);
  }, [status, agent, estimatedTime]);
  
  // Format the status for display
  const getStatusBadge = () => {
    let color = 'secondary';
    let label = 'Unknown';
    let icon = <FiClock className="mr-1" />;
    
    switch (status) {
      case 'pending':
        color = 'warning';
        label = 'Finding Driver';
        break;
      case 'assigned':
        color = 'info';
        label = 'Driver Assigned';
        icon = <FiUser className="mr-1" />;
        break;
      case 'picked_up':
        color = 'primary';
        label = 'Picked Up';
        icon = <FiNavigation className="mr-1" />;
        break;
      case 'on_the_way':
        color = 'info';
        label = 'On The Way';
        icon = <FiNavigation className="mr-1" />;
        break;
      case 'arrived':
        color = 'success';
        label = 'Arrived';
        icon = <FiMapPin className="mr-1" />;
        break;
      case 'delivered':
        color = 'success';
        label = 'Delivered';
        icon = <FiCheck className="mr-1" />;
        break;
      case 'cancelled':
        color = 'error';
        label = 'Cancelled';
        break;
      default:
        break;
    }
    
    return (
      <Badge variant={color} className="text-sm">
        {icon} {label}
      </Badge>
    );
  };
  
  // Generate a message based on current status
  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return 'We are finding a delivery partner for your order.';
      case 'assigned':
        return `${agent?.name} has been assigned to your delivery.`;
      case 'picked_up':
        return `${agent?.name} has picked up your order from the restaurant.`;
      case 'on_the_way':
        return `${agent?.name} is on the way to your location.`;
      case 'arrived':
        return `${agent?.name} has arrived at your location.`;
      case 'delivered':
        return 'Your order has been delivered. Enjoy your meal!';
      case 'cancelled':
        return 'Your delivery has been cancelled.';
      default:
        return 'Tracking your order...';
    }
  };
  
  // Placeholder for the map component
  // In a real implementation, this would use a mapping library like Google Maps or Mapbox
  const DeliveryMap = () => {
    return (
      <div className="relative h-48 md:h-64 lg:h-80 bg-gray-200 rounded-md overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500 text-sm">
            Map view would be displayed here with real-time tracking.
          </p>
        </div>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 bg-opacity-70 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-100">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <h2 className="text-lg font-medium">Delivery Tracking</h2>
            <p className="text-sm text-gray-500">Order #{orderId.substring(0, 8)}</p>
          </div>
          {getStatusBadge()}
        </div>
      </div>
      
      <div className="p-4">
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}
        
        <div className="mb-4">
          <DeliveryMap />
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm font-medium">{getStatusMessage()}</p>
            {estimatedTime > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Estimated delivery in {estimatedTime} minutes
              </p>
            )}
          </div>
          
          {agent && ['assigned', 'picked_up', 'on_the_way', 'arrived'].includes(status) && (
            <a 
              href={`tel:${agent.phone}`}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-yumrun-primary text-white hover:bg-yumrun-secondary transition-colors"
            >
              <FiPhoneCall className="mr-2" />
              Call Driver
            </a>
          )}
        </div>
        
        {agent && (
          <div className="border-t border-gray-100 pt-4 mt-2">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img 
                  src={agent.photo || '/images/default-avatar.png'} 
                  alt={agent.name} 
                  className="h-12 w-12 rounded-full object-cover"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-500 mr-2">{agent.vehicleType}</span>
                  <span className="text-xs text-gray-500">{agent.vehicleNumber}</span>
                </div>
              </div>
              <div className="ml-auto">
                <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded flex items-center">
                  ★ {agent.rating.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

DeliveryTracking.propTypes = {
  orderId: PropTypes.string.isRequired,
  deliveryStatus: PropTypes.oneOf([
    'pending', 'assigned', 'picked_up', 'on_the_way', 'arrived', 'delivered', 'cancelled'
  ]),
  estimatedDeliveryTime: PropTypes.number,
  deliveryAgent: PropTypes.shape({
    name: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    rating: PropTypes.number,
    photo: PropTypes.string,
    vehicleType: PropTypes.string,
    vehicleNumber: PropTypes.string
  }),
  customerLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    address: PropTypes.string
  }),
  restaurantLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    name: PropTypes.string
  }),
  currentLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  })
};

DeliveryTracking.defaultProps = {
  deliveryStatus: 'pending',
  estimatedDeliveryTime: 30
};

export default DeliveryTracking; 