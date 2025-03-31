import { useState } from 'react';
import { Card, Button, Input, Textarea } from '../../components/ui';
import { FaSearch, FaStar, FaClock, FaUtensils, FaMapMarkerAlt, FaEdit, FaTrash } from 'react-icons/fa';

const UserReviews = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [editingReview, setEditingReview] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);

  // Sample data - replace with API data
  const reviews = [
    {
      id: 1,
      restaurant: "Burger Palace",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      rating: 4.5,
      text: "Great burgers and fast delivery! The fries were crispy and the service was excellent.",
      date: "2024-03-15",
      orderNumber: "ORD-123456",
      cuisine: "American",
      address: "123 Food Street, City"
    },
    {
      id: 2,
      restaurant: "Pizza Express",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      rating: 5,
      text: "Best pizza in town! The crust was perfect and the toppings were fresh.",
      date: "2024-03-10",
      orderNumber: "ORD-123457",
      cuisine: "Italian",
      address: "456 Pizza Avenue, City"
    }
  ];

  const filteredReviews = reviews.filter(review =>
    review.restaurant.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditReview = (review) => {
    setEditingReview(review);
    setReviewText(review.text);
    setRating(review.rating);
  };

  const handleSaveReview = () => {
    // TODO: Implement API call to update review
    setEditingReview(null);
  };

  const handleDeleteReview = (id) => {
    // TODO: Implement API call to delete review
    console.log('Delete review:', id);
  };

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
                  src={review.image}
                  alt={review.restaurant}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-semibold text-lg">{review.restaurant}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <FaStar className="text-yellow-400" />
                    <span>{review.rating}</span>
                    <span>•</span>
                    <FaClock className="text-gray-400" />
                    <span>{new Date(review.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <FaUtensils className="text-gray-400" />
                    <span>{review.cuisine}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <FaMapMarkerAlt className="text-gray-400" />
                    <span>{review.address}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Order #{review.orderNumber}</p>
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
              <p className="mt-4 text-gray-600">{review.text}</p>
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