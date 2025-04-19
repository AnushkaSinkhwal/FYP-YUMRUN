import { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Container } from '../../components/ui';
import { adminAPI } from '../../utils/api';

const RestaurantApprovals = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [pendingRestaurants, setPendingRestaurants] = useState([]);
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        fetchPendingRestaurants();
    }, []);

    const fetchPendingRestaurants = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            const response = await adminAPI.getPendingRestaurants();
            
            if (response.data?.success) {
                setPendingRestaurants(response.data.data || []);
            } else {
                setMessage({
                    type: 'error',
                    text: response.data?.message || 'Failed to fetch pending restaurants'
                });
            }
        } catch (error) {
            console.error("Error fetching pending restaurants:", error);
            setMessage({
                type: 'error',
                text: 'An error occurred while fetching data. ' + (error.response?.data?.message || error.message)
            });
            setPendingRestaurants([]);
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

    if (isLoading && pendingRestaurants.length === 0) {
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
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Restaurant Approvals</h1>
                <p className="text-gray-600 dark:text-gray-400">Review and approve newly registered restaurants.</p>
            </div>

            {message && (
                <Alert variant={message.type} className="mb-6" dismissible onDismiss={() => setMessage(null)}>
                    {message.text}
                </Alert>
            )}

            {!isLoading && pendingRestaurants.length === 0 && (
                <Card className="p-6 text-center">
                    <p className="text-gray-600 dark:text-gray-400">No restaurants currently pending approval.</p>
                </Card>
            )}

            {!isLoading && pendingRestaurants.length > 0 && (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Address</th>
                                    <th scope="col" className="px-6 py-3">PAN</th>
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
            )}
        </Container>
    );
};

export default RestaurantApprovals; 