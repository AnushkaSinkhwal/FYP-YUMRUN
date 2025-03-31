import { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Container } from '../../components/ui';
import { FaCheck, FaTimes, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaStore } from 'react-icons/fa';

const RestaurantApprovals = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [pendingApprovals, setPendingApprovals] = useState([]);

    useEffect(() => {
        fetchPendingApprovals();
    }, []);

    const fetchPendingApprovals = async () => {
        try {
            const response = await fetch('/api/admin/restaurant-approvals', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setPendingApprovals(data.pendingApprovals);
            } else {
                setMessage({
                    type: 'error',
                    text: data.error || 'Failed to fetch pending approvals'
                });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'An error occurred while fetching pending approvals'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproval = async (approvalId, action) => {
        try {
            const response = await fetch(`/api/admin/restaurant-approvals/${approvalId}/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setMessage({
                    type: 'success',
                    text: `Profile changes ${action === 'approve' ? 'approved' : 'rejected'} successfully`
                });
                fetchPendingApprovals();
            } else {
                setMessage({
                    type: 'error',
                    text: data.error || `Failed to ${action} profile changes`
                });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: `An error occurred while ${action}ing profile changes`
            });
        }
    };

    if (isLoading) {
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
                <Alert variant={message.type} className="mb-6">
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
                                            <FaUser className="mr-2 text-gray-400" />
                                            <span>{approval.currentData.name}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaEnvelope className="mr-2 text-gray-400" />
                                            <span>{approval.currentData.email}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaPhone className="mr-2 text-gray-400" />
                                            <span>{approval.currentData.phone}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaStore className="mr-2 text-gray-400" />
                                            <span>{approval.currentData.restaurantName}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaMapMarkerAlt className="mr-2 text-gray-400" />
                                            <span>{approval.currentData.restaurantAddress}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-medium text-gray-700 mb-2">Requested Changes</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm">
                                            <FaUser className="mr-2 text-gray-400" />
                                            <span>{approval.requestedData.name}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaEnvelope className="mr-2 text-gray-400" />
                                            <span>{approval.requestedData.email}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaPhone className="mr-2 text-gray-400" />
                                            <span>{approval.requestedData.phone}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaStore className="mr-2 text-gray-400" />
                                            <span>{approval.requestedData.restaurantName}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaMapMarkerAlt className="mr-2 text-gray-400" />
                                            <span>{approval.requestedData.restaurantAddress}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </Container>
    );
};

export default RestaurantApprovals; 