import { useState, useEffect } from 'react';
import { Card, Button, Alert } from '../ui';
import { userAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const LoyaltyPoints = () => {
  const { currentUser } = useAuth();
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Fetch user's loyalty points and history
    const fetchLoyaltyData = async () => {
      setLoading(true);
      setError('');

      try {
        // Get points from cached user data first
        if (currentUser && currentUser.loyaltyPoints !== undefined) {
          setPoints(currentUser.loyaltyPoints);
        }

        // Fetch fresh data from API
        const [pointsResponse, historyResponse] = await Promise.all([
          userAPI.getLoyaltyPoints(),
          userAPI.getLoyaltyHistory()
        ]);

        if (pointsResponse.data.success) {
          setPoints(pointsResponse.data.loyaltyPoints);
        }

        if (historyResponse.data.success) {
          setHistory(historyResponse.data.history);
        }

        // Fetch available rewards
        const rewardsResponse = await fetch('/api/loyalty/rewards');
        const rewardsData = await rewardsResponse.json();

        if (rewardsData.success) {
          setRewards(rewardsData.rewards);
        }
      } catch (err) {
        console.error('Error fetching loyalty data:', err);
        setError('Failed to fetch loyalty points data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchLoyaltyData();
  }, [currentUser]);

  const handleRedeemPoints = async (reward) => {
    // This would be used when implementing redemption functionality
    // For now, it's just a placeholder
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Check if user has enough points
      if (points < reward.pointsRequired) {
        setError(`You need ${reward.pointsRequired - points} more points to redeem this reward.`);
        return;
      }

      // Here you would call the API to redeem points
      setSuccess(`Successfully redeemed ${reward.name} for ${reward.pointsRequired} points!`);
      
      // Update points after redemption
      setPoints(prevPoints => prevPoints - reward.pointsRequired);
    } catch (err) {
      console.error('Error redeeming points:', err);
      setError('Failed to redeem points. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !points && !history.length) {
    return (
      <Card className="p-6">
        <div className="py-8 text-center">
          <p>Loading loyalty points data...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="mb-6 text-2xl font-bold">Your Loyalty Points</h2>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}
      
      <div className="p-4 mb-6 text-center rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="mb-1 text-lg font-medium">Current Balance</h3>
        <p className="text-3xl font-bold">{points}</p>
        <p className="mt-1 text-sm text-gray-500">
          Points
        </p>
      </div>
      
      <div className="mb-8">
        <h3 className="mb-3 text-lg font-semibold">Available Rewards</h3>
        {rewards.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {rewards.map((reward) => (
              <div 
                key={reward.id}
                className="p-4 transition-shadow border rounded-lg hover:shadow-md"
              >
                <h4 className="mb-2 font-medium">{reward.name}</h4>
                <p className="mb-3 text-sm text-gray-500">
                  {reward.pointsRequired} points
                </p>
                <Button
                  onClick={() => handleRedeemPoints(reward)}
                  disabled={points < reward.pointsRequired || loading}
                  size="sm"
                  className={points < reward.pointsRequired ? 'opacity-50' : ''}
                >
                  Redeem
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No rewards available at the moment.</p>
        )}
      </div>
      
      <div>
        <h3 className="mb-3 text-lg font-semibold">Points History</h3>
        {history.length > 0 ? (
          <div className="overflow-hidden border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                    Description
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-400">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {history.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.description || `${item.type === 'earned' ? 'Points earned' : 'Points redeemed'}`}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right ${item.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.points > 0 ? `+${item.points}` : item.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No points history yet.</p>
        )}
      </div>
      
      <div className="p-4 mt-8 rounded-lg bg-blue-50 dark:bg-blue-900">
        <h3 className="mb-2 text-lg font-medium text-blue-800 dark:text-blue-200">
          How to Earn Points
        </h3>
        <ul className="ml-4 space-y-1 text-sm text-blue-700 dark:text-blue-300">
          <li>Earn 10 points for every Rs.  100 spent</li>
          <li>Bonus points for ordering healthy options</li>
          <li>Double points on your birthday</li>
          <li>Refer friends to earn 100 points</li>
        </ul>
      </div>
    </Card>
  );
};

export default LoyaltyPoints; 