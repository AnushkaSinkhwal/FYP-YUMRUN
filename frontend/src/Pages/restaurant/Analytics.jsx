import { useState, useEffect } from 'react';
import { Card, Button, Tabs, TabsList, TabsTrigger, Spinner } from '../../components/ui';
import { FaChartLine, FaChartBar, FaChartPie, FaChartArea, FaDownload } from 'react-icons/fa';
import { restaurantAPI } from '../../utils/api';

const RestaurantAnalytics = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    revenue: {
      total: 0,
      change: 0,
      data: []
    },
    orders: {
      total: 0,
      change: 0,
      data: []
    },
    customers: {
      total: 0,
      change: 0,
      data: []
    },
    avgOrderValue: {
      total: 0,
      change: 0,
      data: []
    },
    popularItems: []
  });

  useEffect(() => {
    fetchAnalyticsData(timeRange);
  }, [timeRange]);

  const fetchAnalyticsData = async (period) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to fetch real analytics data
      try {
        console.log('Fetching restaurant analytics data for period:', period);
        const response = await restaurantAPI.getAnalytics(period);
        
        if (response?.data?.success) {
          const data = response.data.data || {};
          console.log('Successfully fetched restaurant analytics:', data);
          
          // Format the data for our UI
          setMetrics({
            revenue: {
              total: data.revenue?.total || 0,
              change: data.revenue?.change || 0,
              data: data.revenue?.history || []
            },
            orders: {
              total: data.orders?.total || 0,
              change: data.orders?.change || 0,
              data: data.orders?.history || []
            },
            customers: {
              total: data.customers?.total || 0,
              change: data.customers?.change || 0,
              data: data.customers?.history || []
            },
            avgOrderValue: {
              total: data.avgOrderValue?.total || 0,
              change: data.avgOrderValue?.change || 0,
              data: data.avgOrderValue?.history || []
            },
            popularItems: data.popularItems || []
          });
          
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.log('Restaurant analytics API endpoint not available:', err.message);
        // Continue to fallback data
      }
      
      // Fallback to sample data if API is not available
      console.log('Using sample analytics data');
      setMetrics({
        revenue: {
          total: 25000,
          change: 12.5,
          data: [/* Time series data */]
        },
        orders: {
          total: 450,
          change: 8.2,
          data: [/* Time series data */]
        },
        customers: {
          total: 280,
          change: 15.3,
          data: [/* Time series data */]
        },
        avgOrderValue: {
          total: 55.50,
          change: -2.1,
          data: [/* Time series data */]
        },
        popularItems: [
          { name: "Chicken Burger", orders: 42, revenue: 524.50 },
          { name: "Veggie Pizza", orders: 38, revenue: 498.75 },
          { name: "Caesar Salad", orders: 31, revenue: 387.20 },
          { name: "Chocolate Cake", orders: 28, revenue: 310.50 },
          { name: "Fish Tacos", orders: 25, revenue: 290.25 }
        ]
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${metrics.revenue.total.toLocaleString()}`,
      change: metrics.revenue.change,
      icon: <FaChartLine size={24} />,
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300'
    },
    {
      title: 'Total Orders',
      value: metrics.orders.total,
      change: metrics.orders.change,
      icon: <FaChartBar size={24} />,
      color: 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300'
    },
    {
      title: 'Unique Customers',
      value: metrics.customers.total,
      change: metrics.customers.change,
      icon: <FaChartPie size={24} />,
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-300'
    },
    {
      title: 'Average Order Value',
      value: `$${metrics.avgOrderValue.total.toFixed(2)}`,
      change: metrics.avgOrderValue.change,
      icon: <FaChartArea size={24} />,
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-800/30 dark:text-amber-300'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Analytics</h1>
        <div className="flex gap-2">
          <Tabs defaultValue={timeRange} className="w-auto" onValueChange={(value) => {
            setTimeRange(value);
            // fetchAnalyticsData is called by useEffect when timeRange changes
          }}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" className="flex items-center gap-2">
            <FaDownload className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Show loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Show error message if any */}
      {error && !isLoading && (
        <div className="text-red-500 bg-red-50 p-4 rounded mb-6">
          {error}
        </div>
      )}

      {/* Stats Grid - only show when not loading */}
      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`rounded-full p-3 ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div className={`text-sm font-medium ${
                    stat.change > 0 ? 'text-green-600 dark:text-green-400' : 
                    stat.change < 0 ? 'text-red-600 dark:text-red-400' : 
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {stat.change > 0 ? '+' : ''}{stat.change}%
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Revenue Overview</h3>
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {/* Add chart component here */}
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  Chart Placeholder
                </div>
              </div>
            </Card>

            {/* Orders Chart */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Orders Overview</h3>
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {/* Add chart component here */}
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  Chart Placeholder
                </div>
              </div>
            </Card>

            {/* Popular Items */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Popular Items</h3>
              <div className="space-y-4">
                {metrics.popularItems && metrics.popularItems.length > 0 ? (
                  metrics.popularItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-100">{item.name || `Item ${index + 1}`}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Orders: {item.orders || 0}</p>
                        </div>
                      </div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">${item.revenue?.toFixed(2) || '0.00'}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No popular items data available
                  </div>
                )}
              </div>
            </Card>

            {/* Customer Demographics */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Customer Demographics</h3>
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {/* Add chart component here */}
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  Chart Placeholder
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default RestaurantAnalytics; 