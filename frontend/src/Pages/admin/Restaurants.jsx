import React, { useState, useEffect } from 'react';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching restaurants
    const fetchRestaurants = async () => {
      try {
        // Replace with actual API call
        setLoading(true);
        // Mock data for demonstration
        const mockRestaurants = [
          { 
            id: 1, 
            name: 'Burger King', 
            address: '123 Main St, Anytown', 
            phone: '(555) 123-4567',
            status: 'Active',
            rating: 4.2,
            categories: 'Fast Food, Burgers',
            products: 32
          },
          { 
            id: 2, 
            name: 'Pizza Hut', 
            address: '456 Oak Ave, Somecity', 
            phone: '(555) 987-6543',
            status: 'Active',
            rating: 4.0,
            categories: 'Italian, Pizza',
            products: 28
          },
          { 
            id: 3, 
            name: 'Sushi Palace', 
            address: '789 Elm Blvd, Otherville', 
            phone: '(555) 456-7890',
            status: 'Active',
            rating: 4.7,
            categories: 'Japanese, Sushi',
            products: 45
          },
          { 
            id: 4, 
            name: 'Taco Town', 
            address: '321 Pine Lane, Somewhere', 
            phone: '(555) 321-7654',
            status: 'Inactive',
            rating: 3.8,
            categories: 'Mexican, Tacos',
            products: 18
          },
        ];
        
        setTimeout(() => {
          setRestaurants(mockRestaurants);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  return (
    <div className="admin-restaurants-page">
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>Manage Restaurants</h2>
          </div>
          <div className="col-md-6 text-end">
            <button className="btn btn-primary">
              Add New Restaurant
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
                      <th scope="col">Address</th>
                      <th scope="col">Phone</th>
                      <th scope="col">Status</th>
                      <th scope="col">Rating</th>
                      <th scope="col">Categories</th>
                      <th scope="col">Products</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants.map((restaurant) => (
                      <tr key={restaurant.id}>
                        <td>{restaurant.id}</td>
                        <td>{restaurant.name}</td>
                        <td>{restaurant.address}</td>
                        <td>{restaurant.phone}</td>
                        <td>
                          <span className={`badge ${restaurant.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                            {restaurant.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="me-1">{restaurant.rating}</span>
                            <i className="bi bi-star-fill text-warning"></i>
                          </div>
                        </td>
                        <td>{restaurant.categories}</td>
                        <td>{restaurant.products}</td>
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

export default Restaurants; 