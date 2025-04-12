import { useState, useEffect } from 'react';
import { Card, Button, Progress } from '../ui';
import { userAPI } from '../../utils/api';
import { formatDate } from '../../utils/helpers';

const LoyaltyDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [loyaltyData, setLoyaltyData] = useState({
    currentPoints: 0,
    history: []
  });
  const [rewards, setRewards] = useState([
    { id: 1, name: 'Rs. 50 off your order', pointsRequired: 500, value: 50 },
    { id: 2, name: 'Rs. 100 off your order', pointsRequired: 1000, value: 100 },
    { id: 3, name: 'Rs. 200 off your order', pointsRequired: 2000, value: 200 },
    { id: 4, name: 'Free delivery', pointsRequired: 300, value: 'free_delivery' }
  ]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userAPI.getLoyaltyDetails();
      
      if (response.data.success) {
        setLoyaltyData(response.data.data);
      } else {
        setError('Failed to fetch loyalty data');
      }
    } catch (err) {
      console.error('Error fetching loyalty data:', err);
      setError('An error occurred while fetching your loyalty points data');
    } finally {
      setLoading(false);
    }
  };

  const getPointsToNextReward = () => {
    // Sort rewards by points required and find the next one the user can achieve
    const sortedRewards = [...rewards].sort((a, b) => a.pointsRequired - b.pointsRequired);
    const nextReward = sortedRewards.find(reward => reward.pointsRequired > loyaltyData.currentPoints);
    
    if (nextReward) {
      return {
        pointsNeeded: nextReward.pointsRequired - loyaltyData.currentPoints,
        reward: nextReward
      };
    }
    
    // If user has more points than any reward requires
    return null;
  };

  const nextRewardInfo = getPointsToNextReward();
  
  // Calculate the percentage progress to the next reward
  const getProgressPercentage = () => {
    if (!nextRewardInfo) return 100;
    
    const { pointsNeeded, reward } = nextRewardInfo;
    const totalPointsForReward = reward.pointsRequired;
    const pointsCollected = totalPointsForReward - pointsNeeded;
    
    return Math.round((pointsCollected / totalPointsForReward) * 100);
  };

  const handleRedeemPoints = async (reward) => {
    try {
      // In a real implementation, this would redirect to order selection or integrate with current order
      alert(`Redeem ${reward.pointsRequired} points for ${reward.name}`);
      
      // Example of how redemption might work
      // const response = await userAPI.redeemLoyaltyPoints(reward.pointsRequired, orderId);
      // if (response.data.success) {
      //   // Update loyalty data after redemption
      //   fetchLoyaltyData();
      // } else {
      //   setError('Failed to redeem points');
      // }
    } catch (err) {
      console.error('Error redeeming points:', err);
      setError('An error occurred while redeeming your points');
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p>Loading your loyalty points...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchLoyaltyData} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Points Summary */}
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-3xl font-bold text-primary">
            {loyaltyData.currentPoints}
          </h3>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
            Loyalty Points
          </p>
          
          {nextRewardInfo && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-gray-500">
                {nextRewardInfo.pointsNeeded} more points until your next reward
              </p>
              <Progress value={getProgressPercentage()} className="h-2 bg-primary/20" />
              <p className="mt-2 text-sm font-medium">
                Next reward: {nextRewardInfo.reward.name}
              </p>
            </div>
          )}
        </div>
      </Card>
      
      {/* Available Rewards */}
      <div>
        <h3 className="mb-4 text-xl font-semibold">Available Rewards</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rewards.map(reward => (
            <Card key={reward.id} className="p-4">
              <div className="flex justify-between">
                <div>
                  <h4 className="text-lg font-medium">{reward.name}</h4>
                  <p className="text-sm text-gray-500">{reward.pointsRequired} points</p>
                </div>
                <Button
                  disabled={loyaltyData.currentPoints < reward.pointsRequired}
                  onClick={() => handleRedeemPoints(reward)}
                  variant={loyaltyData.currentPoints >= reward.pointsRequired ? "default" : "outline"}
                  size="sm"
                >
                  Redeem
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Points History */}
      <div>
        <h3 className="mb-4 text-xl font-semibold">Points History</h3>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Points</th>
                  <th className="px-4 py-3 text-left font-medium">Transaction</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loyaltyData.history.length > 0 ? (
                  loyaltyData.history.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3">{formatDate(record.date)}</td>
                      <td className={`px-4 py-3 font-medium ${record.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                        {record.type === 'earned' ? '+' : '-'}{Math.abs(record.points)}
                      </td>
                      <td className="px-4 py-3 capitalize">{record.type}</td>
                      <td className="px-4 py-3">{record.description}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-center text-gray-500">
                      No points history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      
      {/* How Points Work */}
      <Card className="p-6">
        <h3 className="mb-2 text-xl font-semibold">How Points Work</h3>
        <ul className="ml-6 space-y-2 list-disc text-gray-600 dark:text-gray-300">
          <li>Earn 10 points for every Rs. 100 spent on orders</li>
          <li>Redeem points for discounts on future orders</li>
          <li>Points expire after 12 months from the date earned</li>
          <li>Points can only be redeemed on orders above the minimum order value</li>
        </ul>
      </Card>
    </div>
  );
};

export default LoyaltyDashboard; 