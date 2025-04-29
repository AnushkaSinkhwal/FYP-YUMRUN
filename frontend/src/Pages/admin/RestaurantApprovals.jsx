import { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Container, Tabs, TabsList, TabsTrigger, TabsContent, Badge } from '../../components/ui';
import { adminAPI } from '../../utils/api';
import { formatDate } from '../../utils/formatters';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

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
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedApproval, setSelectedApproval] = useState(null);
    const location = useLocation();

    useEffect(() => {
        fetchPendingApprovals();
    }, []);

    useEffect(() => {
        const state = location.state;
        if (state?.approvalId && state?.autoOpenDetails) {
            console.log('Auto-open requested for approval ID:', state.approvalId);
            console.log('Available pending updates:', pendingUpdates);
            
            // Find the approval in pendingUpdates
            const approval = pendingUpdates.find(update => update._id === state.approvalId);
            if (approval) {
                console.log('Found matching approval:', approval);
                // Set active tab to updates if needed
                setActiveTab('updates');
                // Show details modal
                showChangeDetails(approval);
                // Clear the state to prevent reopening on navigation
                window.history.replaceState({}, document.title);
            } else {
                console.warn('Approval ID not found in pending updates:', state.approvalId);
                // Set message to inform user
                setMessage({
                    type: 'info',
                    text: 'The requested approval could not be found. It may have been already processed or removed.'
                });
            }
        }
    }, [pendingUpdates, location.state]);

    // Refresh data when navigating from a notification
    useEffect(() => {
        if (location.state?.approvalId) {
            console.log('Refreshing approvals data because we received an approvalId');
            fetchPendingApprovals();
        }
    }, [location.state?.approvalId]);

    const fetchPendingApprovals = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            console.log('Fetching pending restaurant approvals...');
            // Fetch both types of approvals in parallel
            const [registrationsRes, updatesRes] = await Promise.all([
                adminAPI.getPendingRestaurants(),
                adminAPI.getRestaurantApprovals()
            ]);
            
            console.log('Restaurant registrations response:', registrationsRes.data);
            console.log('Restaurant updates response:', updatesRes.data);
            
            if (registrationsRes.data?.success) {
                setPendingRestaurants(registrationsRes.data.data || []);
                console.log(`Found ${registrationsRes.data.data?.length || 0} pending restaurant registrations`);
            }
            
            if (updatesRes.data?.success) {
                const pendingUpdates = updatesRes.data.data || [];
                setPendingUpdates(pendingUpdates);
                console.log(`Found ${pendingUpdates.length || 0} pending restaurant updates`);
                
                if (pendingUpdates.length === 0) {
                    console.log("No pending updates found. API response data:", updatesRes.data);
                } else {
                    // Log detailed information about each pending update
                    pendingUpdates.forEach((update, index) => {
                        console.log(`Pending update #${index + 1}:`, {
                            id: update._id,
                            restaurantId: update.restaurantId?._id || update.restaurantId,
                            restaurantName: update.restaurantId?.name || update.currentData?.name,
                            status: update.status,
                            createdAt: update.createdAt
                        });
                    });
                }
            }
            
            if (!registrationsRes.data?.success && !updatesRes.data?.success) {
                setMessage({
                    type: 'error',
                    text: 'Failed to fetch pending approvals'
                });
            }
        } catch (error) {
            console.error("Error fetching pending approvals:", error);
            console.error("Error details:", error.response?.data || error.message);
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
        
        if (update.requestedData?.name !== update.currentData?.name) {
            changes.push('Name');
        }
        
        if (update.requestedData?.description !== update.currentData?.description) {
            changes.push('Description');
        }
        
        if (JSON.stringify(update.requestedData?.address) !== JSON.stringify(update.currentData?.address)) {
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
        
        if (update.requestedData?.isOpen !== update.currentData?.isOpen) {
            changes.push('Open Status');
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
        
        if (update.requestedData?.logo !== update.currentData?.logo) {
            changes.push('Logo');
        }
        
        if (update.requestedData?.coverImage !== update.currentData?.coverImage) {
            changes.push('Cover Image');
        }
        
        if (update.requestedData?.panNumber !== update.currentData?.panNumber) {
            changes.push('PAN Number');
        }
        
        if (update.requestedData?.priceRange !== update.currentData?.priceRange) {
            changes.push('Price Range');
        }
        
        // If there are more than 3 changes, summarize
        if (changes.length > 3) {
            return `${changes.slice(0, 3).join(', ')} and ${changes.length - 3} more changes`;
        }
        
        return changes.join(', ') || 'No significant changes detected';
    };

    const showChangeDetails = (approval) => {
        setSelectedApproval(approval);
        setShowDetailsModal(true);
    };
    
    const hideChangeDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedApproval(null);
    };

    if (isLoading && pendingRestaurants.length === 0 && pendingUpdates.length === 0) {
        return (
            <Container className="py-8">
                <div className="flex items-center justify-center h-64">
                    <Spinner size="lg" />
                </div>
            </Container>
        );
    }

    const hasPendingRestaurants = pendingRestaurants && pendingRestaurants.length > 0;
    const hasPendingUpdates = pendingUpdates && pendingUpdates.length > 0;

    return (
        <Container className="py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Restaurant Approvals</h1>
                <p className="text-gray-600 dark:text-gray-400">Review restaurant registrations and update requests</p>
            </div>

            {message && (
                <Alert variant={message.type} className="mb-6" dismissible onDismiss={() => setMessage(null)}>
                    <div className="flex flex-col gap-2">
                        <p>{message.text}</p>
                        {message.type === 'info' && (
                            <ul className="pl-5 mt-1 text-sm list-disc">
                                <li>Restaurant owners can update their profile in Restaurant Dashboard → Profile</li>
                                <li>After submitting changes, they appear here for admin approval</li>
                                <li>New restaurant registrations also appear here pending approval</li>
                            </ul>
                        )}
                    </div>
                </Alert>
            )}

            {!isLoading && !hasPendingRestaurants && !hasPendingUpdates && (
                <Card className="p-6 text-center">
                    <p className="text-gray-600 dark:text-gray-400">No pending approvals found.</p>
                    <div className="flex flex-col items-center justify-center gap-3 mt-4 sm:flex-row">
                        <Button variant="outline" onClick={fetchPendingApprovals}>
                            Refresh Approvals
                        </Button>
                    </div>
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
                                                    <td className="px-6 py-4 space-x-2 text-center">
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
                                                <th scope="col" className="px-6 py-3">Owner</th>
                                                <th scope="col" className="px-6 py-3">Submitted</th>
                                                <th scope="col" className="px-6 py-3">Changes</th>
                                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingUpdates.map((update) => (
                                                <tr key={update._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                        {update.restaurantId?.name || getRestaurantName(update)}
                                                    </th>
                                                    <td className="px-6 py-4">
                                                        {update.restaurantId?.owner?.email || update.currentData?.email || 'Unknown'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {formatDate(update.createdAt)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {getChangeSummary(update)}
                                                    </td>
                                                    <td className="px-6 py-4 space-x-2 text-center">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => showChangeDetails(update)}
                                                            className="mb-2 sm:mb-0"
                                                        >
                                                            Details
                                                        </Button>
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
            
            {/* Change Details Modal */}
            {showDetailsModal && selectedApproval && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-3xl w-full p-6 max-h-[80vh] overflow-y-auto">
                        <h3 className="mb-4 text-xl font-semibold">Change Details</h3>
                        <h4 className="mb-2 text-lg font-medium">
                            {selectedApproval.restaurantId?.name || getRestaurantName(selectedApproval)}
                        </h4>
                        
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Requested on {formatDate(selectedApproval.createdAt)}
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
                            {selectedApproval.currentData?.name !== selectedApproval.requestedData?.name && (
                                <div className="p-3 border rounded-md">
                                    <p className="font-medium">Name</p>
                                    <p className="text-red-500 line-through">{selectedApproval.currentData.name}</p>
                                    <p className="text-green-500">{selectedApproval.requestedData.name}</p>
                                </div>
                            )}
                            
                            {selectedApproval.currentData?.description !== selectedApproval.requestedData?.description && (
                                <div className="p-3 border rounded-md md:col-span-2">
                                    <p className="font-medium">Description</p>
                                    <p className="text-sm text-red-500 line-through">{selectedApproval.currentData.description}</p>
                                    <p className="text-sm text-green-500">{selectedApproval.requestedData.description}</p>
                                </div>
                            )}
                            
                            {JSON.stringify(selectedApproval.currentData?.address) !== JSON.stringify(selectedApproval.requestedData?.address) && (
                                <div className="p-3 border rounded-md">
                                    <p className="font-medium">Address</p>
                                    <p className="text-red-500 line-through">
                                        {typeof selectedApproval.currentData.address === 'string' 
                                            ? selectedApproval.currentData.address 
                                            : JSON.stringify(selectedApproval.currentData.address)}
                                    </p>
                                    <p className="text-green-500">
                                        {typeof selectedApproval.requestedData.address === 'string' 
                                            ? selectedApproval.requestedData.address 
                                            : JSON.stringify(selectedApproval.requestedData.address)}
                                    </p>
                                </div>
                            )}
                            
                            {selectedApproval.currentData?.phone !== selectedApproval.requestedData?.phone && (
                                <div className="p-3 border rounded-md">
                                    <p className="font-medium">Phone</p>
                                    <p className="text-red-500 line-through">{selectedApproval.currentData.phone}</p>
                                    <p className="text-green-500">{selectedApproval.requestedData.phone}</p>
                                </div>
                            )}
                            
                            {JSON.stringify(selectedApproval.currentData?.cuisine) !== JSON.stringify(selectedApproval.requestedData?.cuisine) && (
                                <div className="p-3 border rounded-md">
                                    <p className="font-medium">Cuisine</p>
                                    <p className="text-red-500 line-through">
                                        {Array.isArray(selectedApproval.currentData.cuisine) 
                                            ? selectedApproval.currentData.cuisine.join(', ') 
                                            : selectedApproval.currentData.cuisine}
                                    </p>
                                    <p className="text-green-500">
                                        {Array.isArray(selectedApproval.requestedData.cuisine) 
                                            ? selectedApproval.requestedData.cuisine.join(', ') 
                                            : selectedApproval.requestedData.cuisine}
                                    </p>
                                </div>
                            )}
                            
                            {selectedApproval.currentData?.deliveryRadius !== selectedApproval.requestedData?.deliveryRadius && (
                                <div className="p-3 border rounded-md">
                                    <p className="font-medium">Delivery Radius (km)</p>
                                    <p className="text-red-500 line-through">{selectedApproval.currentData.deliveryRadius}</p>
                                    <p className="text-green-500">{selectedApproval.requestedData.deliveryRadius}</p>
                                </div>
                            )}
                            
                            {selectedApproval.currentData?.minimumOrder !== selectedApproval.requestedData?.minimumOrder && (
                                <div className="p-3 border rounded-md">
                                    <p className="font-medium">Minimum Order</p>
                                    <p className="text-red-500 line-through">{selectedApproval.currentData.minimumOrder}</p>
                                    <p className="text-green-500">{selectedApproval.requestedData.minimumOrder}</p>
                                </div>
                            )}
                            
                            {selectedApproval.currentData?.deliveryFee !== selectedApproval.requestedData?.deliveryFee && (
                                <div className="p-3 border rounded-md">
                                    <p className="font-medium">Delivery Fee</p>
                                    <p className="text-red-500 line-through">{selectedApproval.currentData.deliveryFee}</p>
                                    <p className="text-green-500">{selectedApproval.requestedData.deliveryFee}</p>
                                </div>
                            )}
                            
                            {selectedApproval.currentData?.logo !== selectedApproval.requestedData?.logo && (
                                <div className="p-3 border rounded-md">
                                    <p className="font-medium">Logo</p>
                                    <p className="text-xs text-gray-500">Image has been updated</p>
                                </div>
                            )}
                            
                            {selectedApproval.currentData?.coverImage !== selectedApproval.requestedData?.coverImage && (
                                <div className="p-3 border rounded-md">
                                    <p className="font-medium">Cover Image</p>
                                    <p className="text-xs text-gray-500">Image has been updated</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={hideChangeDetailsModal}>
                                Close
                            </Button>
                            <Button 
                                variant="success" 
                                onClick={() => {
                                    handleApproveProfileChanges(selectedApproval._id);
                                    hideChangeDetailsModal();
                                }}
                            >
                                Approve Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-semibold">Reject Restaurant Profile Changes</h3>
                        <p className="mb-4 text-gray-600 dark:text-gray-400">
                            Please provide a reason for rejecting these changes.
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full p-2 mb-4 border rounded-md dark:bg-gray-700 dark:border-gray-600"
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