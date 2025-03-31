import { useState } from 'react';
import { Card, Button, Progress } from '../../components/ui';
import { FaGift, FaStar, FaHistory, FaTicketAlt, FaCoins } from 'react-icons/fa';

const UserRewards = () => {
  const [activeTab, setActiveTab] = useState('points');

  // Sample data - replace with API data
  const userData = {
    points: 1250,
    tier: "Gold",
    nextTier: "Platinum",
    pointsToNextTier: 750,
    totalPoints: 5000,
    rewards: [
      {
        id: 1,
        name: "Free Delivery",
        points: 500,
        description: "Get free delivery on your next order",
        expiryDate: "2024-04-15",
        isRedeemed: false
      },
      {
        id: 2,
        name: "10% Off",
        points: 1000,
        description: "Get 10% off on your next order",
        expiryDate: "2024-04-30",
        isRedeemed: false
      },
      {
        id: 3,
        name: "Free Dessert",
        points: 750,
        description: "Get a free dessert with your next order",
        expiryDate: "2024-05-15",
        isRedeemed: true
      }
    ],
    history: [
      {
        id: 1,
        type: "earned",
        points: 100,
        description: "Points earned from order #123456",
        date: "2024-03-15"
      },
      {
        id: 2,
        type: "redeemed",
        points: -500,
        description: "Redeemed for free delivery",
        date: "2024-03-10"
      },
      {
        id: 3,
        type: "earned",
        points: 150,
        description: "Points earned from order #123455",
        date: "2024-03-05"
      }
    ]
  };

  const handleRedeemReward = (rewardId) => {
    // TODO: Implement API call to redeem reward
    console.log('Redeem reward:', rewardId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rewards</h1>
        <div className="flex items-center gap-2">
          <FaCoins className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold">{userData.points} points</span>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Current Tier: {userData.tier}</h2>
            <p className="text-sm text-gray-500">Next tier: {userData.nextTier}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total points earned</p>
            <p className="font-semibold">{userData.totalPoints}</p>
          </div>
        </div>
        <Progress value={(userData.points / (userData.points + userData.pointsToNextTier)) * 100} className="h-2" />
        <p className="text-sm text-gray-500 mt-2">
          {userData.pointsToNextTier} points needed for {userData.nextTier} tier
        </p>
      </Card>

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'points' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('points')}
        >
          Available Rewards
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('history')}
        >
          Points History
        </Button>
      </div>

      {activeTab === 'points' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userData.rewards.map(reward => (
            <Card key={reward.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <FaGift className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">{reward.name}</h3>
                    <p className="text-sm text-gray-500">{reward.points} points</p>
                  </div>
                </div>
                {reward.isRedeemed ? (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full dark:bg-green-800/30 dark:text-green-300">
                    Redeemed
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRedeemReward(reward.id)}
                    disabled={userData.points < reward.points}
                  >
                    Redeem
                  </Button>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600">{reward.description}</p>
              <p className="mt-2 text-xs text-gray-500">
                Expires: {new Date(reward.expiryDate).toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {userData.history.map(transaction => (
            <Card key={transaction.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {transaction.type === 'earned' ? (
                    <FaStar className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <FaTicketAlt className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'earned' ? '+' : '-'}{transaction.points}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'points' && userData.rewards.length === 0 && (
        <div className="text-center py-12">
          <FaGift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No rewards available</h3>
          <p className="text-gray-500 mt-2">Keep ordering to earn more points!</p>
        </div>
      )}

      {activeTab === 'history' && userData.history.length === 0 && (
        <div className="text-center py-12">
          <FaHistory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No points history</h3>
          <p className="text-gray-500 mt-2">Start ordering to earn points!</p>
        </div>
      )}
    </div>
  );
};

export default UserRewards; 