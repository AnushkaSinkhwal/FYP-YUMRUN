import { useState, useEffect } from 'react';
import { FaEdit, FaTrashAlt, FaUserPlus, FaSearch, FaFilter } from 'react-icons/fa';
import { adminAPI } from '../../utils/api';
import { Card, Badge, Button, Alert, Spinner } from '../../components/ui';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [success, setSuccess] = useState(null);
  const itemsPerPage = 10;

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await adminAPI.getUsers();
      
      if (response.data && response.data.success) {
        setUsers(response.data.users || []);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch users data');
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeVariant = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'danger';
      case 'Pending': return 'warning';
      default: return 'default';
    }
  };

  const getUserRole = (user) => {
    // First check the new 'role' field
    if (user.role) {
      switch (user.role) {
        case 'admin': return 'Admin';
        case 'restaurant': return 'Restaurant Owner';
        case 'deliveryRider': return 'Delivery Driver';
        case 'customer': return 'Customer';
        default: return user.role.charAt(0).toUpperCase() + user.role.slice(1);
      }
    }
    
    // Fallback to old way if role field is not present
    if (user.isAdmin) return 'Admin';
    if (user.isRestaurantOwner) return 'Restaurant Owner';
    if (user.isDeliveryDriver) return 'Delivery Driver';
    return 'Customer';
  };

  const getUserStatus = (user) => {
    return user.isActive ? 'Active' : 'Inactive';
  };

  // Handle search and filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const userRole = getUserRole(user);
    
    const matchesRole = filterRole === 'all' || userRole === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle user actions
  const handleEditUser = (user) => {
    // Navigate to edit user page or open modal
    console.log('Edit user:', user);
    // Implement edit functionality using adminAPI.updateUser(user.id, userData)
  };

  const confirmDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || !userToDelete._id) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      
      const response = await adminAPI.deleteUser(userToDelete._id);
      
      if (response.data && response.data.success) {
        // Update local state to remove the deleted user
        setUsers(users.filter(u => u._id !== userToDelete._id));
        setSuccess("User deleted successfully");
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        throw new Error(response.data?.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Failed to delete user: " + (error.response?.data?.message || error.message));
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl dark:text-gray-100">
          User Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          View and manage user accounts
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6 text-green-700 border border-green-200 bg-green-50 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800">
          {success}
        </Alert>
      )}

      {/* Action bar */}
      <div className="flex flex-col justify-between gap-4 mb-6 sm:flex-row">
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Search bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Role filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FaFilter className="text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="Customer">Customer</option>
              <option value="Restaurant Owner">Restaurant Owner</option>
              <option value="Delivery Driver">Delivery Driver</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Add user button */}
        <Button className="flex items-center">
          <FaUserPlus className="mr-2" />
          Add New User
        </Button>
      </div>

      {/* Users table */}
      <Card className="shadow-sm dark:bg-gray-800">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" color="primary" />
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No users found matching your search criteria
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="hidden px-4 py-3 md:table-cell">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 md:table-cell">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 font-medium">#{user._id.substring(0, 6)}</td>
                    <td className="px-4 py-3 font-medium">{user.name || user.username}</td>
                    <td className="hidden px-4 py-3 md:table-cell">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={
                        user.role === 'admin' ? "primary" : 
                        user.role === 'restaurant' ? "success" : 
                        user.role === 'deliveryRider' ? "info" : 
                        "default"
                      }>
                        {getUserRole(user)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getBadgeVariant(getUserStatus(user))}>
                        {getUserStatus(user)}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                          <FaEdit className="mr-1" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => confirmDeleteUser(user)}>
                          <FaTrashAlt className="mr-1" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
              </span>{" "}
              of <span className="font-medium">{filteredUsers.length}</span> results
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="max-w-md p-6 mx-auto dark:bg-gray-800">
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Confirm Delete</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Are you sure you want to delete the user {userToDelete?.name || userToDelete?.username}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteUser}
                disabled={isDeleting}
              >
                {isDeleting ? <Spinner size="sm" className="mr-2" /> : <FaTrashAlt className="mr-2" />}
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Users; 