import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantAPI } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { 
  Card, 
  Button, 
  Alert, 
  Badge, 
  Spinner,
  Container
} from '../../components/ui';
import { FaClock, FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

const ProfileChanges = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState(null);
  const [approvalHistory, setApprovalHistory] = useState([]);

  useEffect(() => {
    fetchProfileChangeStatus();
  }, []);

  const fetchProfileChangeStatus = async () => {
    try {
      setIsLoading(true);
      const response = await restaurantAPI.getProfileChangeStatus();
      
      if (response.data.success) {
        setPendingChanges(response.data.pendingChanges || null);
        setApprovalHistory(response.data.approvalHistory || []);
      } else {
        addToast(response.data.message || 'Failed to fetch profile change status', { type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching profile change status:', error);
      addToast('Error connecting to server. Please try again later.', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" className="ml-2"><FaClock className="mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="success" className="ml-2"><FaCheckCircle className="mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="error" className="ml-2"><FaTimesCircle className="mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="ml-2"><FaInfoCircle className="mr-1" /> {status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleEditProfile = () => {
    navigate('/restaurant/profile/edit');
  };

  if (isLoading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Profile Change Requests</h1>
        <p className="text-gray-600">
          View the status of your restaurant profile change requests
        </p>
      </div>

      {pendingChanges ? (
        <Card className="mb-8 overflow-hidden">
          <div className="p-4 border-b bg-amber-50 border-amber-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-amber-800">
                Pending Change Request
                {getStatusBadge(pendingChanges.status)}
              </h2>
              <p className="text-sm text-gray-600">
                Submitted on {formatDate(pendingChanges.createdAt)}
              </p>
            </div>
          </div>
          
          <div className="p-6">
            <Alert variant="info" className="mb-6">
              Your profile changes are awaiting approval from the YumRun team. You&apos;ll be notified once they&apos;re reviewed.
            </Alert>
            
            <h3 className="mb-3 font-medium text-gray-700">Changed Information</h3>
            <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
              {pendingChanges.changes && Object.entries(pendingChanges.changes).map(([key, value]) => (
                <div key={key} className="pb-2 border-b border-gray-100">
                  <p className="mb-1 text-sm text-gray-500">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 line-through">
                        {pendingChanges.originalValues[key] || 'Not set'}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {value || 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="outline"
                onClick={() => fetchProfileChangeStatus()}
              >
                Check Status
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 mb-8">
          <div className="py-6 text-center">
            <FaInfoCircle className="mx-auto mb-4 text-4xl text-gray-400" />
            <h2 className="mb-2 text-xl font-semibold">No Pending Changes</h2>
            <p className="mb-6 text-gray-600">
              You don&apos;t have any pending profile change requests. Feel free to update your restaurant profile.
            </p>
            <Button onClick={handleEditProfile}>
              Edit Profile
            </Button>
          </div>
        </Card>
      )}

      {approvalHistory.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Change Request History</h2>
          <div className="space-y-4">
            {approvalHistory.map((item) => (
              <Card key={item._id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium">
                        Profile Update
                      </h3>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                  {item.status === 'rejected' && item.feedback && (
                    <div className="ml-2">
                      <Alert variant="warning" className="max-w-md">
                        <p className="text-sm">
                          <strong>Feedback:</strong> {item.feedback}
                        </p>
                      </Alert>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
};

export default ProfileChanges; 