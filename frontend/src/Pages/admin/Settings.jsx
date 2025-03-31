import { useState } from 'react';
import { Card, Input, Button, Switch, Select, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { FaCog, FaBell, FaGlobe, FaEnvelope } from 'react-icons/fa';

const Settings = () => {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'YumRun',
    siteDescription: 'Food Delivery Platform',
    contactEmail: 'support@yumrun.com',
    contactPhone: '+1 (555) 123-4567',
    defaultCurrency: 'NPR',
    language: 'en',
    timezone: 'Asia/Kathmandu'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    enableEmailNotifications: true,
    enableSmsNotifications: false,
    enablePushNotifications: true,
    emailNewOrder: true,
    emailCancelledOrder: true,
    emailCompletedOrder: true,
    smsNewOrder: false,
    smsCancelledOrder: false,
    pushNewOrder: true,
    pushCancelledOrder: true
  });

  const [loading, setLoading] = useState(false);

  const handleGeneralSettingsChange = (name, value) => {
    setGeneralSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationSettingsChange = (name) => {
    setNotificationSettings(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Show success message
    } catch {
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your system settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <FaCog className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <FaBell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaGlobe className="text-gray-500" />
                Site Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Site Name</label>
                  <Input
                    value={generalSettings.siteName}
                    onChange={(e) => handleGeneralSettingsChange('siteName', e.target.value)}
                    placeholder="Enter site name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Site Description</label>
                  <Input
                    value={generalSettings.siteDescription}
                    onChange={(e) => handleGeneralSettingsChange('siteDescription', e.target.value)}
                    placeholder="Enter site description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Default Currency</label>
                  <Select 
                    defaultValue={generalSettings.defaultCurrency}
                    onValueChange={(value) => handleGeneralSettingsChange('defaultCurrency', value)}
                  >
                    <Select.Trigger className="w-full">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Group>
                        <Select.Item value="NPR">NPR (रू)</Select.Item>
                        <Select.Item value="USD">USD ($)</Select.Item>
                        <Select.Item value="EUR">EUR (€)</Select.Item>
                        <Select.Item value="GBP">GBP (£)</Select.Item>
                      </Select.Group>
                    </Select.Content>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaEnvelope className="text-gray-500" />
                Contact Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Email</label>
                  <Input
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) => handleGeneralSettingsChange('contactEmail', e.target.value)}
                    placeholder="Enter contact email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Contact Phone</label>
                  <Input
                    value={generalSettings.contactPhone}
                    onChange={(e) => handleGeneralSettingsChange('contactPhone', e.target.value)}
                    placeholder="Enter contact phone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Time Zone</label>
                  <Select 
                    defaultValue={generalSettings.timezone}
                    onValueChange={(value) => handleGeneralSettingsChange('timezone', value)}
                  >
                    <Select.Trigger className="w-full">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Group>
                        <Select.Item value="Asia/Kathmandu">Asia/Kathmandu (GMT+5:45)</Select.Item>
                        <Select.Item value="UTC">UTC</Select.Item>
                        <Select.Item value="America/New_York">America/New_York (GMT-4)</Select.Item>
                      </Select.Group>
                    </Select.Content>
                  </Select>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaBell className="text-gray-500" />
                Notification Channels
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.enableEmailNotifications}
                    onCheckedChange={() => handleNotificationSettingsChange('enableEmailNotifications')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">SMS Notifications</h3>
                    <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                  </div>
                  <Switch
                    checked={notificationSettings.enableSmsNotifications}
                    onCheckedChange={() => handleNotificationSettingsChange('enableSmsNotifications')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Push Notifications</h3>
                    <p className="text-sm text-gray-500">Receive browser push notifications</p>
                  </div>
                  <Switch
                    checked={notificationSettings.enablePushNotifications}
                    onCheckedChange={() => handleNotificationSettingsChange('enablePushNotifications')}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaEnvelope className="text-gray-500" />
                Email Notifications
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">New Orders</h3>
                    <p className="text-sm text-gray-500">Get notified when new orders are placed</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNewOrder}
                    onCheckedChange={() => handleNotificationSettingsChange('emailNewOrder')}
                    disabled={!notificationSettings.enableEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Cancelled Orders</h3>
                    <p className="text-sm text-gray-500">Get notified when orders are cancelled</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailCancelledOrder}
                    onCheckedChange={() => handleNotificationSettingsChange('emailCancelledOrder')}
                    disabled={!notificationSettings.enableEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Completed Orders</h3>
                    <p className="text-sm text-gray-500">Get notified when orders are completed</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailCompletedOrder}
                    onCheckedChange={() => handleNotificationSettingsChange('emailCompletedOrder')}
                    disabled={!notificationSettings.enableEmailNotifications}
                  />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button 
          variant="brand"
          onClick={handleSaveSettings}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default Settings; 