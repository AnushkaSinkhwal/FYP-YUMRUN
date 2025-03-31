import { useState } from 'react';
import { Card, Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { FaCheck, FaTimes, FaClock } from 'react-icons/fa';

const RestaurantOrders = () => {
  const [orders] = useState([
    {
      id: 1,
      customer: 'John Doe',
      items: [
        { name: 'Classic Burger', quantity: 2, price: 12.99 },
        { name: 'French Fries', quantity: 1, price: 4.99 }
      ],
      total: 30.97,
      status: 'pending',
      createdAt: new Date().toISOString(),
      deliveryAddress: '123 Main St, City, Country',
      specialInstructions: 'Extra sauce please'
    },
    // Add more orders here
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'preparing':
        return 'info';
      case 'ready':
        return 'success';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock />;
      case 'ready':
        return <FaCheck />;
      case 'cancelled':
        return <FaTimes />;
      default:
        return null;
    }
  };

  const filterOrders = (status) => {
    return orders.filter(order => order.status === status);
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800 dark:text-gray-100">Orders</h1>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="preparing">Preparing</TabsTrigger>
          <TabsTrigger value="ready">Ready</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        {['pending', 'preparing', 'ready', 'delivered', 'cancelled'].map(status => (
          <TabsContent key={status} value={status}>
            <div className="grid gap-4">
              {filterOrders(status).map(order => (
                <Card key={order.id} className="p-4">
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            Order #{order.id}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(order.status)} className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="mb-4 space-y-2">
                        <h4 className="font-medium text-gray-800 dark:text-gray-100">Items:</h4>
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="text-gray-800 dark:text-gray-200">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="flex-1">
                      <h4 className="mb-2 font-medium text-gray-800 dark:text-gray-100">Customer Details:</h4>
                      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{order.customer}</p>

                      <h4 className="mb-2 font-medium text-gray-800 dark:text-gray-100">Delivery Address:</h4>
                      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{order.deliveryAddress}</p>

                      {order.specialInstructions && (
                        <>
                          <h4 className="mb-2 font-medium text-gray-800 dark:text-gray-100">Special Instructions:</h4>
                          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{order.specialInstructions}</p>
                        </>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        {order.status === 'pending' && (
                          <>
                            <Button variant="default" className="flex-1">Accept</Button>
                            <Button variant="outline" className="flex-1">Reject</Button>
                          </>
                        )}
                        {order.status === 'preparing' && (
                          <Button variant="default" className="flex-1">Mark as Ready</Button>
                        )}
                        {order.status === 'ready' && (
                          <Button variant="default" className="flex-1">Mark as Delivered</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {filterOrders(status).length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">No {status} orders</p>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default RestaurantOrders; 