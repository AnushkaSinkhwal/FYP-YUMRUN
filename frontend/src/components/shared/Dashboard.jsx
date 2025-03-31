import { useState, useEffect } from "react";
import { FaUtensils, FaShoppingCart, FaEdit, FaChartLine } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Card, Badge, Button, Spinner, Tabs, TabsList, TabsTrigger, TabsContent } from "../ui";
import PropTypes from 'prop-types';

const Dashboard = ({ role = 'user', stats = [], quickActions = [], recentActivity = [] }) => {
  const [dashboardData, setDashboardData] = useState({
    loading: true,
    error: null,
    data: {}
  });

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
    
    // Refresh data every 60 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchNotifications();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call based on role
      // const response = await api.getDashboard(role);
      
      // Simulated data
      setDashboardData({
        loading: false,
        error: null,
        data: {}
      });
      
      setIsLoading(false);
    } catch (err) {
      console.error('Dashboard error:', err);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data'
      }));
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      // TODO: Replace with actual API call based on role
      // const response = await api.getNotifications(role);
      setNotifications([
        {
          id: 1,
          type: 'order',
          message: 'New order received',
          status: 'pending',
          createdAt: new Date()
        },
        {
          id: 2,
          type: 'profile_update',
          message: 'Profile update approved',
          status: 'approved',
          createdAt: new Date()
        }
      ]);
    } catch (err) {
      console.error('Notifications error:', err);
    }
  };

  return (
    <div className="p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <Link to={stat.link} key={index} className="group">
            <Card className="hover:shadow-md transition-shadow duration-200 dark:bg-gray-800 h-full">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {stat.title}
                    </p>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {isLoading ? (
                        <Spinner size="sm" />
                      ) : (
                        stat.count
                      )}
                    </h3>
                  </div>
                  <div className={`rounded-full p-3 ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="overflow-hidden dark:bg-gray-800 h-full">
                <div className={`p-5 ${action.gradient} text-white`}>
                  {action.icon}
                  <h3 className="text-lg font-semibold mb-1">{action.title}</h3>
                  <p className="text-sm opacity-80 mb-4">{action.description}</p>
                  <Button
                    variant="outline"
                    className="bg-white hover:bg-gray-50 border-transparent"
                    asChild
                  >
                    <Link to={action.link}>{action.buttonText}</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Recent Activity
          </h2>
          
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity">
              <Card className="dark:bg-gray-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Details</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.map((activity) => (
                        <tr key={activity.id} className="border-b dark:border-gray-700">
                          <td className="px-4 py-3">#{activity.id}</td>
                          <td className="px-4 py-3">{activity.type}</td>
                          <td className="px-4 py-3">{activity.details}</td>
                          <td className="px-4 py-3">
                            <Badge variant={activity.status === "completed" ? "success" : "warning"}>
                              {activity.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">{activity.date}</td>
                          <td className="px-4 py-3">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={activity.link}>View</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="updates">
              <Card className="dark:bg-gray-800">
                <div className="p-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="mb-4 last:mb-0 p-4 border-b last:border-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{notification.message}</p>
                          <p className="text-sm text-gray-500">{new Date(notification.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={notification.status === "approved" ? "success" : "warning"}>
                          {notification.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

Dashboard.propTypes = {
  role: PropTypes.oneOf(['admin', 'restaurantOwner', 'deliveryUser', 'user']).isRequired,
  stats: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired,
    count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    icon: PropTypes.node.isRequired,
    color: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired
  })),
  quickActions: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    gradient: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
    buttonText: PropTypes.string.isRequired
  })),
  recentActivity: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    type: PropTypes.string.isRequired,
    details: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired
  }))
};

Dashboard.defaultProps = {
  stats: [],
  quickActions: [],
  recentActivity: []
};

export default Dashboard; 