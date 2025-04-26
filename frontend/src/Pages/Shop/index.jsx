import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Container, Card, CardContent, CardHeader, CardTitle, CardDescription, Spinner, Alert } from '../../components/ui';
import LazyImage from '../../components/LazyImage';
import { getFullImageUrl, PLACEHOLDERS } from '../../utils/imageUtils';

const Shop = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        setError(null);
        // Assuming /api/restaurants fetches all approved restaurants
        // Adjust endpoint if needed
        const response = await axios.get('/api/restaurants'); 
        if (response.data.success) {
          // Ensure we have an array, filter for approved just in case backend changes
          const approvedRestaurants = Array.isArray(response.data.data) 
            ? response.data.data.filter(r => r.isApproved) 
            : [];
          setRestaurants(approvedRestaurants);
        } else {
          setError(response.data.message || 'Failed to fetch restaurants');
        }
      } catch (err) {
        console.error("Error fetching restaurants:", err);
        setError(err.response?.data?.message || 'An error occurred while fetching restaurants.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  return (
    <Container className="py-8">
      <h1 className="mb-6 text-3xl font-bold">All Restaurants</h1>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {!loading && !error && restaurants.length === 0 && (
        <p className="text-center text-gray-500">No restaurants found.</p>
      )}

      {!loading && !error && restaurants.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {restaurants.map((restaurant) => (
            <Link key={restaurant._id || restaurant.id} to={`/restaurant/${restaurant._id || restaurant.id}`} className="block group">
              <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-lg">
                <CardHeader className="p-0">
                  {(restaurant.coverImage || restaurant.logo) && (
                    <LazyImage
                      src={
                        restaurant.coverImage
                          ? getFullImageUrl(restaurant.coverImage)
                          : getFullImageUrl(restaurant.logo)
                      }
                      alt={`${restaurant.name}`}
                      className="object-cover w-full h-48 transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  {!restaurant.coverImage && !restaurant.logo && (
                    <div className="flex items-center justify-center w-full h-48 text-gray-400 bg-gray-100">
                      <span>No Image</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="mb-1 text-lg font-semibold truncate transition-colors group-hover:text-yumrun-primary">
                    {restaurant.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 truncate">
                    {restaurant.description || 'Delicious food awaits!'}
                  </CardDescription>
                  <p className="mt-2 text-xs text-gray-500 truncate">
                    {restaurant.location}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
};

export default Shop; 