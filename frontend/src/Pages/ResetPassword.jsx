import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { Button, Input, Label, Alert, Container } from '../components/ui';
import Logo from '../assets/images/logo.png'; // Assuming logo path

const ResetPassword = () => {
  const { token } = useParams(); // Get token from URL
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Basic validation on load (can add more robust token validation if needed)
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing password reset token.');
      // Consider redirecting if token is clearly invalid
      // setTimeout(() => navigate('/forgot-password'), 3000);
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    // Add password strength validation if desired
    if (password.length < 6) { // Example: Minimum 6 characters
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
    }

    try {
      const response = await authAPI.resetPassword({ token, password });

      if (response.data?.success) {
        setMessage('Your password has been successfully reset. You can now sign in with your new password.');
        // Redirect to sign-in page after a delay
        setTimeout(() => navigate('/signin', { state: { message: 'Password reset successful. Please sign in.' } }), 3000);
      } else {
        const errorMsg = response.data?.message || response.data?.error?.message || 'Failed to reset password. The link may be invalid or expired.';
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Reset password error:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error?.message || 'An unexpected error occurred. Please try again.';
      // Handle specific error for expired/invalid token more clearly
      if (err.response?.status === 400) {
          setError('Password reset link is invalid or has expired. Please request a new one.');
      } else {
          setError(errorMsg);
      }
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
            <h1 className="mb-2 text-xl font-bold text-gray-800">Reset Your Password</h1>
            <p className="text-sm text-gray-600">Enter your new password below.</p>
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
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                disabled={loading || !!message}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={loading || !!message}
                className="w-full"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || !!message || !token} // Disable if loading, success, or token missing
              className="w-full bg-yumrun-primary hover:bg-yumrun-secondary"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          {!message && (
            <div className="mt-6 text-sm text-center text-gray-600">
              Remembered your password?{' '}
              <Link to="/signin" className="font-medium text-yumrun-primary hover:underline">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default ResetPassword; 