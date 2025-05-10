import { useState } from 'react';
import { Card, Input, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { FaCog, FaGlobe, FaEnvelope } from 'react-icons/fa';

const Settings = () => {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'YumRun',
    siteDescription: 'Food Delivery Platform',
    contactEmail: 'support@yumrun.com',
    contactPhone: '+1 (555) 123-4567',
    language: 'en',
    timezone: 'Asia/Kathmandu'
  });

  const [loading, setLoading] = useState(false);

  const handleGeneralSettingsChange = (name, value) => {
    setGeneralSettings(prev => ({
      ...prev,
      [name]: value
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