import React, { useState } from 'react';

const Settings = () => {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'YumRun',
    siteDescription: 'Food Delivery Platform',
    contactEmail: 'support@yumrun.com',
    contactPhone: '+1 (555) 123-4567',
    defaultCurrency: 'USD'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    enableEmailNotifications: true,
    enableSmsNotifications: false,
    enablePushNotifications: true,
    emailNewOrder: true,
    emailCancelledOrder: true,
    emailCompletedOrder: true
  });

  const [loading, setLoading] = useState(false);

  const handleGeneralSettingsChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings({
      ...generalSettings,
      [name]: value
    });
  };

  const handleNotificationSettingsChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: checked
    });
  };

  const handleSaveSettings = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert('Settings saved successfully!');
    }, 1000);
  };

  return (
    <div className="admin-settings-page">
      <div className="container-fluid">
        <h2 className="mb-4">System Settings</h2>

        <div className="row">
          <div className="col-lg-6">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">General Settings</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="siteName" className="form-label">Site Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="siteName"
                    name="siteName"
                    value={generalSettings.siteName}
                    onChange={handleGeneralSettingsChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="siteDescription" className="form-label">Site Description</label>
                  <textarea
                    className="form-control"
                    id="siteDescription"
                    name="siteDescription"
                    rows="2"
                    value={generalSettings.siteDescription}
                    onChange={handleGeneralSettingsChange}
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label htmlFor="contactEmail" className="form-label">Contact Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="contactEmail"
                    name="contactEmail"
                    value={generalSettings.contactEmail}
                    onChange={handleGeneralSettingsChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="contactPhone" className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    id="contactPhone"
                    name="contactPhone"
                    value={generalSettings.contactPhone}
                    onChange={handleGeneralSettingsChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="defaultCurrency" className="form-label">Default Currency</label>
                  <select
                    className="form-select"
                    id="defaultCurrency"
                    name="defaultCurrency"
                    value={generalSettings.defaultCurrency}
                    onChange={handleGeneralSettingsChange}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-lg-6">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Notification Settings</h5>
              </div>
              <div className="card-body">
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="enableEmailNotifications"
                    name="enableEmailNotifications"
                    checked={notificationSettings.enableEmailNotifications}
                    onChange={handleNotificationSettingsChange}
                  />
                  <label className="form-check-label" htmlFor="enableEmailNotifications">
                    Enable Email Notifications
                  </label>
                </div>
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="enableSmsNotifications"
                    name="enableSmsNotifications"
                    checked={notificationSettings.enableSmsNotifications}
                    onChange={handleNotificationSettingsChange}
                  />
                  <label className="form-check-label" htmlFor="enableSmsNotifications">
                    Enable SMS Notifications
                  </label>
                </div>
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="enablePushNotifications"
                    name="enablePushNotifications"
                    checked={notificationSettings.enablePushNotifications}
                    onChange={handleNotificationSettingsChange}
                  />
                  <label className="form-check-label" htmlFor="enablePushNotifications">
                    Enable Push Notifications
                  </label>
                </div>
                
                <hr />
                <h6 className="mb-3">Email Notifications</h6>
                
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="emailNewOrder"
                    name="emailNewOrder"
                    checked={notificationSettings.emailNewOrder}
                    onChange={handleNotificationSettingsChange}
                    disabled={!notificationSettings.enableEmailNotifications}
                  />
                  <label className="form-check-label" htmlFor="emailNewOrder">
                    New Order
                  </label>
                </div>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="emailCancelledOrder"
                    name="emailCancelledOrder"
                    checked={notificationSettings.emailCancelledOrder}
                    onChange={handleNotificationSettingsChange}
                    disabled={!notificationSettings.enableEmailNotifications}
                  />
                  <label className="form-check-label" htmlFor="emailCancelledOrder">
                    Cancelled Order
                  </label>
                </div>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="emailCompletedOrder"
                    name="emailCompletedOrder"
                    checked={notificationSettings.emailCompletedOrder}
                    onChange={handleNotificationSettingsChange}
                    disabled={!notificationSettings.enableEmailNotifications}
                  />
                  <label className="form-check-label" htmlFor="emailCompletedOrder">
                    Completed Order
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-end">
          <button 
            className="btn btn-primary"
            onClick={handleSaveSettings}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 