import { FaMotorcycle, FaCheckCircle, FaClock, FaDollarSign } from 'react-icons/fa';
import Dashboard from '../../components/shared/Dashboard';

const DeliveryDashboard = () => {
  // Delivery-specific stats
  const stats = [
    {
      title: "Active Deliveries",
      count: 2,
      icon: <FaMotorcycle size={24} />,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300",
      link: "/delivery/orders",
    },
    {
      title: "Completed Today",
      count: 8,
      icon: <FaCheckCircle size={24} />,
      color: "bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300",
      link: "/delivery/history",
    },
    {
      title: "Pending Pickups",
      count: 3,
      icon: <FaClock size={24} />,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-800/30 dark:text-amber-300",
      link: "/delivery/orders?status=pending",
    },
    {
      title: "Today's Earnings",
      count: "$45.50",
      icon: <FaDollarSign size={24} />,
      color: "bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-300",
      link: "/delivery/earnings",
    },
  ];

  // Delivery-specific quick actions
  const quickActions = [
    {
      title: "View Orders",
      description: "Check available and active deliveries",
      icon: <FaMotorcycle className="h-8 w-8 mb-2" />,
      gradient: "bg-gradient-to-r from-blue-500 to-blue-700",
      link: "/delivery/orders",
      buttonText: "View Orders"
    },
    {
      title: "Delivery History",
      description: "View your past deliveries",
      icon: <FaCheckCircle className="h-8 w-8 mb-2" />,
      gradient: "bg-gradient-to-r from-green-500 to-green-700",
      link: "/delivery/history",
      buttonText: "View History"
    },
    {
      title: "Earnings",
      description: "Check your earnings and payments",
      icon: <FaDollarSign className="h-8 w-8 mb-2" />,
      gradient: "bg-gradient-to-r from-purple-500 to-purple-700",
      link: "/delivery/earnings",
      buttonText: "View Earnings"
    }
  ];

  // Delivery-specific recent activity
  const recentActivity = [
    {
      id: 1,
      type: "Delivery",
      details: "Order #123 delivered successfully",
      status: "completed",
      date: new Date().toLocaleDateString(),
      link: "/delivery/orders/123"
    },
    {
      id: 2,
      type: "Pickup",
      details: "New order #124 ready for pickup",
      status: "pending",
      date: new Date().toLocaleDateString(),
      link: "/delivery/orders/124"
    },
    {
      id: 3,
      type: "Earnings",
      details: "Weekly payment processed",
      status: "completed",
      date: new Date().toLocaleDateString(),
      link: "/delivery/earnings"
    }
  ];

  return (
    <Dashboard
      role="deliveryUser"
      stats={stats}
      quickActions={quickActions}
      recentActivity={recentActivity}
    />
  );
};

export default DeliveryDashboard; 