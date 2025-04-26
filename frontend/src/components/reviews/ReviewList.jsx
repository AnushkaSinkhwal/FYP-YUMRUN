import PropTypes from 'prop-types';
import { Rating } from '@mui/material'; // Assuming MUI is used for UI components like Rating
import { format } from 'date-fns'; // For formatting dates

const ReviewItem = ({ review }) => {
  return (
    <div className="border-b border-gray-200 py-4">
      <div className="flex items-center mb-2">
        {/* TODO: Add user profile image if available */}
        {/* <img src={review.user?.profileImage || '/default-avatar.png'} alt={review.user?.name} className="w-8 h-8 rounded-full mr-3" /> */}
        <div>
          <p className="font-semibold text-sm">{review.user?.name || 'Anonymous User'}</p>
          <p className="text-xs text-gray-500">
            {review.createdAt ? format(new Date(review.createdAt), 'PP') : ''}
          </p>
        </div>
      </div>
      <Rating value={review.rating} readOnly size="small" className="mb-1" />
      <p className="text-gray-700 text-sm">{review.comment}</p>
      {/* Add links or details about the reviewed item/restaurant if needed */}
      {review.menuItem && (
          <p className="text-xs text-gray-500 mt-1">Reviewed: {review.menuItem.item_name}</p>
      )}
      {review.restaurant && (
          <p className="text-xs text-gray-500 mt-1">From: {review.restaurant.name}</p>
      )}
    </div>
  );
};

ReviewItem.propTypes = {
  review: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    rating: PropTypes.number.isRequired,
    comment: PropTypes.string,
    createdAt: PropTypes.string.isRequired,
    user: PropTypes.shape({
      name: PropTypes.string,
      // profileImage: PropTypes.string,
    }),
    menuItem: PropTypes.shape({ // Optional, used in MyReviews/RestaurantReviews
        item_name: PropTypes.string,
    }),
    restaurant: PropTypes.shape({ // Optional, used in MyReviews
        name: PropTypes.string,
    }),
  }).isRequired,
};

const ReviewList = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return <p className="text-gray-600 text-sm py-4">No reviews yet.</p>;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Customer Reviews</h3>
      <div>
        {reviews.map((review) => (
          <ReviewItem key={review._id || review.id} review={review} />
        ))}
      </div>
      {/* TODO: Add pagination if needed */}
    </div>
  );
};

ReviewList.propTypes = {
  reviews: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default ReviewList; 