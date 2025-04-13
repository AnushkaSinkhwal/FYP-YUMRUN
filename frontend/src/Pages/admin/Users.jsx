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
  
  // Add User Modal States
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer',
    isActive: true
  });
  const [isCreating, setIsCreating] = useState(false);
  
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
      return user.role;
    }
    // Legacy fallback for old records
    if (user.isAdmin) return 'admin';
    if (user.isRestaurantOwner) return 'restaurant';
    if (user.isDeliveryRider) return 'delivery_rider';
    return 'customer';
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

  // Handle showing the add user modal
  const openAddUserModal = () => {
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      role: 'customer',
      isActive: true
    });
    setShowAddUserModal(true);
  };

  // Handle input changes for new user form
  const handleNewUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUser({
      ...newUser,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle user creation
  const handleCreateUser = async () => {
    try {
      setIsCreating(true);
      setError(null);
      
      // Basic validation
      const requiredFields = ['firstName', 'lastName', 'email', 'password', 'phone'];
      const missingFields = requiredFields.filter(field => !newUser[field]);
      
      if (missingFields.length > 0) {
        setError(`Please provide ${missingFields.join(', ')}`);
        setIsCreating(false);
        return;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUser.email)) {
        setError('Please enter a valid email address');
        setIsCreating(false);
        return;
      }
      
      // Phone validation
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(newUser.phone)) {
        setError('Phone must be exactly 10 digits');
        setIsCreating(false);
        return;
      }
      
      const response = await adminAPI.createUser(newUser);
      
      if (response.data && response.data.success) {
        // Add the new user to the state
        const createdUser = response.data.user;
        setUsers([...users, {
          _id: createdUser.id,
          firstName: createdUser.firstName,
          lastName: createdUser.lastName,
          fullName: createdUser.fullName,
          email: createdUser.email,
          phone: createdUser.phone,
          role: createdUser.role,
          isActive: createdUser.isActive,
          createdAt: new Date().toISOString()
        }]);
        
        setSuccess('User created successfully');
        setShowAddUserModal(false);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        throw new Error(response.data?.message || 'Failed to create user');
      }
    } catch (error) {
      console.error("Error creating user:", error);
      setError("Failed to create user: " + (error.response?.data?.message || error.message));
    } finally {
      setIsCreating(false);
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
              <option value="customer">Customer</option>
              <option value="restaurant">Restaurant Owner</option>
              <option value="delivery_rider">Delivery Rider</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Add user button */}
        <Button className="flex items-center" onClick={openAddUserModal}>
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
                        user.role === 'delivery_rider' ? "warning" : "info"
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

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Add New User</h2>
            
            {error && (
              <Alert variant="destructive" className="mb-4">
                {error}
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  First Name*
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={newUser.firstName}
                  onChange={handleNewUserChange}
                  className="w-full p-2 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Name*
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={newUser.lastName}
                  onChange={handleNewUserChange}
                  className="w-full p-2 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Email*
              </label>
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleNewUserChange}
                className="w-full p-2 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Password*
              </label>
              <input
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleNewUserChange}
                className="w-full p-2 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone* (10 digits)
              </label>
              <input
                type="text"
                name="phone"
                value={newUser.phone}
                onChange={handleNewUserChange}
                className="w-full p-2 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
                maxLength="10"
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Role
              </label>
              <select
                name="role"
                value={newUser.role}
                onChange={handleNewUserChange}
                className="w-full p-2 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
                <option value="delivery_rider">Delivery Rider</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Note: To create a restaurant account, use the Restaurant Management page
              </p>
            </div>
            
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                name="isActive"
                checked={newUser.isActive}
                onChange={handleNewUserChange}
                className="w-4 h-4 border-gray-300 rounded text-primary-600 focus:ring-primary-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Account
              </label>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowAddUserModal(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUser}
                disabled={isCreating}
              >
                {isCreating ? <Spinner size="sm" className="mr-2" /> : null}
                Create User
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete User Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
              Delete User
            </h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete the user {userToDelete?.name || userToDelete?.email}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
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
                {isDeleting ? <Spinner size="sm" className="mr-2" /> : null}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users; 