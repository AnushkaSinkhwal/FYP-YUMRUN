import { useState } from 'react';
import { Card, Button, Switch, Label, Alert } from '../../components/ui';
import { FaBell, FaInfoCircle, FaMoon, FaGlobe } from 'react-icons/fa';
import { userAPI } from '../../utils/api';

const UserSettings = () => {
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
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

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
      
      if (response.data.success) {
        setSuccess("Settings saved successfully");
      } else {
        setError(response.data.message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setError("Failed to connect to the server");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <FaInfoCircle className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <FaInfoCircle className="h-4 w-4" />
          <span>{success}</span>
        </Alert>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Notifications</h2>
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

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Preferences</h2>
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
              className="px-3 py-2 border rounded-md"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Privacy</h2>
        <div className="space-y-4">
          {Object.entries(settings.privacy).map(([type, enabled]) => (
            <div key={type} className="flex items-center justify-between">
              <div>
                <Label htmlFor={`privacy-${type}`} className="block capitalize">
                  {type.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <p className="text-sm text-gray-500">
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
    </div>
  );
};

export default UserSettings; 