import { FaUsers, FaUtensils, FaShoppingCart, FaTruck, FaChartLine } from 'react-icons/fa';
import Dashboard from '../../components/shared/Dashboard';

const AdminDashboard = () => {
  // Admin-specific stats
  const stats = [
    {
      title: "Total Users",
      count: 1250,
      icon: <FaUsers size={24} />,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300",
      link: "/admin/users",
    },
    {
      title: "Restaurants",
      count: 45,
      icon: <FaUtensils size={24} />,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-800/30 dark:text-amber-300",
      link: "/admin/restaurant",
    },
    {
      title: "Total Orders",
      count: 850,
      icon: <FaShoppingCart size={24} />,
      color: "bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300",
      link: "/admin/orders",
    },
    {
      title: "Active Deliveries",
      count: 12,
      icon: <FaTruck size={24} />,
      color: "bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-300",
      link: "/admin/deliveries",
    },
  ];

  // Admin-specific quick actions
  const quickActions = [
    {
      title: "Manage Restaurants",
      description: "Review and manage restaurant listings",
      icon: <FaUtensils className="w-8 h-8 mb-2" />,
      gradient: "bg-gradient-to-r from-blue-500 to-blue-700",
      link: "/admin/restaurant",
      buttonText: "View Restaurants"
    },
    {
      title: "User Management",
      description: "Manage user accounts and roles",
      icon: <FaUsers className="w-8 h-8 mb-2" />,
      gradient: "bg-gradient-to-r from-green-500 to-green-700",
      link: "/admin/users",
      buttonText: "Manage Users"
    },
    {
      title: "View Analytics",
      description: "Platform performance metrics",
      icon: <FaChartLine className="w-8 h-8 mb-2" />,
      gradient: "bg-gradient-to-r from-purple-500 to-purple-700",
      link: "/admin/analytics",
      buttonText: "View Analytics"
    }
  ];

  // Admin-specific recent activity
  const recentActivity = [
    {
      id: 1,
      type: "Restaurant Approval",
      details: "New restaurant registration pending approval",
      status: "pending",
      date: new Date().toLocaleDateString(),
      link: "/admin/restaurant/approvals"
    },
    {
      id: 2,
      type: "User Report",
      details: "Customer complaint about delivery",
      status: "active",
      date: new Date().toLocaleDateString(),
      link: "/admin/reports/2"
    },
    {
      id: 3,
      type: "System Update",
      details: "Payment gateway maintenance completed",
      status: "completed",
      date: new Date().toLocaleDateString(),
      link: "/admin/system/updates"
    }
  ];

  return (
    <Dashboard
      role="admin"
      stats={stats}
      quickActions={quickActions}
      recentActivity={recentActivity}
    />
  );
};

export default AdminDashboard; 