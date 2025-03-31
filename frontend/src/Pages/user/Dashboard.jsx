import { FaShoppingCart, FaHeart, FaHistory, FaUser } from 'react-icons/fa';
import Dashboard from '../../components/shared/Dashboard';

const UserDashboard = () => {
  // User-specific stats
  const stats = [
    {
      title: "Active Orders",
      count: 2,
      icon: <FaShoppingCart size={24} />,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300",
      link: "/user/orders",
    },
    {
      title: "Past Orders",
      count: 25,
      icon: <FaHistory size={24} />,
      color: "bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300",
      link: "/user/orders/history",
    },
    {
      title: "Favorites",
      count: 8,
      icon: <FaHeart size={24} />,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-800/30 dark:text-amber-300",
      link: "/user/favorites",
    },
    {
      title: "Points",
      count: "350",
      icon: <FaUser size={24} />,
      color: "bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-300",
      link: "/user/rewards",
    },
  ];

  // User-specific quick actions
  const quickActions = [
    {
      title: "Track Orders",
      description: "Track your active orders",
      icon: <FaShoppingCart className="h-8 w-8 mb-2" />,
      gradient: "bg-gradient-to-r from-blue-500 to-blue-700",
      link: "/user/orders",
      buttonText: "View Orders"
    },
    {
      title: "View Favorites",
      description: "Check your favorite restaurants",
      icon: <FaHeart className="h-8 w-8 mb-2" />,
      gradient: "bg-gradient-to-r from-green-500 to-green-700",
      link: "/user/favorites",
      buttonText: "View Favorites"
    },
    {
      title: "Order History",
      description: "View your past orders",
      icon: <FaHistory className="h-8 w-8 mb-2" />,
      gradient: "bg-gradient-to-r from-purple-500 to-purple-700",
      link: "/user/orders/history",
      buttonText: "View History"
    }
  ];

  // User-specific recent activity
  const recentActivity = [
    {
      id: 1,
      type: "Order",
      details: "Order #123 from Healthy Bites",
      status: "active",
      date: new Date().toLocaleDateString(),
      link: "/user/orders/123"
    },
    {
      id: 2,
      type: "Review",
      details: "You rated Green Bowl 5 stars",
      status: "completed",
      date: new Date().toLocaleDateString(),
      link: "/user/reviews"
    },
    {
      id: 3,
      type: "Points",
      details: "Earned 50 points from last order",
      status: "completed",
      date: new Date().toLocaleDateString(),
      link: "/user/rewards"
    }
  ];

  return (
    <Dashboard
      role="user"
      stats={stats}
      quickActions={quickActions}
      recentActivity={recentActivity}
    />
  );
};

export default UserDashboard; 