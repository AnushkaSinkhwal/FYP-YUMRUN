import { useState, useEffect } from 'react';
import { FaEdit, FaTrashAlt, FaUserPlus, FaSearch, FaFilter, FaEllipsisV } from 'react-icons/fa';
import { adminAPI } from '../../utils/api';
import { Card, Badge, Button, Alert, Spinner, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const itemsPerPage = 10;

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real application, replace with actual API call
      // const response = await adminAPI.getUsers();
      
      // For demo, we'll use mockup data
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Customer', status: 'Active', orders: 12, createdAt: '2023-01-15' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Customer', status: 'Active', orders: 8, createdAt: '2023-02-20' },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Restaurant Owner', status: 'Active', orders: 0, createdAt: '2023-03-10' },
        { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', role: 'Customer', status: 'Inactive', orders: 3, createdAt: '2023-01-05' },
        { id: 5, name: 'David Brown', email: 'david@example.com', role: 'Admin', status: 'Active', orders: 0, createdAt: '2022-12-10' },
        { id: 6, name: 'Emily Davis', email: 'emily@example.com', role: 'Customer', status: 'Active', orders: 6, createdAt: '2023-04-22' },
        { id: 7, name: 'Alex Wilson', email: 'alex@example.com', role: 'Restaurant Owner', status: 'Pending', orders: 0, createdAt: '2023-05-18' },
        { id: 8, name: 'Lisa Taylor', email: 'lisa@example.com', role: 'Customer', status: 'Active', orders: 15, createdAt: '2022-11-30' },
        { id: 9, name: 'Ryan Garcia', email: 'ryan@example.com', role: 'Delivery Driver', status: 'Active', orders: 0, createdAt: '2023-06-05' },
        { id: 10, name: 'Olivia Martin', email: 'olivia@example.com', role: 'Customer', status: 'Inactive', orders: 2, createdAt: '2023-02-28' },
        { id: 11, name: 'James Wilson', email: 'james@example.com', role: 'Customer', status: 'Active', orders: 4, createdAt: '2023-07-12' },
        { id: 12, name: 'Sophia Lee', email: 'sophia@example.com', role: 'Restaurant Owner', status: 'Active', orders: 0, createdAt: '2023-08-03' },
      ];
      
      setTimeout(() => {
        setUsers(mockUsers);
        setIsLoading(false);
      }, 600);
      
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users. Please try again.");
      setIsLoading(false);
    }
  };

  // Handle search and filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
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
    console.log('Edit user:', user);
    // Implement edit functionality
  };

  const confirmDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    try {
      // In real app: await adminAPI.deleteUser(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      // Show error notification
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          User Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          View and manage user accounts
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Action bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Role filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFilter className="text-gray-400" />
            </div>
            <select
              className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" color="primary" />
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No users found matching your search criteria
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 hidden md:table-cell">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden md:table-cell">Orders</th>
                  <th className="px-4 py-3 hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 font-medium">#{user.id}</td>
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={
                        user.role === "Admin" ? "primary" : 
                        user.role === "Restaurant Owner" ? "success" : 
                        user.role === "Delivery Driver" ? "info" : 
                        "default"
                      }>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getBadgeVariant(user.status)}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">{user.orders}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{user.createdAt}</td>
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
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700">
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Card className="max-w-md mx-auto dark:bg-gray-800 p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete the user "{userToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteUser}
              >
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