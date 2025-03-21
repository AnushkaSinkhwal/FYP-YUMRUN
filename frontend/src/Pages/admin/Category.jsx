import React, { useState, useEffect } from 'react';

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching categories
    const fetchCategories = async () => {
      try {
        // Replace with actual API call
        setLoading(true);
        // Mock data for demonstration
        const mockCategories = [
          { id: 1, name: 'Fast Food', description: 'Quick service restaurants', restaurants: 15 },
          { id: 2, name: 'Italian', description: 'Pizza, pasta and more', restaurants: 8 },
          { id: 3, name: 'Asian', description: 'Chinese, Japanese, Thai cuisines', restaurants: 12 },
          { id: 4, name: 'Desserts', description: 'Sweet treats and bakeries', restaurants: 6 },
        ];
        
        setTimeout(() => {
          setCategories(mockCategories);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="admin-category-page">
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>Manage Categories</h2>
          </div>
          <div className="col-md-6 text-end">
            <button className="btn btn-primary">
              Add New Category
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
                      <th scope="col">Description</th>
                      <th scope="col">Restaurants</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td>{category.id}</td>
                        <td>{category.name}</td>
                        <td>{category.description}</td>
                        <td>{category.restaurants}</td>
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

export default Category; 