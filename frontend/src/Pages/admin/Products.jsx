import React, { useState, useEffect } from 'react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching products
    const fetchProducts = async () => {
      try {
        // Replace with actual API call
        setLoading(true);
        // Mock data for demonstration
        const mockProducts = [
          { id: 1, name: 'Burger', price: 8.99, category: 'Fast Food', restaurant: 'Burger King' },
          { id: 2, name: 'Pizza', price: 12.99, category: 'Italian', restaurant: 'Pizza Hut' },
          { id: 3, name: 'Sushi', price: 15.99, category: 'Japanese', restaurant: 'Sushi Palace' },
        ];
        
        setTimeout(() => {
          setProducts(mockProducts);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="admin-products-page">
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>Manage Products</h2>
          </div>
          <div className="col-md-6 text-end">
            <button className="btn btn-primary">
              Add New Product
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
                      <th scope="col">Price</th>
                      <th scope="col">Category</th>
                      <th scope="col">Restaurant</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>{product.name}</td>
                        <td>${product.price.toFixed(2)}</td>
                        <td>{product.category}</td>
                        <td>{product.restaurant}</td>
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

export default Products; 