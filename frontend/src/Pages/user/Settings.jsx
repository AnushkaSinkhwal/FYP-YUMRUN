import { useState, useEffect } from 'react';
import { Card, Button, Switch, Label, Alert, Tabs, TabsList, TabsTrigger, TabsContent, Spinner } from '../../components/ui';
import { FaBell, FaInfoCircle, FaMoon, FaGlobe, FaLock, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { userAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserSettings = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: {
      orderUpdates: true,
      promotions: false,
      newsletters: false,
      deliveryUpdates: true
    },
    preferences: {
      darkMode: false,
      language: 'en'
    },
    privacy: {
      shareOrderHistory: false,
      allowLocationTracking: true
    }
  });
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('notifications');

  useEffect(() => {
    fetchSettings();
    
    // Check if dark mode is already active in HTML element
    const isDarkMode = document.documentElement.classList.contains('dark');
    if (isDarkMode) {
      setSettings(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          darkMode: true
        }
      }));
    }
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUserProfile();
      
      if (response.data && response.data.success) {
        const userData = response.data.user;
        
        // Only update settings if they exist in the response
        if (userData.settings) {
          setSettings(userData.settings);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      // Don't show error to user for settings fetch, just use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = (type) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };

  const handlePrivacyToggle = (type) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [type]: !prev.privacy[type]
      }
    }));
  };

  const handlePreferenceToggle = (type) => {
    if (type === 'darkMode') {
      // Toggle dark mode in UI
      document.documentElement.classList.toggle('dark');
      
      // Store dark mode preference in localStorage
      const isDarkMode = document.documentElement.classList.contains('dark');
      localStorage.setItem('darkMode', isDarkMode);
    }
    
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [type]: !prev.preferences[type]
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // API call to save settings
      const response = await userAPI.updateSettings(settings);
      
      if (response.data && response.data.success) {
        setSuccess("Settings saved successfully");
      } else {
        setError(response.data?.message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setError("Failed to connect to the server");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (error) {
      console.error("Error logging out:", error);
      setError("Failed to log out");
    }
  };

  const clearSuccessMessage = () => {
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };

  if (success) {
    clearSuccessMessage();
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <Button 
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <Spinner size="sm" />
              <span>Saving...</span>
            </>
          ) : "Save Changes"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <FaInfoCircle className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6 bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800">
          <FaInfoCircle className="h-4 w-4" />
          <span>{success}</span>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Tabs 
          defaultValue="notifications" 
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                {Object.entries(settings.notifications).map(([type, enabled]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaBell className="h-5 w-5 text-gray-400" />
                      <Label htmlFor={`notification-${type}`} className="capitalize">
                        {type.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                    </div>
                    <Switch
                      id={`notification-${type}`}
                      checked={enabled}
                      onCheckedChange={() => handleNotificationToggle(type)}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">App Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaMoon className="h-5 w-5 text-gray-400" />
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={settings.preferences.darkMode}
                    onCheckedChange={() => handlePreferenceToggle('darkMode')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaGlobe className="h-5 w-5 text-gray-400" />
                    <Label htmlFor="language">Language</Label>
                  </div>
                  <select
                    id="language"
                    value={settings.preferences.language}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        language: e.target.value
                      }
                    }))}
                    className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="privacy">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Privacy Settings</h2>
              <div className="space-y-4">
                {Object.entries(settings.privacy).map(([type, enabled]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div>
                      <Label htmlFor={`privacy-${type}`} className="block capitalize">
                        {type.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        {type === 'shareOrderHistory' 
                          ? 'Allow restaurants to see your previous orders' 
                          : 'Allow tracking your location for delivery'}
                      </p>
                    </div>
                    <Switch
                      id={`privacy-${type}`}
                      checked={enabled}
                      onCheckedChange={() => handlePrivacyToggle(type)}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="account">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaUser className="h-5 w-5 text-gray-400" />
                    <div>
                      <Label>Profile Information</Label>
                      <p className="text-sm text-gray-500">Update your personal information</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/user/profile')}
                  >
                    Edit Profile
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaLock className="h-5 w-5 text-gray-400" />
                    <div>
                      <Label>Password</Label>
                      <p className="text-sm text-gray-500">Change your account password</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/user/change-password')}
                  >
                    Change Password
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
                  <Button 
                    variant="destructive"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default UserSettings; 