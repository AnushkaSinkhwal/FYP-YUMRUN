import React, { useState, useEffect } from 'react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching users
    const fetchUsers = async () => {
      try {
        // Replace with actual API call
        setLoading(true);
        // Mock data for demonstration
        const mockUsers = [
          { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Customer', status: 'Active', orders: 12 },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Customer', status: 'Active', orders: 8 },
          { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Restaurant Owner', status: 'Active', orders: 0 },
          { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', role: 'Customer', status: 'Inactive', orders: 3 },
        ];
        
        setTimeout(() => {
          setUsers(mockUsers);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="admin-users-page">
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>Manage Users</h2>
          </div>
          <div className="col-md-6 text-end">
            <button className="btn btn-primary">
              Add New User
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th scope="col">ID</th>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Role</th>
                      <th scope="col">Status</th>
                      <th scope="col">Orders</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                          <span className={`badge ${user.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                            {user.status}
                          </span>
                        </td>
                        <td>{user.orders}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-2">
                            Edit
                          </button>
                          <button className="btn btn-sm btn-outline-danger">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users; 