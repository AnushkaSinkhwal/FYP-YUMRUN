import { useState } from 'react';
import { Card, Button, Label, Alert } from '../../components/ui';
import { FaInfoCircle, FaLock, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserSettings = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (err) {
      console.error('Error logging out:', err);
      setError('Failed to log out');
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <FaInfoCircle className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
      )}

      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaUser className="h-5 w-5 text-gray-400" />
              <div>
                <Label>Profile Information</Label>
                <p className="text-sm text-gray-500">Update your personal information</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/user/profile')}>
              Edit Profile
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaLock className="h-5 w-5 text-gray-400" />
              <div>
                <Label>Password</Label>
                <p className="text-sm text-gray-500">Reset your password</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/forgot-password')}>
              Reset Password
            </Button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaSignOutAlt className="h-5 w-5 text-red-500" />
              <div>
                <Label className="text-red-500">Logout</Label>
                <p className="text-sm text-gray-500">Sign out from your account</p>
              </div>
            </div>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserSettings; 