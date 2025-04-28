import { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Container, Tabs, TabsList, TabsTrigger, TabsContent, Badge } from '../../components/ui';
import { adminAPI } from '../../utils/api';
import { formatDate } from '../../utils/formatters';
import { FaCheck, FaTimes } from 'react-icons/fa';

const RestaurantApprovals = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [pendingRestaurants, setPendingRestaurants] = useState([]);
    const [pendingUpdates, setPendingUpdates] = useState([]);
    const [actionLoading, setActionLoading] = useState({});
    const [activeTab, setActiveTab] = useState('registrations');
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedApprovalId, setSelectedApprovalId] = useState(null);

    useEffect(() => {
        fetchPendingApprovals();
    }, []);

    const fetchPendingApprovals = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            // Fetch both types of approvals in parallel
            const [registrationsRes, updatesRes] = await Promise.all([
                adminAPI.getPendingRestaurants(),
                adminAPI.getRestaurantApprovals()
            ]);
            
            if (registrationsRes.data?.success) {
                setPendingRestaurants(registrationsRes.data.data || []);
            }
            
            if (updatesRes.data?.success) {
                setPendingUpdates(updatesRes.data.data || []);
            }
            
            if (!registrationsRes.data?.success && !updatesRes.data?.success) {
                setMessage({
                    type: 'error',
                    text: 'Failed to fetch pending approvals'
                });
            }
        } catch (error) {
            console.error("Error fetching pending approvals:", error);
            setMessage({
                type: 'error',
                text: 'An error occurred while fetching data. ' + (error.response?.data?.message || error.message)
            });
            setPendingRestaurants([]);
            setPendingUpdates([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (restaurantId, status) => {
        setActionLoading(prev => ({ ...prev, [restaurantId]: true }));
        setMessage(null);
        try {
            const response = await adminAPI.updateRestaurantStatus(restaurantId, status);
            
            if (response.data?.success) {
                setPendingRestaurants(prev => prev.filter(r => r._id !== restaurantId));
                setMessage({
                    type: 'success',
                    text: `Restaurant ${status === 'approved' ? 'approved' : 'rejected'} successfully`
                });
            } else {
                setMessage({
                    type: 'error',
                    text: response.data?.message || 'Failed to update restaurant status'
                });
            }
        } catch (error) {
            console.error(`Error updating restaurant status to ${status}:`, error);
            setMessage({
                type: 'error',
                text: 'An error occurred while updating status. ' + (error.response?.data?.message || error.message)
            });
        } finally {
            setActionLoading(prev => ({ ...prev, [restaurantId]: false }));
        }
    };
    
    const handleApproveProfileChanges = async (approvalId) => {
        setActionLoading(prev => ({ ...prev, [approvalId]: true }));
        setMessage(null);
        try {
            const response = await adminAPI.approveRestaurantProfileChanges(approvalId);
            
            if (response.data?.success) {
                setPendingUpdates(prev => prev.filter(update => update._id !== approvalId));
                setMessage({
                    type: 'success',
                    text: 'Restaurant profile changes approved successfully'
                });
            } else {
                setMessage({
                    type: 'error',
                    text: response.data?.message || 'Failed to approve restaurant profile changes'
                });
            }
        } catch (error) {
            console.error('Error approving restaurant profile changes:', error);
            setMessage({
                type: 'error',
                text: 'An error occurred while approving changes: ' + (error.response?.data?.message || error.message)
            });
        } finally {
            setActionLoading(prev => ({ ...prev, [approvalId]: false }));
        }
    };
    
    const handleRejectProfileChanges = async () => {
        if (!selectedApprovalId || !rejectionReason.trim()) {
            setMessage({
                type: 'error',
                text: 'Rejection reason is required'
            });
            return;
        }
        
        setActionLoading(prev => ({ ...prev, [selectedApprovalId]: true }));
        setMessage(null);
        try {
            const response = await adminAPI.rejectRestaurantProfileChanges(selectedApprovalId, { reason: rejectionReason });
            
            if (response.data?.success) {
                setPendingUpdates(prev => prev.filter(update => update._id !== selectedApprovalId));
                setMessage({
                    type: 'success',
                    text: 'Restaurant profile changes rejected successfully'
                });
            } else {
                setMessage({
                    type: 'error',
                    text: response.data?.message || 'Failed to reject restaurant profile changes'
                });
            }
        } catch (error) {
            console.error('Error rejecting restaurant profile changes:', error);
            setMessage({
                type: 'error',
                text: 'An error occurred while rejecting changes: ' + (error.response?.data?.message || error.message)
            });
        } finally {
            setActionLoading(prev => ({ ...prev, [selectedApprovalId]: false }));
            setShowRejectModal(false);
            setSelectedApprovalId(null);
            setRejectionReason('');
        }
    };
    
    const showRejectProfileChangesModal = (approvalId) => {
        setSelectedApprovalId(approvalId);
        setShowRejectModal(true);
    };
    
    const hideRejectProfileChangesModal = () => {
        setShowRejectModal(false);
        setSelectedApprovalId(null);
        setRejectionReason('');
    };

    const getRestaurantName = (update) => {
        if (update.restaurantId?.name) {
            return update.restaurantId.name;
        }
        
        return update.requestedData?.restaurantName || 
               update.currentData?.restaurantName || 
               'Unknown Restaurant';
    };
    
    const getChangeSummary = (update) => {
        const changes = [];
        
        if (update.requestedData?.restaurantName !== update.currentData?.restaurantName) {
            changes.push('Name');
        }
        
        if (update.requestedData?.description !== update.currentData?.description) {
            changes.push('Description');
        }
        
        if (update.requestedData?.restaurantAddress !== update.currentData?.restaurantAddress) {
            changes.push('Address');
        }
        
        if (update.requestedData?.phone !== update.currentData?.phone) {
            changes.push('Phone');
        }
        
        if (JSON.stringify(update.requestedData?.cuisine) !== JSON.stringify(update.currentData?.cuisine)) {
            changes.push('Cuisine');
        }
        
        if (JSON.stringify(update.requestedData?.openingHours) !== JSON.stringify(update.currentData?.openingHours)) {
            changes.push('Opening Hours');
        }
        
        if (update.requestedData?.logo !== update.currentData?.logo) {
            changes.push('Logo');
        }
        
        if (update.requestedData?.coverImage !== update.currentData?.coverImage) {
            changes.push('Cover Image');
        }
        
        if (update.requestedData?.deliveryRadius !== update.currentData?.deliveryRadius) {
            changes.push('Delivery Radius');
        }
        
        if (update.requestedData?.minimumOrder !== update.currentData?.minimumOrder) {
            changes.push('Minimum Order');
        }
        
        if (update.requestedData?.deliveryFee !== update.currentData?.deliveryFee) {
            changes.push('Delivery Fee');
        }
        
        return changes.length > 0 ? changes.join(', ') : 'No changes detected';
    };

    if (isLoading && pendingRestaurants.length === 0 && pendingUpdates.length === 0) {
        return (
            <Container className="py-8">
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            </Container>
        );
    }

    const hasPendingRestaurants = pendingRestaurants.length > 0;
    const hasPendingUpdates = pendingUpdates.length > 0;

    return (
        <Container className="py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Restaurant Approvals</h1>
                <p className="text-gray-600 dark:text-gray-400">Review restaurant registrations and update requests</p>
            </div>

            {message && (
                <Alert variant={message.type} className="mb-6" dismissible onDismiss={() => setMessage(null)}>
                    {message.text}
                </Alert>
            )}

            {!isLoading && !hasPendingRestaurants && !hasPendingUpdates && (
                <Card className="p-6 text-center">
                    <p className="text-gray-600 dark:text-gray-400">No pending approvals found.</p>
                </Card>
            )}

            {(hasPendingRestaurants || hasPendingUpdates) && (
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="registrations" className="relative">
                            Restaurant Registrations
                            {hasPendingRestaurants && (
                                <Badge variant="primary" className="ml-2">{pendingRestaurants.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="updates" className="relative">
                            Profile Updates
                            {hasPendingUpdates && (
                                <Badge variant="primary" className="ml-2">{pendingUpdates.length}</Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="registrations">
                        {hasPendingRestaurants ? (
                            <Card className="overflow-hidden">
                                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                    <table className="w-full text-sm text-left text-gray-800 dark:text-gray-400">
                                        <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                                            <tr>
                                                <th scope="col" className="px-6 py-3">Restaurant Name</th>
                                                <th scope="col" className="px-6 py-3">Address</th>
                                                <th scope="col" className="px-6 py-3">PAN Number</th>
                                                <th scope="col" className="px-6 py-3">Owner Email</th>
                                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingRestaurants.map((restaurant) => (
                                                <tr key={restaurant._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                        {restaurant.name}
                                                    </th>
                                                    <td className="px-6 py-4">
                                                        {restaurant.address?.street}, {restaurant.address?.city} 
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {restaurant.panNumber}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {restaurant.owner?.email || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center space-x-2">
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            onClick={() => handleUpdateStatus(restaurant._id, 'approved')}
                                                            disabled={actionLoading[restaurant._id]}
                                                            className="disabled:opacity-50"
                                                        >
                                                            {actionLoading[restaurant._id] ? <Spinner size="sm" className="w-4 h-4"/> : 'Approve'}
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleUpdateStatus(restaurant._id, 'rejected')}
                                                            disabled={actionLoading[restaurant._id]}
                                                            className="disabled:opacity-50"
                                                        >
                                                            {actionLoading[restaurant._id] ? <Spinner size="sm" className="w-4 h-4"/> : 'Reject'}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        ) : (
                            <Card className="p-6 text-center">
                                <p className="text-gray-600 dark:text-gray-400">No pending restaurant registrations found.</p>
                            </Card>
                        )}
                    </TabsContent>
                    
                    <TabsContent value="updates">
                        {hasPendingUpdates ? (
                            <Card className="overflow-hidden">
                                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                    <table className="w-full text-sm text-left text-gray-800 dark:text-gray-400">
                                        <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                                            <tr>
                                                <th scope="col" className="px-6 py-3">Restaurant</th>
                                                <th scope="col" className="px-6 py-3">Requested By</th>
                                                <th scope="col" className="px-6 py-3">Submitted</th>
                                                <th scope="col" className="px-6 py-3">Changes</th>
                                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingUpdates.map((update) => (
                                                <tr key={update._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                        {getRestaurantName(update)}
                                                    </th>
                                                    <td className="px-6 py-4">
                                                        {update.restaurantId?.email || 'Unknown'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {formatDate(update.createdAt)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {getChangeSummary(update)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center space-x-2">
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            onClick={() => handleApproveProfileChanges(update._id)}
                                                            disabled={actionLoading[update._id]}
                                                            className="disabled:opacity-50"
                                                        >
                                                            {actionLoading[update._id] ? <Spinner size="sm" className="w-4 h-4"/> : <FaCheck className="mr-1" />}
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => showRejectProfileChangesModal(update._id)}
                                                            disabled={actionLoading[update._id]}
                                                            className="disabled:opacity-50"
                                                        >
                                                            {actionLoading[update._id] ? <Spinner size="sm" className="w-4 h-4"/> : <FaTimes className="mr-1" />}
                                                            Reject
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        ) : (
                            <Card className="p-6 text-center">
                                <p className="text-gray-600 dark:text-gray-400">No pending restaurant profile updates found.</p>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            )}
            
            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">Reject Restaurant Profile Changes</h3>
                        <p className="mb-4 text-gray-600 dark:text-gray-400">
                            Please provide a reason for rejecting these changes.
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 mb-4"
                            rows="3"
                            placeholder="Reason for rejection..."
                        ></textarea>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={hideRejectProfileChangesModal}>
                                Cancel
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={handleRejectProfileChanges}
                                disabled={!rejectionReason.trim()}
                            >
                                Reject Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Container>
    );
};

export default RestaurantApprovals; 