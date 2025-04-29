import { useState, useEffect } from 'react';
import { Card, Button, Progress, Alert, Spinner, Tabs, TabsList, TabsTrigger, TabsContent, Badge } from '../ui';
import { userAPI } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import { FaTrophy, FaHistory, FaGift, FaInfoCircle, FaExchangeAlt, FaChartLine, FaStar } from 'react-icons/fa';

const LoyaltyDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [loyaltyData, setLoyaltyData] = useState({
    currentPoints: 0,
    tier: 'BRONZE',
    lifetimePoints: 0,
    pointsToNextTier: 0,
    history: []
  });
  const [rewards, setRewards] = useState([
    { id: 1, name: 'Rs. 50 off your order', pointsRequired: 500, value: 50, description: 'Get Rs. 50 off on your next order', validDays: 30 },
    { id: 2, name: 'Rs. 100 off your order', pointsRequired: 1000, value: 100, description: 'Get Rs. 100 off on your next order', validDays: 30 },
    { id: 3, name: 'Rs. 200 off your order', pointsRequired: 2000, value: 200, description: 'Get Rs. 200 off on your next order', validDays: 30 },
    { id: 4, name: 'Free delivery', pointsRequired: 300, value: 'free_delivery', description: 'Get free delivery on your next order', validDays: 30 }
  ]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pointsAnalytics, setPointsAnalytics] = useState({
    earnedThisMonth: 0,
    redeemedThisMonth: 0,
    totalEarned: 0,
    totalRedeemed: 0,
    averagePointsPerOrder: 0,
    expiringPoints: 0
  });

  // Tier definitions
  const tiers = {
    BRONZE: { 
      name: 'Bronze', 
      threshold: 0, 
      color: 'bg-amber-600', 
      textColor: 'text-amber-800',
      nextTier: 'SILVER',
      nextThreshold: 5000,
      benefits: ['Basic loyalty points', 'Standard rewards catalog']
    },
    SILVER: { 
      name: 'Silver', 
      threshold: 5000, 
      color: 'bg-gray-400', 
      textColor: 'text-gray-700',
      nextTier: 'GOLD',
      nextThreshold: 15000,
      benefits: ['10% bonus points on orders', 'Exclusive monthly offers', 'Priority customer support']
    },
    GOLD: { 
      name: 'Gold', 
      threshold: 15000, 
      color: 'bg-yellow-400', 
      textColor: 'text-yellow-700',
      nextTier: 'PLATINUM',
      nextThreshold: 30000,
      benefits: ['15% bonus points on orders', 'Special occasion rewards', 'Premium rewards catalog', 'Dedicated customer line']
    },
    PLATINUM: { 
      name: 'Platinum', 
      threshold: 30000, 
      color: 'bg-slate-700', 
      textColor: 'text-slate-300',
      nextTier: null,
      nextThreshold: null,
      benefits: ['20% bonus points on orders', 'Priority delivery', 'Exclusive events and tastings', 'Personal account manager']
    }
  };

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the updated endpoint for getting loyalty points
      const pointsResponse = await userAPI.getLoyaltyPoints();
      
      // Call the endpoint for loyalty history
      const historyResponse = await userAPI.getLoyaltyHistory();
      
      if (pointsResponse.data.success) {
        const pointsData = pointsResponse.data.data;
        const currentTier = pointsData.tier || 'BRONZE';
        const nextTierInfo = tiers[currentTier].nextTier ? tiers[tiers[currentTier].nextTier] : null;
        
        // Validate tier to ensure it's a valid key
        const validTier = tiers[currentTier] ? currentTier : 'BRONZE';
        
        setLoyaltyData(prevData => ({
          ...prevData,
          currentPoints: pointsData.points || 0,
          tier: validTier, // Use validated tier
          lifetimePoints: pointsData.lifetimePoints || 0
        }));
        
        if (nextTierInfo) {
          const pointsToNextTier = nextTierInfo.threshold - pointsData.lifetimePoints;
          setLoyaltyData(prevData => ({
            ...prevData,
            pointsToNextTier: Math.max(0, pointsToNextTier)
          }));
        } else {
          // Handle case where user is at the highest tier
          setLoyaltyData(prevData => ({
            ...prevData,
            pointsToNextTier: 0 
          }));
        }
      } else {
         // Handle failure: set default data or show specific error
         setLoyaltyData({
           currentPoints: 0,
           tier: 'BRONZE',
           lifetimePoints: 0,
           pointsToNextTier: tiers.BRONZE.nextThreshold, // Points to reach Silver
           history: []
         });
         setError('Failed to load loyalty points data.');
      }
      
      if (historyResponse.data.success) {
        const history = historyResponse.data.data || [];
        setLoyaltyData(prevData => ({
          ...prevData,
          history: history
        }));
        
        // Calculate analytics
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        
        let earnedThisMonth = 0;
        let redeemedThisMonth = 0;
        let totalEarned = 0;
        let totalRedeemed = 0;
        let orderCount = 0;
        let expiringPoints = 0;
        
        // Process transaction history
        history.forEach(transaction => {
          const transactionDate = new Date(transaction.date || transaction.createdAt);
          const isThisMonth = transactionDate.getMonth() === thisMonth && 
                             transactionDate.getFullYear() === thisYear;
          
          // Check if transaction is for points earned or redeemed
          const isEarned = transaction.type === 'EARN' || transaction.type === 'earned' || 
                          transaction.action === 'earned';
          
          if (isEarned) {
            totalEarned += Math.abs(transaction.points);
            if (isThisMonth) earnedThisMonth += Math.abs(transaction.points);
            
            // Check if this is related to an order
            const orderRelated = transaction.description?.toLowerCase().includes('order') || 
                                transaction.reason?.toLowerCase().includes('order');
            if (orderRelated) orderCount++;
            
            // Check for expiring points
            if (transaction.expiryDate) {
              const expiryDate = new Date(transaction.expiryDate);
              const daysToExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
              
              if (daysToExpiry > 0 && daysToExpiry <= 30) {
                expiringPoints += Math.abs(transaction.points);
              }
            }
          } else {
            totalRedeemed += Math.abs(transaction.points);
            if (isThisMonth) redeemedThisMonth += Math.abs(transaction.points);
          }
        });
        
        setPointsAnalytics({
          earnedThisMonth,
          redeemedThisMonth,
          totalEarned,
          totalRedeemed,
          averagePointsPerOrder: orderCount > 0 ? Math.round(totalEarned / orderCount) : 0,
          expiringPoints
        });
      }
      
      // Fetch available rewards if endpoint is available
      try {
        const rewardsResponse = await userAPI.getLoyaltyRewards();
        if (rewardsResponse.data.success) {
          setRewards(rewardsResponse.data.data);
        }
      } catch {
        // If rewards API fails, we'll use the default rewards defined in state
        console.log('Using default rewards as rewards API failed or is not available');
      }
    } catch (err) {
      console.error('Error fetching loyalty data:', err);
      setError('An error occurred while fetching your loyalty points data');
    } finally {
      setLoading(false);
    }
  };

  // Filter rewards based on user's tier
  const getAvailableRewards = () => {
    const currentTierIndex = Object.keys(tiers).indexOf(loyaltyData.tier);
    
    return rewards.filter(reward => {
      // If reward has no minTier, it's available to all
      if (!reward.minTier) return true;
      
      const requiredTierIndex = Object.keys(tiers).indexOf(reward.minTier);
      
      // If the minTier is invalid or user's tier is high enough
      return requiredTierIndex === -1 || currentTierIndex >= requiredTierIndex;
    });
  };

  const availableRewards = getAvailableRewards(); // Calculate available rewards

  const getPointsToNextReward = () => {
    // Use availableRewards for calculation
    const sortedRewards = [...availableRewards].sort((a, b) => a.pointsRequired - b.pointsRequired);
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
  
  // Calculate tier progress percentage
  const getTierProgressPercentage = () => {
    const currentTier = loyaltyData.tier || 'BRONZE';
    const tierInfo = tiers[currentTier];
    
    // If at highest tier, return 100%
    if (!tierInfo.nextTier) return 100;
    
    const nextTierThreshold = tierInfo.nextThreshold;
    const startThreshold = tierInfo.threshold;
    const totalRange = nextTierThreshold - startThreshold;
    const progress = loyaltyData.lifetimePoints - startThreshold;
    
    return Math.min(100, Math.round((progress / totalRange) * 100));
  };

  const handleRedeemPoints = async (reward) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Check if user has enough points
      if (loyaltyData.currentPoints < reward.pointsRequired) {
        setError(`You need ${reward.pointsRequired - loyaltyData.currentPoints} more points to redeem this reward.`);
        setLoading(false);
        return;
      }
      
      // Call the API to redeem points
      const response = await userAPI.redeemLoyaltyPoints(reward.pointsRequired, reward.id);
      
      if (response.data.success) {
        setSuccess(`Successfully redeemed ${reward.name} for ${reward.pointsRequired} points!`);
        
        // Update current points
        setLoyaltyData(prevData => ({
          ...prevData,
          currentPoints: prevData.currentPoints - reward.pointsRequired
        }));
        
        // Refresh loyalty data to get updated history
        fetchLoyaltyData();
      } else {
        setError(response.data.message || 'Failed to redeem points');
      }
    } catch (err) {
      console.error('Error redeeming points:', err);
      setError('An error occurred while redeeming your points. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !loyaltyData.currentPoints && !loyaltyData.history.length) {
    return (
      <div className="flex flex-col items-center justify-center p-10">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-500">Loading your loyalty points...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          {success}
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <FaTrophy className="w-4 h-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <FaGift className="w-4 h-4" /> Rewards
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FaHistory className="w-4 h-4" /> History
          </TabsTrigger>
        </TabsList>
      
        <TabsContent value="dashboard" className="pt-4 space-y-6">
          {/* Current Tier Card */}
          <Card className="p-6 overflow-hidden relative">
            <div className={`absolute top-0 left-0 right-0 h-2 ${tiers[loyaltyData.tier].color}`}></div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <span className={`text-sm font-medium ${tiers[loyaltyData.tier].textColor}`}>
                  {tiers[loyaltyData.tier].name} Tier
                </span>
                <h3 className="text-3xl font-bold mt-1">
                  {loyaltyData.currentPoints}
                  <span className="ml-1 text-lg font-normal text-gray-500">Points</span>
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Lifetime: {loyaltyData.lifetimePoints} points
                </p>
              </div>
              
              <div className="mt-4 md:mt-0">
                {pointsAnalytics.expiringPoints > 0 && (
                  <div className="flex items-center text-amber-600 mb-2 text-sm">
                    <FaInfoCircle className="mr-1" />
                    <span>{pointsAnalytics.expiringPoints} points expiring soon</span>
                  </div>
                )}
                <Button
                  variant="outline" 
                  className="w-full md:w-auto"
                  onClick={() => setActiveTab('rewards')}
                >
                  Redeem Points
                </Button>
              </div>
            </div>
            
            {/* Active Benefits Section - Added */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <FaStar className="text-yellow-500" /> Active Tier Benefits:
              </h4>
              <div className="flex flex-wrap gap-2">
                {tiers[loyaltyData.tier]?.benefits?.slice(0, 2).map((benefit, index) => ( // Show first 2 benefits
                  <Badge key={index} variant="secondary" className="text-xs">
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>

            {tiers[loyaltyData.tier]?.nextTier && ( // Check if tier exists before accessing nextTier
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-1">
                  <span>{tiers[loyaltyData.tier]?.name || 'Bronze'}</span> {/* Fallback */}
                  <span>{tiers[tiers[loyaltyData.tier]?.nextTier]?.name || ''}</span> {/* Fallback */}
                </div>
                <Progress value={getTierProgressPercentage()} className="h-2" />
                <p className="mt-2 text-sm text-gray-500">
                  {loyaltyData.pointsToNextTier > 0 ? (
                    <span>Earn {loyaltyData.pointsToNextTier} more lifetime points to reach {tiers[tiers[loyaltyData.tier]?.nextTier]?.name || ''}</span>
                  ) : (
                    <span>You&apos;ll soon be upgraded to {tiers[tiers[loyaltyData.tier]?.nextTier]?.name || ''}!</span>
                  )}
                </p>
              </div>
            )}
          </Card>
          
          {/* Points Summary */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Earned This Month</p>
                  <p className="text-2xl font-bold mt-1">{pointsAnalytics.earnedThisMonth}</p>
                </div>
                <span className="p-2 rounded-full bg-green-100 text-green-600">
                  <FaChartLine className="w-4 h-4" />
                </span>
              </div>
            </Card>
            
            <Card className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Redeemed This Month</p>
                  <p className="text-2xl font-bold mt-1">{pointsAnalytics.redeemedThisMonth}</p>
                </div>
                <span className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <FaExchangeAlt className="w-4 h-4" />
                </span>
              </div>
            </Card>
            
            <Card className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Avg. Points Per Order</p>
                  <p className="text-2xl font-bold mt-1">{pointsAnalytics.averagePointsPerOrder}</p>
                </div>
                <span className="p-2 rounded-full bg-purple-100 text-purple-600">
                  <FaTrophy className="w-4 h-4" />
                </span>
              </div>
            </Card>
          </div>
          
          {/* Next Reward Progress */}
          {nextRewardInfo && (
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Next Reward</h3>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <FaGift className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-grow">
                  <p className="font-medium">{nextRewardInfo.reward.name}</p>
                  <Progress 
                    value={getProgressPercentage()} 
                    className="h-2 mt-2 bg-primary/20" 
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {nextRewardInfo.pointsNeeded} more points needed
                  </p>
                </div>
              </div>
            </Card>
          )}
          
          {/* Tier Benefits */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Your Tier Benefits</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tiers[loyaltyData.tier].color}`}>
                <FaTrophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className={`font-semibold ${tiers[loyaltyData.tier].textColor}`}>{tiers[loyaltyData.tier].name} Tier</p>
                <p className="text-sm text-gray-500">
                  {tiers[loyaltyData.tier].nextTier ? 
                    `Next tier: ${tiers[tiers[loyaltyData.tier].nextTier].name} at ${tiers[tiers[loyaltyData.tier].nextTier].threshold.toLocaleString()} lifetime points` : 
                    'Highest tier achieved!'
                  }
                </p>
              </div>
            </div>
            
            <ul className="ml-4 space-y-2 list-disc text-gray-600">
              {tiers[loyaltyData.tier].benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
          </Card>
        </TabsContent>
        
        <TabsContent value="rewards" className="pt-4 space-y-6">
          <h3 className="text-xl font-semibold mb-4">Available Rewards</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {rewards.map(reward => (
              <Card key={reward.id} className="overflow-hidden">
                <div className="p-5 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-medium">{reward.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{reward.description}</p>
                    </div>
                    <Badge variant={loyaltyData.currentPoints >= reward.pointsRequired ? "default" : "outline"}>
                      {reward.pointsRequired} Points
                    </Badge>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Valid for {reward.validDays} days after redemption
                  </span>
                  <Button
                    disabled={loyaltyData.currentPoints < reward.pointsRequired || loading}
                    onClick={() => handleRedeemPoints(reward)}
                    variant={loyaltyData.currentPoints >= reward.pointsRequired ? "default" : "outline"}
                    size="sm"
                  >
                    {loading ? <Spinner size="sm" /> : 'Redeem'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          
          {rewards.length === 0 && (
            <Card className="p-6 text-center">
              <p className="text-gray-500">No rewards available at the moment.</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="pt-4 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Points History</h3>
            <Button variant="outline" size="sm" onClick={fetchLoyaltyData} className="gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
          
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Points</th>
                    <th className="px-4 py-3 text-left font-medium">Transaction</th>
                    <th className="px-4 py-3 text-left font-medium">Description</th>
                    <th className="px-4 py-3 text-left font-medium">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {loyaltyData.history.length > 0 ? (
                    loyaltyData.history.map((record, index) => {
                      // Determine if this is a earn or redeem transaction
                      const isEarn = record.type === 'EARN' || record.type === 'earned' || record.action === 'earned';
                      
                      // Calculate expiry info if available
                      let expiryInfo = null;
                      if (record.expiryDate && isEarn) {
                        const expiryDate = new Date(record.expiryDate);
                        const now = new Date();
                        const daysToExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                        
                        if (daysToExpiry > 0) {
                          expiryInfo = `${daysToExpiry} days`;
                        } else {
                          expiryInfo = 'Expired';
                        }
                      }
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3">{formatDate(record.date || record.createdAt)}</td>
                          <td className={`px-4 py-3 font-medium ${isEarn ? 'text-green-600' : 'text-red-600'}`}>
                            {isEarn ? '+' : '-'}{Math.abs(record.points)}
                          </td>
                          <td className="px-4 py-3 capitalize">
                            {record.type || record.action || 'Unknown'}
                          </td>
                          <td className="px-4 py-3">
                            {record.description || record.reason || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            {expiryInfo || 'N/A'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-3 text-center text-gray-500">
                        No points history found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* How Points Work */}
      <Card className="p-6 mt-8">
        <h3 className="flex items-center mb-3 text-lg font-semibold">
          <FaInfoCircle className="mr-2 text-gray-400" /> How Points Work
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h4 className="text-md font-medium mb-2">Earning Points</h4>
            <ul className="ml-6 space-y-2 list-disc text-gray-600 dark:text-gray-300 text-sm">
              <li>Earn 10 points for every Rs. 100 spent on orders</li>
              <li>Earn bonus points based on your loyalty tier</li>
              <li>Complete your profile to earn one-time bonus points</li>
              <li>Earn points for reviewing your orders</li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-medium mb-2">Redeeming Points</h4>
            <ul className="ml-6 space-y-2 list-disc text-gray-600 dark:text-gray-300 text-sm">
              <li>Redeem for discounts on your next order</li>
              <li>Points are valid for 12 months from the date earned</li>
              <li>Higher tiers unlock exclusive rewards</li>
              <li>Check the rewards tab for all available redemption options</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoyaltyDashboard; 