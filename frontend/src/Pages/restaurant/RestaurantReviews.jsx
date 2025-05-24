import { useState, useEffect } from 'react';
import { reviewAPI } from '../../utils/api'; // Adjust path if needed
import { ReviewItem } from '../../components/reviews/ReviewList';
import { Alert, Spinner, Card, Button } from '../../components/ui'; // Adjust path if needed

const RestaurantReviews = () => {
  const [replyTexts, setReplyTexts] = useState({});
  const [replyError, setReplyError] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleReplySubmit = async (reviewId) => {
    setReplyError(null);
    try {
      const response = await reviewAPI.replyToReview(reviewId, { reply: replyTexts[reviewId] });
      if (response.data && response.data.success) {
        setReviews(prev => prev.map(r => r._id === reviewId ? response.data.data.review : r));
        setReplyTexts(prev => ({ ...prev, [reviewId]: '' }));
      } else {
        setReplyError(response.data?.error?.message || 'Failed to submit reply');
      }
    } catch (err) {
      console.error('Error submitting reply:', err);
      setReplyError(err.response?.data?.error?.message || err.message || 'Server error while replying');
    }
  };

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
            reviews.map(review => (
              <div key={review._id} className="py-4 border-b border-gray-200">
                <ReviewItem review={review} />
                {!review.reply && (
                  <div className="mt-2">
                    {replyError && <Alert variant="error" className="mb-2">{replyError}</Alert>}
                    <textarea
                      value={replyTexts[review._id] || ''}
                      onChange={e => setReplyTexts(prev => ({ ...prev, [review._id]: e.target.value }))}
                      className="w-full p-2 border rounded mb-2"
                      placeholder="Write your reply..."
                    />
                    <Button
                      onClick={() => handleReplySubmit(review._id)}
                      disabled={!replyTexts[review._id]}
                      className="ml-auto"
                    >
                      Submit Reply
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  );
};

export default RestaurantReviews; 