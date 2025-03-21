import React, { useEffect, useState } from "react";
import { FaUsers, FaUtensils, FaShoppingCart, FaTruck, FaUserTie, FaUserFriends } from "react-icons/fa";
import { Link } from "react-router-dom";
import { adminAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const { currentUser } = useAuth();
  
  const [dashboardData, setDashboardData] = useState({
    users: 0,
    owners: 0,
    orders: 0,
    deliveries: 0,
    loading: true,
    error: null
  });

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch statistics from the API
        const response = await adminAPI.getStatistics();
        
        if (response.data.success) {
          setDashboardData({
            users: response.data.data.users || 0,
            owners: response.data.data.owners || 0,
            orders: 0, // Add these fields when the API provides them
            deliveries: 0,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard data'
        }));
      }
    };

    fetchDashboardData();
  }, []);

  // Dashboard stats cards
  const stats = [
    {
      title: "Total Users",
      count: dashboardData.users,
      icon: <FaUsers />,
      color: "#4e73df",
      link: "/admin/users",
    },
    {
      title: "Restaurants",
      count: dashboardData.owners,
      icon: <FaUtensils />,
      color: "#1cc88a",
      link: "/admin/restaurants",
    },
    {
      title: "Orders",
      count: dashboardData.orders || 156, // Fallback value
      icon: <FaShoppingCart />,
      color: "#36b9cc",
      link: "/admin/orders",
    },
    {
      title: "Deliveries",
      count: dashboardData.deliveries || 126, // Fallback value
      icon: <FaTruck />,
      color: "#f6c23e",
      link: "/admin/deliveries",
    },
  ];

  // Sample recent orders (would come from API in production)
  const recentOrders = [
    {
      id: 1,
      user: "John Doe",
      restaurant: "Healthy Bites",
      amount: "$45.99",
      status: "Delivered",
      date: "2023-06-15",
    },
    {
      id: 2,
      user: "Jane Smith",
      restaurant: "Green Bowl",
      amount: "$32.50",
      status: "Processing",
      date: "2023-06-15",
    },
    {
      id: 3,
      user: "Robert Johnson",
      restaurant: "Protein Hub",
      amount: "$28.75",
      status: "Pending",
      date: "2023-06-14",
    },
    {
      id: 4,
      user: "Emily Davis",
      restaurant: "Salad Bar",
      amount: "$18.25",
      status: "Delivered",
      date: "2023-06-14",
    },
    {
      id: 5,
      user: "Michael Wilson",
      restaurant: "Nutrimeals",
      amount: "$52.30",
      status: "Delivered",
      date: "2023-06-13",
    },
  ];

  return (
    <div className="dashboardWrapper">
      <div className="pageTitle">
        <h2>Dashboard</h2>
        <p>Welcome back, {currentUser?.name || 'Admin'}</p>
      </div>

      {dashboardData.error && (
        <div className="alert alert-danger mb-4">
          {dashboardData.error}
        </div>
      )}

      <div className="row">
        {stats.map((stat, index) => (
          <div className="col-xl-3 col-md-6 mb-4" key={index}>
            <Link to={stat.link}>
              <div
                className="card border-left-primary shadow h-100 py-2"
                style={{ borderLeft: `4px solid ${stat.color}` }}
              >
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-uppercase mb-1">
                        {stat.title}
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">
                        {dashboardData.loading ? (
                          <span className="text-muted">Loading...</span>
                        ) : (
                          stat.count
                        )}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i
                        className="fas fa-2x text-gray-300"
                        style={{ color: stat.color, fontSize: "2rem" }}
                      >
                        {stat.icon}
                      </i>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Admin Management Buttons */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold">Management Options</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3 mb-md-0">
                  <Link to="/admin/restaurants" className="btn btn-primary btn-block d-flex align-items-center justify-content-center">
                    <FaUserTie className="me-2" /> Manage Owners
                  </Link>
                </div>
                <div className="col-md-6">
                  <Link to="/admin/users" className="btn btn-info btn-block d-flex align-items-center justify-content-center">
                    <FaUserFriends className="me-2" /> Manage Users
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card shadow mb-4">
            <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 font-weight-bold">Recent Orders</h6>
              <Link to="/admin/orders" className="btn btn-sm btn-primary">
                View All
              </Link>
            </div>
            <div className="card-body">
              {dashboardData.loading ? (
                <div className="text-center p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Restaurant</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td>#{order.id}</td>
                          <td>{order.user}</td>
                          <td>{order.restaurant}</td>
                          <td>{order.amount}</td>
                          <td>
                            <span
                              className={`badge ${
                                order.status === "Delivered"
                                  ? "bg-success"
                                  : order.status === "Processing"
                                  ? "bg-primary"
                                  : "bg-warning"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td>{order.date}</td>
                          <td>
                            <Link
                              to={`/admin/orders/${order.id}`}
                              className="btn btn-sm btn-info"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 