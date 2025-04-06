import { useState, useEffect } from 'react';
import { Card, Button, Input, Textarea, Alert, Spinner } from '../../components/ui';
import { FaSearch, FaStar, FaClock, FaUtensils, FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

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
    const fetchReviews = async () => {
      if (!isAuthenticated) {
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/reviews/user');
        
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setReviews(data.data.reviews || []);
        } else {
          throw new Error(data.error.message || 'Failed to fetch reviews');
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Unable to load reviews. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviews();
  }, [isAuthenticated]);

  const filteredReviews = reviews.filter(review =>
    review.menuItem?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.restaurant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditReview = (review) => {
    setEditingReview(review);
    setReviewText(review.comment);
    setRating(review.rating);
  };

  const handleSaveReview = async () => {
    if (!editingReview) return;
    
    try {
      const response = await fetch(`/api/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment: reviewText
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update review');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update the reviews state
        setReviews(reviews.map(review => 
          review.id === editingReview.id
            ? { ...review, rating, comment: reviewText }
            : review
        ));
        setEditingReview(null);
      } else {
        throw new Error(data.error?.message || 'Failed to update review');
      }
    } catch (err) {
      console.error('Error updating review:', err);
      setError('Failed to update review. Please try again.');
    }
  };

  const handleDeleteReview = async (id) => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete review');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the deleted review from state
        setReviews(reviews.filter(review => review.id !== id));
      } else {
        throw new Error(data.error?.message || 'Failed to delete review');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      setError('Failed to delete review. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Reviews</h1>
        <div className="relative w-64">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('all')}
        >
          All Reviews
        </Button>
        <Button
          variant={activeTab === 'recent' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('recent')}
        >
          Recent Reviews
        </Button>
      </div>

      <div className="space-y-6">
        {filteredReviews.map(review => (
          <Card key={review.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <img
                  src={review.menuItem?.image || `https://source.unsplash.com/random/300x200/?food`}
                  alt={review.menuItem?.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-semibold text-lg">{review.menuItem?.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <FaStar className="text-yellow-400" />
                    <span>{review.rating}</span>
                    <span>•</span>
                    <FaClock className="text-gray-400" />
                    <span>{new Date(review.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <FaUtensils className="text-gray-400" />
                    <span>{review.restaurant?.name}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditReview(review)}
                >
                  <FaEdit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => handleDeleteReview(review.id)}
                >
                  <FaTrash className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {editingReview?.id === review.id ? (
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
                      <FaStar className="h-5 w-5" />
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
                    onClick={() => setEditingReview(null)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveReview}>
                    Save Review
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-gray-600">{review.comment}</p>
            )}
          </Card>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <div className="text-center py-12">
          <FaStar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No reviews yet</h3>
          <p className="text-gray-500 mt-2">Start reviewing your orders!</p>
        </div>
      )}
    </div>
  );
};

export default UserReviews; 