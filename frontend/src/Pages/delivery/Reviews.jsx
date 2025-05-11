import { useState, useEffect } from 'react';
import { deliveryAPI } from '../../utils/api';
import ReviewList from '../../components/reviews/ReviewList';
import { Spinner, Alert } from '../../components/ui';

const DeliveryReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const response = await deliveryAPI.getReviews();
        if (response.data && response.data.success) {
          setReviews(response.data.reviews);
        } else {
          setError(response.data.message || 'Failed to load reviews.');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error fetching reviews.');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  if (error) return <Alert variant="error">{error}</Alert>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Reviews</h1>
      <ReviewList reviews={reviews} />
    </div>
  );
};

export default DeliveryReviews; 