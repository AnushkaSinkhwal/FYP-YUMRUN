import { useState, useEffect } from 'react';
import { Card, Button, Alert } from '../ui';
import { userAPI } from '../../utils/api';

const LoyaltyPoints = () => {
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchLoyaltyData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch unified loyalty info and available rewards
        const [infoRes, rewardsRes] = await Promise.all([
          userAPI.getLoyaltyInfo(),
          userAPI.getLoyaltyRewards()
        ]);
        if (infoRes.data.success) {
          const { currentPoints, history: infoHistory } = infoRes.data.data;
          setPoints(currentPoints);
          setHistory(infoHistory || []);
        }
        if (rewardsRes.data.success) {
          setRewards(rewardsRes.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching loyalty data:', err);
        setError('Failed to fetch loyalty points data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchLoyaltyData();
  }, []);

  const handleRedeemPoints = async (pointsRequired, rewardId) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      // Perform redemption API call
      const res = await userAPI.redeemLoyaltyPoints(pointsRequired, rewardId);
      if (res.data.success) {
        setSuccess(res.data.message || 'Points redeemed successfully!');
        // Refresh loyalty data
        const info = await userAPI.getLoyaltyInfo();
        if (info.data.success) {
          const { currentPoints, history: updatedHistory } = info.data.data;
          setPoints(currentPoints);
          setHistory(updatedHistory || []);
        }
      } else {
        setError(res.data.error?.message || 'Failed to redeem points');
      }
    } catch (err) {
      console.error('Error redeeming points:', err);
      setError(err.response?.data?.error?.message || 'Failed to redeem points. Please try again.');
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
                key={reward._id}
                className="p-4 transition-shadow border rounded-lg hover:shadow-md"
              >
                <h4 className="mb-2 font-medium">{reward.name}</h4>
                <p className="mb-3 text-sm text-gray-500">
                  {reward.pointsRequired} points
                </p>
                <Button
                  onClick={() => handleRedeemPoints(reward.pointsRequired, reward._id)}
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
                {history.map((item) => (
                  <tr key={item._id}>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.description}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right ${item.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.points >= 0 ? `+${item.points}` : item.points}
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