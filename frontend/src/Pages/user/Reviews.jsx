import { useState, useEffect } from 'react';
import { Card, Button, Input, Textarea, Alert, Spinner, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { FaSearch, FaStar, FaClock, FaUtensils, FaEdit, FaTrash, FaCommentAlt, FaSync } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getFullImageUrl, PLACEHOLDERS } from '../../utils/imageUtils';

const UserReviews = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [editingReview, setEditingReview] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  
  // Fetch reviews from API
  useEffect(() => {
    fetchReviews();
  }, [isAuthenticated]);

  const fetchReviews = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching reviews...');
      const response = await api.get('/reviews/user');
      console.log('Reviews response:', response);
      
      if (response.data && response.data.success) {
        if (response.data.data && Array.isArray(response.data.data.reviews)) {
          setReviews(response.data.data.reviews);
          console.log('Reviews set:', response.data.data.reviews);
        } else {
          console.error('Invalid reviews data format:', response.data);
          setReviews([]);
        }
      } else {
        throw new Error(response.data?.error?.message || 'Failed to fetch reviews');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Unable to load reviews. Please try again later.');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (!review) return false;
    
    // Basic validation
    const menuItemName = review.menuItem?.name || '';
    const restaurantName = review.restaurant?.name || '';
    
    return menuItemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (review.comment || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get reviews for active tab
  const getReviewsForTab = () => {
    if (activeTab === 'all') {
      return filteredReviews;
    } else if (activeTab === 'recent') {
      // Sort by date and get most recent (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      return filteredReviews
        .filter(review => new Date(review.date) >= thirtyDaysAgo)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return filteredReviews;
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setReviewText(review.comment || '');
    setRating(review.rating || 5);
  };

  const handleSaveReview = async () => {
    if (!editingReview) return;
    
    try {
      const response = await api.put(`/reviews/${editingReview.id}`, {
        rating,
        comment: reviewText
      });
      
      if (response.data && response.data.success) {
        // Update the reviews state
        setReviews(reviews.map(review => 
          review.id === editingReview.id
            ? { ...review, rating, comment: reviewText }
            : review
        ));
        setEditingReview(null);
      } else {
        throw new Error(response.data?.error?.message || 'Failed to update review');
      }
    } catch (err) {
      console.error('Error updating review:', err);
      setError('Failed to update review. Please try again.');
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }
    
    try {
      const response = await api.delete(`/reviews/${id}`);
      
      if (response.data && response.data.success) {
        // Remove the deleted review from state
        setReviews(reviews.filter(review => review.id !== id));
      } else {
        throw new Error(response.data?.error?.message || 'Failed to delete review');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      setError('Failed to delete review. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-gray-500">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  const displayedReviews = getReviewsForTab();

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <h1 className="text-2xl font-bold">My Reviews</h1>
        <div className="relative w-full md:w-64">
          <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <Input
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Reviews</TabsTrigger>
          <TabsTrigger value="recent">Recent Reviews</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-6">
          {displayedReviews.length > 0 ? (
            displayedReviews.map(review => (
              <ReviewCard 
                key={review.id}
                review={review}
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
                editingReview={editingReview}
                reviewText={reviewText}
                setReviewText={setReviewText}
                rating={rating}
                setRating={setRating}
                onSave={handleSaveReview}
              />
            ))
          ) : (
            <EmptyReviews searchQuery={searchQuery} />
          )}
        </TabsContent>
        
        <TabsContent value="recent" className="space-y-6">
          {displayedReviews.length > 0 ? (
            displayedReviews.map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
                editingReview={editingReview}
                reviewText={reviewText}
                setReviewText={setReviewText}
                rating={rating}
                setRating={setRating}
                onSave={handleSaveReview}
              />
            ))
          ) : (
            <EmptyReviews searchQuery={searchQuery} />
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-center">
        <Button variant="outline" onClick={fetchReviews} className="gap-2">
          <FaSync className="w-4 h-4" />
          Refresh Reviews
        </Button>
      </div>
    </div>
  );
};

// Helper component for individual review cards
const ReviewCard = ({ 
  review, 
  onEdit, 
  onDelete, 
  editingReview, 
  reviewText, 
  setReviewText, 
  rating, 
  setRating, 
  onSave 
}) => {
  const isEditing = editingReview?.id === review.id;
  
  return (
    <Card key={review.id} className="p-6 transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
            <img
              src={getFullImageUrl(review.menuItem?.imageUrl)}
              alt={review.menuItem?.name || 'Food item'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = PLACEHOLDERS.FOOD;
              }}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {review.menuItem?.name || 'Food Item'}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <FaStar className="text-yellow-400" />
              <span>{review.rating}</span>
              <span>•</span>
              <FaClock className="text-gray-400" />
              <span>{new Date(review.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <FaUtensils className="text-gray-400" />
              <span>{review.restaurant?.name || 'Restaurant'}</span>
            </div>
            {review.orderId && (
              <div className="mt-2">
                <Link to={`/order/${review.orderId}`}>
                  <Button variant="link" className="h-auto p-0 text-sm text-blue-500 underline">
                    View Order
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(review)}
            title="Edit Review"
          >
            <FaEdit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-600"
            onClick={() => onDelete(review.id)}
            title="Delete Review"
          >
            <FaTrash className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                variant="ghost"
                size="icon"
                onClick={() => setRating(star)}
                className={star <= rating ? 'text-yellow-400' : 'text-gray-400'}
              >
                <FaStar className="w-5 h-5" />
              </Button>
            ))}
          </div>
          <Textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={4}
            placeholder="Write your review..."
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onEdit(null)}
            >
              Cancel
            </Button>
            <Button onClick={onSave}>
              Save Review
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          {review.comment ? (
            <p className="p-4 text-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-gray-300">
              &quot;{review.comment}&quot;
            </p>
          ) : (
            <p className="mt-2 italic text-gray-400">No comment provided</p>
          )}
        </div>
      )}
    </Card>
  );
};

ReviewCard.propTypes = {
  review: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  editingReview: PropTypes.object,
  reviewText: PropTypes.string.isRequired,
  setReviewText: PropTypes.func.isRequired,
  rating: PropTypes.number.isRequired,
  setRating: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

// Helper component for empty reviews state
const EmptyReviews = ({ searchQuery }) => {
  return (
    <div className="py-12 text-center rounded-lg bg-gray-50 dark:bg-gray-800">
      <FaCommentAlt className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      {searchQuery ? (
        <>
          <h3 className="text-lg font-semibold">No matching reviews</h3>
          <p className="mt-2 text-gray-500">Try adjusting your search criteria</p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold">No reviews yet</h3>
          <p className="mt-2 mb-6 text-gray-500">
            After ordering from restaurants, you can leave reviews to help others!
          </p>
          <Button asChild>
            <Link to="/user/orders">View My Orders</Link>
          </Button>
        </>
      )}
    </div>
  );
};

EmptyReviews.propTypes = {
  searchQuery: PropTypes.string
};

export default UserReviews; 