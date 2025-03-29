import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, adminAPI } from '../../utils/api';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles.css';
import { FaSignOutAlt } from 'react-icons/fa';

const Profile = () => {
  const { currentUser, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    healthCondition: 'Healthy'
  });
  const [pendingChanges, setPendingChanges] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Check for tab query parameter
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get('tab');
    
    if (tabParam && (tabParam === 'profile' || (tabParam === 'notifications' && isAdmin()))) {
      setActiveTab(tabParam);
    }
  }, [location.search, isAdmin]);

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        healthCondition: currentUser.healthCondition || 'Healthy'
      });
    }
    
    // For admin users, fetch notifications
    if (isAdmin()) {
      fetchNotifications();
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getNotifications();
      if (response.data.success) {
        setNotifications(response.data.data);
      } else {
        console.error('Failed to fetch notifications:', response.data.message);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setPendingChanges(null);

    try {
      const response = await userAPI.updateProfile(profileData);
      
      if (response.data.success) {
        // Check if we have pending changes (for restaurant owners)
        if (response.data.pendingChanges) {
          setPendingChanges(response.data.pendingChanges);
          setSuccess(response.data.message || 'Profile update request submitted for approval');
        } else {
          setSuccess('Profile updated successfully!');
          // Update local storage with new user data if needed
          const userData = JSON.parse(localStorage.getItem('userData'));
          if (userData) {
            const updatedUserData = { ...userData, ...profileData };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
          }
        }
      } else {
        setError(response.data.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while updating your profile');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (notificationId, isApproved) => {
    try {
      setLoading(true);
      const status = isApproved ? 'approved' : 'rejected';
      
      const response = await adminAPI.processNotification(notificationId, status);
      
      if (response.data.success) {
        setSuccess(`Request ${status} successfully`);
        
        // Update local state to reflect changes
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, status } 
              : notification
          )
        );
      } else {
        setError(response.data.message || 'Failed to process request');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while processing the request');
      console.error('Approval error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="profile-container">
      <div className="container py-5">
        <div className="row">
          <div className="col-lg-3">
            <div className="card mb-4">
              <div className="card-body text-center">
                <h5 className="my-3">{currentUser?.name || 'User'}</h5>
                <p className="text-muted mb-1">{currentUser?.email}</p>
                <p className="text-muted mb-4">
                  {isAdmin() ? 'Administrator' : 
                   currentUser?.isRestaurantOwner ? 'Restaurant Owner' : 
                   currentUser?.isDeliveryStaff ? 'Delivery Staff' : 'Customer'}
                </p>
              </div>
            </div>
            
            <div className="card mb-4">
              <div className="card-body">
                <ul className="nav flex-column nav-pills">
                  <li className="nav-item">
                    <a 
                      className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`} 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setActiveTab('profile'); }}
                    >
                      Profile Settings
                    </a>
                  </li>
                  
                  {isAdmin() && (
                    <li className="nav-item">
                      <a 
                        className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`} 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); setActiveTab('notifications'); }}
                      >
                        Notifications
                        {notifications.filter(n => n.status === 'pending').length > 0 && (
                          <span className="badge bg-danger ms-2">
                            {notifications.filter(n => n.status === 'pending').length}
                          </span>
                        )}
                      </a>
                    </li>
                  )}
                  
                  <li className="nav-item mt-3">
                    <button 
                      className="btn btn-danger w-100 d-flex align-items-center justify-content-center" 
                      onClick={handleLogout}
                      aria-label="Logout from your account"
                    >
                      <FaSignOutAlt className="me-2" />
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="col-lg-9">
            {activeTab === 'profile' && (
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Profile Settings</h5>
                </div>
                <div className="card-body">
                  {success && <div className="alert alert-success">{success}</div>}
                  {error && <div className="alert alert-danger">{error}</div>}
                  
                  {pendingChanges && (
                    <div className="alert alert-warning">
                      <h6>Pending Changes (Awaiting Admin Approval):</h6>
                      <ul className="mb-0">
                        {pendingChanges.name !== currentUser.name && (
                          <li><strong>Name:</strong> {currentUser.name} → {pendingChanges.name}</li>
                        )}
                        {pendingChanges.email !== currentUser.email && (
                          <li><strong>Email:</strong> {currentUser.email} → {pendingChanges.email}</li>
                        )}
                        {pendingChanges.phone !== currentUser.phone && (
                          <li><strong>Phone:</strong> {currentUser.phone} → {pendingChanges.phone}</li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="phone" className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="healthCondition" className="form-label">Health Condition</label>
                      <select
                        className="form-select"
                        id="healthCondition"
                        name="healthCondition"
                        value={profileData.healthCondition}
                        onChange={handleInputChange}
                      >
                        <option value="Healthy">Healthy</option>
                        <option value="Diabetes">Diabetes</option>
                        <option value="High Blood Pressure">High Blood Pressure</option>
                        <option value="Heart Disease">Heart Disease</option>
                        <option value="Food Allergies">Food Allergies</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : 'Save Changes'}
                    </button>
                  </form>
                </div>
              </div>
            )}
            
            {activeTab === 'notifications' && isAdmin() && (
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Approval Notifications</h5>
                </div>
                <div className="card-body">
                  {success && <div className="alert alert-success">{success}</div>}
                  {error && <div className="alert alert-danger">{error}</div>}
                  
                  {notifications.length === 0 ? (
                    <p className="text-muted">No pending notifications</p>
                  ) : (
                    <div className="notifications-list">
                      {notifications.map(notification => (
                        <div key={notification.id} className="notification-item card mb-3">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="mb-0">
                                {notification.user.name}
                                <span className="ms-2 text-muted small">
                                  ({notification.user.email})
                                </span>
                                {notification.user.isRestaurantOwner && (
                                  <span className="ms-2 badge bg-info">
                                    Restaurant Owner
                                  </span>
                                )}
                              </h6>
                              <span className={`badge ${
                                notification.status === 'pending' ? 'bg-warning' :
                                notification.status === 'approved' ? 'bg-success' : 'bg-danger'
                              }`}>
                                {notification.status === 'pending' ? 'Pending' :
                                 notification.status === 'approved' ? 'Approved' : 'Rejected'}
                              </span>
                            </div>
                            
                            <p className="mb-3">{notification.message}</p>
                            
                            {notification.changes && (
                              <div className="changes-details mb-3 p-3 bg-light rounded">
                                <h6 className="mb-2">Changes:</h6>
                                <div className="row">
                                  {Object.entries(notification.changes).map(([key, value], index) => {
                                    if (key.startsWith('previous')) return null;
                                    const previousKey = 'previous' + key.charAt(0).toUpperCase() + key.slice(1);
                                    const previousValue = notification.changes[previousKey];
                                    return (
                                      <div className="col-md-6 mb-2" key={index}>
                                        <div className="change-item">
                                          <span className="fw-bold text-capitalize">{key}: </span>
                                          <span className="change-value">
                                            <span className="text-danger text-decoration-line-through">{previousValue}</span>
                                            <i className="fas fa-arrow-right mx-2">→</i>
                                            <span className="text-success">{value}</span>
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            <div className="text-muted small mb-3">
                              <i className="far fa-clock me-1">⏱</i>
                              {new Date(notification.timestamp).toLocaleString()}
                            </div>
                            
                            {notification.status === 'pending' && (
                              <div className="d-flex justify-content-end gap-2 mt-3">
                                <button 
                                  className="btn btn-success"
                                  onClick={() => handleApproval(notification.id, true)}
                                  disabled={loading}
                                >
                                  {loading ? 'Processing...' : 'Approve'}
                                </button>
                                <button 
                                  className="btn btn-outline-danger"
                                  onClick={() => handleApproval(notification.id, false)}
                                  disabled={loading}
                                >
                                  {loading ? 'Processing...' : 'Reject'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 