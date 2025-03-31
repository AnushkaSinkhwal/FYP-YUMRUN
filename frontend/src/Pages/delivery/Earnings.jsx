import { Card, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { FaDollarSign, FaChartLine, FaDownload } from 'react-icons/fa';

const DeliveryEarnings = () => {
  // Sample earnings data
  const earnings = {
    totalEarnings: 245.50,
    totalDeliveries: 32,
    averageEarningsPerDelivery: 7.67,
    totalDistance: 85.5,
    earningsByDay: [
      { date: '2024-03-20', earnings: 45.50, deliveries: 8 },
      { date: '2024-03-19', earnings: 38.75, deliveries: 6 },
      { date: '2024-03-18', earnings: 42.25, deliveries: 7 },
      { date: '2024-03-17', earnings: 35.00, deliveries: 5 },
      { date: '2024-03-16', earnings: 48.00, deliveries: 8 },
      { date: '2024-03-15', earnings: 36.00, deliveries: 6 },
      { date: '2024-03-14', earnings: 45.50, deliveries: 8 }
    ],
    recentTransactions: [
      {
        id: 1,
        date: '2024-03-20',
        amount: 45.50,
        deliveries: 8,
        status: 'completed'
      },
      {
        id: 2,
        date: '2024-03-19',
        amount: 38.75,
        deliveries: 6,
        status: 'completed'
      },
      {
        id: 3,
        date: '2024-03-18',
        amount: 42.25,
        deliveries: 7,
        status: 'completed'
      }
    ]
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-800/30">
              <FaDollarSign className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Earnings</p>
              <p className="text-2xl font-bold">${earnings.totalEarnings.toFixed(2)}</p>
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
              <p className="text-2xl font-bold">{earnings.totalDistance} km</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="week" className="space-y-4">
        <TabsList>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="year">This Year</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Earnings</h3>
            <div className="space-y-4">
              {earnings.earningsByDay.map((day, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{day.deliveries} deliveries</p>
                  </div>
                  <p className="text-lg font-semibold">${day.earnings.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
            <div className="space-y-4">
              {earnings.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{new Date(transaction.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.deliveries} deliveries</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">${transaction.amount.toFixed(2)}</p>
                    <p className="text-sm text-green-600 dark:text-green-400 capitalize">{transaction.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Overview</h3>
            <p className="text-gray-500 dark:text-gray-400">Monthly data will be displayed here</p>
          </Card>
        </TabsContent>

        <TabsContent value="year" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Yearly Overview</h3>
            <p className="text-gray-500 dark:text-gray-400">Yearly data will be displayed here</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeliveryEarnings; 