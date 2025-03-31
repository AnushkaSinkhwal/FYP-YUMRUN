import { FaUtensils, FaShoppingCart, FaChartLine, FaStore } from 'react-icons/fa';
import Dashboard from '../../components/shared/Dashboard';

const RestaurantDashboard = () => {
  // Restaurant-specific stats
  const stats = [
    {
      title: "Total Orders",
      count: 150,
      icon: <FaShoppingCart size={24} />,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300",
      link: "/restaurant/orders",
    },
    {
      title: "Pending Orders",
      count: 5,
      icon: <FaShoppingCart size={24} />,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-800/30 dark:text-amber-300",
      link: "/restaurant/orders?status=pending",
    },
    {
      title: "Menu Items",
      count: 42,
      icon: <FaUtensils size={24} />,
      color: "bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300",
      link: "/restaurant/menu",
    },
    {
      title: "Total Revenue",
      count: "$25,000",
      icon: <FaChartLine size={24} />,
      color: "bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-300",
      link: "/restaurant/analytics",
    },
  ];

  // Restaurant-specific quick actions
  const quickActions = [
    {
      title: "Manage Restaurant",
      description: "Update your restaurant details",
      icon: <FaStore className="h-8 w-8 mb-2" />,
      gradient: "bg-gradient-to-r from-orange-500 to-orange-700",
      link: "/restaurant/profile",
      buttonText: "Manage Restaurant"
    },
    {
      title: "Manage Menu",
      description: "Update your restaurant's menu",
      icon: <FaUtensils className="h-8 w-8 mb-2" />,
      gradient: "bg-gradient-to-r from-blue-500 to-blue-700",
      link: "/restaurant/menu",
      buttonText: "Go to Menu"
    },
    {
      title: "View Analytics",
      description: "Check your performance metrics",
      icon: <FaChartLine className="h-8 w-8 mb-2" />,
      gradient: "bg-gradient-to-r from-purple-500 to-purple-700",
      link: "/restaurant/analytics",
      buttonText: "View Analytics"
    }
  ];

  // Restaurant-specific recent activity
  const recentActivity = [
    {
      id: 1,
      type: "Order",
      details: "New order #123 received",
      status: "pending",
      date: new Date().toLocaleDateString(),
      link: "/restaurant/orders/123"
    },
    {
      id: 2,
      type: "Menu Update",
      details: "Added new item 'Veggie Bowl'",
      status: "completed",
      date: new Date().toLocaleDateString(),
      link: "/restaurant/menu"
    },
    {
      id: 3,
      type: "Profile Update",
      details: "Contact information updated",
      status: "pending",
      date: new Date().toLocaleDateString(),
      link: "/restaurant/profile"
    }
  ];

  return (
    <Dashboard
      role="restaurantOwner"
      stats={stats}
      quickActions={quickActions}
      recentActivity={recentActivity}
    />
  );
};

export default RestaurantDashboard; 