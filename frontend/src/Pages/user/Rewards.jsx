import { useState, useEffect } from 'react';
import { Card, Button, Progress, Alert, Spinner, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui';
import { FaGift, FaStar, FaHistory, FaTicketAlt, FaCoins, FaTrophy, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const UserRewards = () => {
  const [activeTab, setActiveTab] = useState('points');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redeemLoading, setRedeemLoading] = useState(null);
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    fetchRewardsData();
  }, [isAuthenticated]);

  const fetchRewardsData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/loyalty/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rewards data: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUserData(processRewardsData(data.data));
      } else {
        throw new Error(data.message || 'Failed to fetch rewards data');
      }
    } catch (err) {
      console.error('Error fetching rewards data:', err);
      setError('Unable to load rewards data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const processRewardsData = (data) => {
    // If we have valid data from the API, use it
    if (data && data.points !== undefined) {
      return data;
    }
    
    // Otherwise use our fallback data
    return getFallbackData();
  };

  const getFallbackData = () => {
    return {
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
          expiryDate: "2024-06-15",
          isRedeemed: false
        },
        {
          id: 2,
          name: "10% Off",
          points: 1000,
          description: "Get 10% off on your next order",
          expiryDate: "2024-06-30",
          isRedeemed: false
        },
        {
          id: 3,
          name: "Free Dessert",
          points: 750,
          description: "Get a free dessert with your next order",
          expiryDate: "2024-06-15",
          isRedeemed: true
        }
      ],
      history: [
        {
          id: 1,
          type: "earned",
          points: 100,
          description: "Points earned from order #123456",
          date: "2024-04-15"
        },
        {
          id: 2,
          type: "redeemed",
          points: -500,
          description: "Redeemed for free delivery",
          date: "2024-04-10"
        },
        {
          id: 3,
          type: "earned",
          points: 150,
          description: "Points earned from order #123455",
          date: "2024-04-05"
        }
      ]
    };
  };

  const calculateProgress = () => {
    if (!userData) return 0;
    
    const { points, pointsToNextTier } = userData;
    const totalPointsNeeded = points + pointsToNextTier;
    
    if (totalPointsNeeded === 0) return 100; // Avoid division by zero
    return Math.min(100, Math.round((points / totalPointsNeeded) * 100));
  };

  const handleRedeemReward = async (rewardId) => {
    if (!isAuthenticated) return;
    
    try {
      setRedeemLoading(rewardId);
      setError(null);
      
      const response = await fetch(`/api/loyalty/rewards/redeem/${rewardId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to redeem reward: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // First find the redeemed reward to calculate point deduction
        const redeemedReward = userData.rewards.find(r => r.id === rewardId || r._id === rewardId);
        const pointsDeducted = redeemedReward ? redeemedReward.points : 0;
        
        // Update local state to reflect the changes
        setUserData(prevData => {
          // Create a new transaction history entry
          const newHistoryEntry = {
            id: Date.now(), // Temporary id for local state
            type: 'redeemed',
            points: -pointsDeducted,
            description: `Redeemed ${redeemedReward ? redeemedReward.name : 'reward'}`,
            date: new Date().toISOString()
          };
          
          return {
            ...prevData,
            points: prevData.points - pointsDeducted,
            rewards: prevData.rewards.map(reward => 
              (reward.id === rewardId || reward._id === rewardId)
                ? { ...reward, isRedeemed: true } 
                : reward
            ),
            history: [newHistoryEntry, ...prevData.history]
          };
        });
      } else {
        throw new Error(data.message || 'Failed to redeem reward');
      }
    } catch (err) {
      console.error('Error redeeming reward:', err);
      setError('Failed to redeem reward. Please try again.');
    } finally {
      setRedeemLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  const getRewardId = (reward) => {
    return reward.id || reward._id;
  };

  const getActiveRewards = () => {
    if (!userData || !userData.rewards) return [];
    return userData.rewards.filter(reward => !reward.isRedeemed);
  };

  const getRedeemedRewards = () => {
    if (!userData || !userData.rewards) return [];
    return userData.rewards.filter(reward => reward.isRedeemed);
  };

  const sortTransactions = (transactions) => {
    if (!transactions) return [];
    return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-12">
        <FaGift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Rewards Unavailable</h3>
        <p className="text-gray-500 mt-2">Unable to load rewards data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rewards</h1>
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full dark:bg-amber-900/30 dark:text-amber-300">
          <FaCoins className="h-5 w-5" />
          <span className="font-semibold">{userData.points} points</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="p-6 border-t-4 border-primary">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <FaTrophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Current Tier: {userData.tier}</h2>
              <p className="text-sm text-gray-500">Next tier: {userData.nextTier}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total points earned</p>
            <p className="font-semibold">{userData.totalPoints}</p>
          </div>
        </div>
        
        <div className="relative w-full h-7 mb-2 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-800">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500 flex items-center justify-end pr-2"
            style={{ width: `${calculateProgress()}%` }}
          >
            {calculateProgress() > 15 && (
              <span className="text-xs text-white font-medium">{calculateProgress()}%</span>
            )}
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mt-2">
          {userData.pointsToNextTier} points needed for {userData.nextTier} tier
        </p>
      </Card>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Rewards</TabsTrigger>
          <TabsTrigger value="redeemed">Redeemed</TabsTrigger>
          <TabsTrigger value="history">Points History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          {getActiveRewards().length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getActiveRewards().map(reward => {
                const rewardId = getRewardId(reward);
                return (
                  <Card key={rewardId} className="p-6 hover:shadow-md transition-all border-l-4 border-primary">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <FaGift className="h-6 w-6 text-primary flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold">{reward.name}</h3>
                          <p className="text-sm text-gray-500">{reward.points} points</p>
                        </div>
                      </div>
                      <Button
                        variant={userData.points >= reward.points ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleRedeemReward(rewardId)}
                        disabled={userData.points < reward.points || redeemLoading === rewardId}
                      >
                        {redeemLoading === rewardId ? (
                          <Spinner size="sm" className="mr-2" />
                        ) : null}
                        Redeem
                      </Button>
                    </div>
                    <p className="mt-3 text-sm text-gray-600">{reward.description}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      Expires: {formatDate(reward.expiryDate)}
                    </p>
                    {userData.points < reward.points && (
                      <div className="mt-3 flex items-center text-xs text-amber-600">
                        <FaInfoCircle className="mr-1" />
                        <span>You need {reward.points - userData.points} more points</span>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg dark:bg-gray-800">
              <FaGift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No active rewards</h3>
              <p className="text-gray-500 mt-2">Keep ordering to earn more points and unlock rewards!</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="redeemed" className="mt-4">
          {getRedeemedRewards().length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getRedeemedRewards().map(reward => (
                <Card key={getRewardId(reward)} className="p-6 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <FaGift className="h-6 w-6 text-gray-400" />
                      <div>
                        <h3 className="font-semibold">{reward.name}</h3>
                        <p className="text-sm text-gray-500">{reward.points} points</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full dark:bg-green-800/30 dark:text-green-300">
                      Redeemed
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{reward.description}</p>
                  {reward.redeemedAt && (
                    <p className="mt-2 text-xs text-gray-500">
                      Redeemed on: {formatDate(reward.redeemedAt)}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg dark:bg-gray-800">
              <FaGift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No redeemed rewards</h3>
              <p className="text-gray-500 mt-2">
                Start redeeming your points for rewards!
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          {userData.history && userData.history.length > 0 ? (
            <div className="space-y-4">
              {sortTransactions(userData.history).map(transaction => (
                <Card key={transaction.id || transaction._id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {transaction.type === 'earned' || transaction.points > 0 ? (
                        <FaStar className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <FaTicketAlt className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.points > 0 ? '+' : ''}{transaction.points}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg dark:bg-gray-800">
              <FaHistory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No points history</h3>
              <p className="text-gray-500 mt-2">Start ordering to earn points!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserRewards; 