import { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Container } from '../../components/ui';
import { FaCheck, FaTimes, FaEnvelope, FaPhone, FaMapMarkerAlt, FaStore, FaInfoCircle } from 'react-icons/fa';
import { adminAPI } from '../../utils/api';

const RestaurantApprovals = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [pendingApprovals, setPendingApprovals] = useState([]);

    useEffect(() => {
        fetchPendingApprovals();
    }, []);

    const fetchPendingApprovals = async () => {
        try {
            setIsLoading(true);
            const response = await adminAPI.getRestaurantApprovals();
            
            if (response.data.success) {
                // Use the real API data, even if it's empty
                setPendingApprovals(response.data.pendingApprovals || []);
                
                // If there are no approvals, show a message
                if ((response.data.pendingApprovals || []).length === 0) {
                    setMessage({
                        type: 'info',
                        text: 'No pending approval requests at this time.'
                    });
                }
            } else {
                setMessage({
                    type: 'error',
                    text: response.data.error || 'Failed to fetch pending approvals'
                });
            }
        } catch (error) {
            console.error('Error fetching restaurant approvals:', error);
            
            setMessage({
                type: 'error',
                text: 'Failed to connect to the server. Please try again later.'
            });
            setPendingApprovals([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproval = async (approvalId, action) => {
        try {
            setIsLoading(true);
            
            let response;
            if (action === 'approve') {
                response = await adminAPI.approveRestaurantChanges(approvalId);
            } else {
                // For rejections, we should add a reason dialog, but for simplicity we'll pass a generic message
                response = await adminAPI.rejectRestaurantChanges(approvalId, "Changes rejected by administrator");
            }

            if (response.data.success) {
                // Update the local state to remove the approved/rejected item
                setPendingApprovals(pendingApprovals.filter(approval => approval._id !== approvalId));
                
                setMessage({
                    type: 'success',
                    text: `Profile changes ${action === 'approve' ? 'approved' : 'rejected'} successfully`
                });
                
                // Notify the restaurant owner about the approval/rejection
                await sendNotificationToRestaurant(
                    pendingApprovals.find(approval => approval._id === approvalId),
                    action
                );
            } else {
                setMessage({
                    type: 'error',
                    text: response.data.error || `Failed to ${action} profile changes`
                });
            }
        } catch (error) {
            console.error(`Error ${action}ing profile changes:`, error);
            setMessage({
                type: 'error',
                text: `Failed to ${action} the changes. Please try again.`
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const sendNotificationToRestaurant = async (approval, action) => {
        if (!approval) return;
        
        try {
            // Create a notification for the restaurant owner
            const notificationData = {
                userId: approval.requestedBy,
                type: 'restaurant_profile_update',
                title: `Profile Update ${action === 'approve' ? 'Approved' : 'Rejected'}`,
                message: action === 'approve' 
                    ? 'Your restaurant profile changes have been approved and are now live.'
                    : 'Your restaurant profile changes have been rejected. Please contact support for more information.',
                isRead: false
            };
            
            await fetch('/api/notifications', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(notificationData)
            });
        } catch (error) {
            console.error('Error sending notification to restaurant:', error);
        }
    };

    if (isLoading && pendingApprovals.length === 0) {
        return (
            <Container className="py-8">
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            </Container>
        );
    }

    return (
        <Container className="py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Restaurant Profile Approvals</h1>
                <p className="text-gray-600">Review and approve restaurant profile changes</p>
            </div>

            {message.text && (
                <Alert variant={message.type} className="mb-6" dismissible onDismiss={() => setMessage({ type: '', text: '' })}>
                    {message.text}
                </Alert>
            )}

            {pendingApprovals.length === 0 ? (
                <Card className="p-6">
                    <p className="text-gray-600 text-center">No pending approvals to review</p>
                </Card>
            ) : (
                <div className="space-y-6">
                    {pendingApprovals.map((approval) => (
                        <Card key={approval._id} className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">
                                        {approval.restaurantName}
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        Requested on {new Date(approval.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="space-x-2">
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => handleApproval(approval._id, 'approve')}
                                    >
                                        <FaCheck className="mr-2" />
                                        Approve
                                    </Button>
                                    <Button
                                        variant="error"
                                        size="sm"
                                        onClick={() => handleApproval(approval._id, 'reject')}
                                    >
                                        <FaTimes className="mr-2" />
                                        Reject
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-medium text-gray-700 mb-2">Current Information</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm">
                                            <FaStore className="mr-2 text-gray-400" />
                                            <span><strong>Name:</strong> {approval.currentData.name || '-'}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaEnvelope className="mr-2 text-gray-400" />
                                            <span><strong>Email:</strong> {approval.currentData.email || '-'}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaPhone className="mr-2 text-gray-400" />
                                            <span><strong>Phone:</strong> {approval.currentData.phone || '-'}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaMapMarkerAlt className="mr-2 text-gray-400" />
                                            <span><strong>Address:</strong> {approval.currentData.address || '-'}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaInfoCircle className="mr-2 text-gray-400" />
                                            <span><strong>Description:</strong> {approval.currentData.description || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-medium text-gray-700 mb-2">Requested Changes</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm">
                                            <FaStore className="mr-2 text-gray-400" />
                                            <span><strong>Name:</strong> {approval.requestedData.name || '-'}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaEnvelope className="mr-2 text-gray-400" />
                                            <span><strong>Email:</strong> {approval.requestedData.email || '-'}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaPhone className="mr-2 text-gray-400" />
                                            <span><strong>Phone:</strong> {approval.requestedData.phone || '-'}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaMapMarkerAlt className="mr-2 text-gray-400" />
                                            <span><strong>Address:</strong> {approval.requestedData.address || '-'}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaInfoCircle className="mr-2 text-gray-400" />
                                            <span><strong>Description:</strong> {approval.requestedData.description || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {Object.keys(approval.requestedData).filter(key => 
                                !['name', 'email', 'phone', 'address', 'description'].includes(key) &&
                                approval.requestedData[key] !== approval.currentData[key]
                            ).length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <h3 className="font-medium text-gray-700 mb-2">Additional Changes</h3>
                                    <p className="text-sm text-gray-600">There are additional changes in other fields like opening hours, cuisine, etc.</p>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </Container>
    );
};

export default RestaurantApprovals; 