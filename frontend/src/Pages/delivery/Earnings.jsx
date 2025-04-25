import { useState, useEffect } from 'react';
import { Card, Button, Tabs, TabsList, TabsTrigger, TabsContent, Spinner, Alert } from '../../components/ui';
import { FaDollarSign, FaChartLine, FaDownload, FaExclamationCircle } from 'react-icons/fa';
import { deliveryAPI } from '../../utils/api';

const DeliveryEarnings = () => {
  const [activeTab, setActiveTab] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    totalDeliveries: 0,
    averageEarningsPerDelivery: 0,
    totalDistance: 0,
    earningsByDay: [],
    recentTransactions: []
  });

  // Fetch earnings data when component mounts or tab changes
  useEffect(() => {
    fetchEarningsData(activeTab);
  }, [activeTab]);

  const fetchEarningsData = async (period) => {
    try {
      setLoading(true);
      setError(null);

      // Use the new comprehensive earnings endpoint
      const response = await deliveryAPI.getEarnings(period);
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch earnings data');
      }

      const data = response.data.data || {};
      
      // Update state with fetched values
      setEarnings({
        totalEarnings: data.totalEarnings || 0,
        totalDeliveries: data.totalDeliveries || 0,
        averageEarningsPerDelivery: data.avgEarningsPerDelivery || 0,
        totalDistance: data.totalDistance || 0,
        earningsByDay: data.earningsByDay || [],
        recentTransactions: data.recentTransactions || [],
        earningsChange: data.earningsChange || 0
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching earnings data:', error);
      setError(error.message || 'Failed to load earnings data');
      setLoading(false);
      
      // Fallback to earnings summary for basic data in case new endpoint fails
      try {
        const summaryResponse = await deliveryAPI.getEarningsSummary();
        const historyResponse = await deliveryAPI.getDeliveryHistory(50);
        
        if (summaryResponse.data?.success && historyResponse.data?.success) {
          const summary = summaryResponse.data.summary || {};
          const deliveries = historyResponse.data.deliveries || [];
          
          // Calculate basic metrics from history data
          const totalDeliveries = deliveries.length;
          let totalEarnings = summary.todayEarnings || 0;
          let totalDistance = 0;
          
          // Update with minimal data
          setEarnings({
            totalEarnings,
            totalDeliveries,
            averageEarningsPerDelivery: totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0,
            totalDistance,
            earningsByDay: [],
            recentTransactions: []
          });
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    }
  };

  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Earnings</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FaDownload className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="flex items-center gap-2">
          <FaExclamationCircle className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-800/30">
                  <FaDollarSign className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Earnings</p>
                  <p className="text-2xl font-bold">${earnings.totalEarnings.toFixed(2)}</p>
                  {earnings.earningsChange !== undefined && (
                    <p className={`text-xs ${earnings.earningsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {earnings.earningsChange > 0 ? '+' : ''}{earnings.earningsChange}% from previous period
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full dark:bg-green-800/30">
                  <FaChartLine className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Deliveries</p>
                  <p className="text-2xl font-bold">{earnings.totalDeliveries}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full dark:bg-purple-800/30">
                  <FaDollarSign className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg. per Delivery</p>
                  <p className="text-2xl font-bold">${earnings.averageEarningsPerDelivery.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-full dark:bg-amber-800/30">
                  <FaChartLine className="h-6 w-6 text-amber-600 dark:text-amber-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Distance</p>
                  <p className="text-2xl font-bold">{earnings.totalDistance.toFixed(1)} km</p>
                </div>
              </div>
            </Card>
          </div>

          <Tabs defaultValue="week" value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
              <TabsTrigger value="year">This Year</TabsTrigger>
            </TabsList>

            <TabsContent value="week" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Daily Earnings</h3>
                <div className="space-y-4">
                  {earnings.earningsByDay.length > 0 ? (
                    earnings.earningsByDay.map((day, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{day.deliveries} deliveries</p>
                        </div>
                        <p className="text-lg font-semibold">${day.earnings.toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No earnings data available for this week</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                <div className="space-y-4">
                  {earnings.recentTransactions.length > 0 ? (
                    earnings.recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Order #{transaction.orderNumber}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">${transaction.amount.toFixed(2)}</p>
                          <p className="text-sm text-green-600 dark:text-green-400 capitalize">{transaction.status}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No transaction data available</p>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="month" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Monthly Overview</h3>
                <div className="space-y-4">
                  {earnings.earningsByDay.length > 0 ? (
                    earnings.earningsByDay.map((day, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{day.deliveries} deliveries</p>
                        </div>
                        <p className="text-lg font-semibold">${day.earnings.toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No earnings data available for this month</p>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="year" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Yearly Overview</h3>
                <div className="space-y-4">
                  {earnings.earningsByDay.length > 0 ? (
                    earnings.earningsByDay.map((day, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{new Date(day.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{day.deliveries} deliveries</p>
                        </div>
                        <p className="text-lg font-semibold">${day.earnings.toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No earnings data available for this year</p>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default DeliveryEarnings; 