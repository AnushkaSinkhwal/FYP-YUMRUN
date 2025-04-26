import { useState } from 'react';
import PropTypes from 'prop-types';
import { reviewAPI } from '../../utils/api';
import { Modal, Box, Typography, Rating, TextField, Button, CircularProgress, Alert } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const ReviewForm = ({ open, handleClose, orderId, menuItemId, foodName, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }

    setLoading(true);
    try {
      const reviewData = {
        orderId,
        menuItemId,
        rating,
        comment
      };
      await reviewAPI.createReview(reviewData);
      setSuccess('Review submitted successfully!');
      setLoading(false);
      if (onReviewSubmitted) {
        onReviewSubmitted(menuItemId); // Notify parent that review was added
      }
      // Optionally close modal after a delay
      setTimeout(() => {
         handleClose();
         // Reset form for next time
         setRating(0);
         setComment('');
         setSuccess(null);
      }, 1500);

    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to submit review. Please try again.';
      console.error("Review submission error:", err.response || err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Reset state when modal closes
  const handleModalClose = () => {
    handleClose();
    if (!success) { // Only reset if not showing success message
        setRating(0);
        setComment('');
        setError(null);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleModalClose}
      aria-labelledby="review-modal-title"
      aria-describedby="review-modal-description"
    >
      <Box sx={style}>
        <Typography id="review-modal-title" variant="h6" component="h2">
          Write a Review for {foodName || 'this item'}
        </Typography>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Typography component="legend" sx={{ mt: 2 }}>Your Rating*</Typography>
          <Rating
            name="simple-controlled"
            value={rating}
            onChange={(event, newValue) => {
              setRating(newValue);
            }}
            disabled={loading || success}
          />

          <TextField
            margin="normal"
            fullWidth
            id="comment"
            label="Comment (Optional)"
            name="comment"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={loading || success}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || success}
          >
            {loading ? <CircularProgress size={24} /> : 'Submit Review'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

ReviewForm.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  orderId: PropTypes.string.isRequired,
  menuItemId: PropTypes.string.isRequired,
  foodName: PropTypes.string, // Optional: name of the food item
  onReviewSubmitted: PropTypes.func, // Optional callback
};

export default ReviewForm; 