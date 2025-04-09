import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Badge, Button, Spinner, Tabs, TabsList, TabsTrigger, TabsContent, Alert } from "../ui";
import PropTypes from 'prop-types';
import { FaSync } from 'react-icons/fa';

const Dashboard = ({ 
  stats = [], 
  quickActions = [], 
  recentActivity = [],
  isLoading = false,
  error = null,
  onRefresh = null 
}) => {
  const [notifications, setNotifications] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 60 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    if (onRefresh && typeof onRefresh === 'function') {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
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
      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-2"
          >
            <FaSync className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Link to={stat.link} key={index} className="group">
            <Card className="h-full transition-shadow duration-200 hover:shadow-md dark:bg-gray-800">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
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
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => (
              <Card key={index} className="h-full overflow-hidden dark:bg-gray-800">
                <div className={`p-5 ${action.gradient} text-white`}>
                  {action.icon}
                  <h3 className="mb-1 text-lg font-semibold">{action.title}</h3>
                  <p className="mb-4 text-sm opacity-80">{action.description}</p>
                  <Button
                    variant="secondary"
                    className="w-full text-gray-800 bg-white border-transparent shadow-sm hover:bg-gray-100"
                    asChild
                  >
                    <Link to={action.link} className="inline-flex items-center justify-center">
                      {action.buttonText}
                    </Link>
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
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
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
                      {isLoading ? (
                        <tr>
                          <td colSpan="6" className="px-4 py-8 text-center">
                            <Spinner className="mx-auto" />
                            <p className="mt-2">Loading activity data...</p>
                          </td>
                        </tr>
                      ) : recentActivity.length > 0 ? (
                        recentActivity.map((activity) => (
                          <tr key={activity.id} className="border-b dark:border-gray-700">
                            <td className="px-4 py-3">#{typeof activity.id === 'string' ? activity.id.substring(0, 6) : activity.id}</td>
                            <td className="px-4 py-3">{activity.type}</td>
                            <td className="px-4 py-3">{activity.details}</td>
                            <td className="px-4 py-3">
                              <Badge variant={activity.status === "completed" ? "success" : "warning"}>
                                {activity.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {typeof activity.date === 'string' ? activity.date : new Date(activity.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <Button variant="outline" size="sm" asChild>
                                <Link to={activity.link}>View</Link>
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                            No recent activity to display
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="updates">
              <Card className="dark:bg-gray-800">
                <div className="p-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="p-4 mb-4 border-b last:mb-0 last:border-0">
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
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    link: PropTypes.string.isRequired
  })),
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onRefresh: PropTypes.func
};

Dashboard.defaultProps = {
  stats: [],
  quickActions: [],
  recentActivity: [],
  isLoading: false,
  error: null,
  onRefresh: null
};

export default Dashboard; 