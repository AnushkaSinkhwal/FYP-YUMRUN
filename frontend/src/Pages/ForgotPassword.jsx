import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { Button, Input, Label, Alert, Container } from '../components/ui';
import Logo from '../assets/images/logo.png'; // Assuming logo path

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.forgotPassword({ email });
      
      // Check explicit success flag or response data structure
      if (response.data?.success) {
          setMessage('Password reset instructions have been sent to your email.');
          // Optional: Redirect after a delay or keep user on page
          // setTimeout(() => navigate('/signin'), 7000); 
      } else {
          // Handle specific errors from backend if available
          const errorMsg = response.data?.message || response.data?.error?.message || 'Failed to send reset instructions. Please try again.';
          setError(errorMsg);
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error?.message || 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-white to-[#ffe9e2] p-5">
      <Container className="max-w-md">
        <div className="p-8 overflow-hidden bg-white rounded-lg shadow-xl">
          <div className="flex justify-center mb-6">
            <Link to="/">
              <img src={Logo} alt="YumRun Logo" className="max-w-[100px]" />
            </Link>
          </div>
          
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-xl font-bold text-gray-800">Forgot Your Password?</h1>
            <p className="text-sm text-gray-600">Enter your email address below and we&apos;ll send you instructions to reset your password.</p>
          </div>

          {message && (
            <Alert variant="success" className="mb-4">
              {message}
            </Alert>
          )}

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading || !!message} // Disable if loading or success message shown
                className="w-full"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || !!message} // Disable if loading or success message shown
              className="w-full bg-yumrun-primary hover:bg-yumrun-secondary"
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </Button>
          </form>

          <div className="mt-6 text-sm text-center text-gray-600">
            Remember your password?{' '}
            <Link to="/signin" className="font-medium text-yumrun-primary hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ForgotPassword; 