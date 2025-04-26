import { useState, useEffect } from 'react';
import { reviewAPI } from '../../utils/api';
import ReviewList from '../../components/reviews/ReviewList';
import { Alert, Spinner, Card } from '../../components/ui';

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await reviewAPI.getMyReviews();
        if (response.data && response.data.success) {
          setReviews(response.data.data.reviews);
        } else {
          throw new Error(response.data?.message || 'Failed to fetch reviews');
        }
      } catch (err) {
        console.error("Error fetching user reviews:", err);
        setError(err.response?.data?.message || err.message || 'Could not load your reviews.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Reviews</h1>

      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <Spinner size="lg" />
        </div>
      )}

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {!isLoading && !error && (
        <Card className="p-4 md:p-6">
          {reviews.length === 0 ? (
            <p className="text-gray-600 text-center py-4">You haven&apos;t written any reviews yet.</p>
          ) : (
            <ReviewList reviews={reviews} />
          )}
        </Card>
      )}

      {/* Optionally add links to edit/delete reviews if functionality is added */}
    </div>
  );
};

export default MyReviews; 