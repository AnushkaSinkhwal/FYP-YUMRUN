import { useState, useEffect } from 'react';
import { reviewAPI } from '../../utils/api'; // Adjust path if needed
import ReviewList from '../../components/reviews/ReviewList'; // Adjust path if needed
import { Alert, Spinner, Card } from '../../components/ui'; // Adjust path if needed

const RestaurantReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurantReviews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // This endpoint should be protected by middleware ensuring only the owner can access
        const response = await reviewAPI.getMyRestaurantReviews();
        if (response.data && response.data.success) {
          setReviews(response.data.data.reviews);
        } else {
          throw new Error(response.data?.message || 'Failed to fetch restaurant reviews');
        }
      } catch (err) {
        console.error("Error fetching restaurant reviews:", err);
        setError(err.response?.data?.message || err.message || 'Could not load reviews for your restaurant.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantReviews();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Reviews for Your Restaurant</h1>

      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <Spinner size="lg" />
        </div>
      )}

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {!isLoading && !error && (
        <Card className="p-4 md:p-6">
          {reviews.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No reviews have been submitted for your items yet.</p>
          ) : (
            // Pass reviews to ReviewList - it should show user and item details
            <ReviewList reviews={reviews} />
          )}
        </Card>
      )}
    </div>
  );
};

export default RestaurantReviews; 