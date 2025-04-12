import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Alert, Spinner } from '../../components/ui';
import ProductItem from '../../components/ProductItem';
import axios from 'axios';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API endpoint for search
  const API_URL = 'http://localhost:8000/api';

  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Search for menu items using the search API
        const menuResponse = await axios.get(`${API_URL}/search/menu-items`, {
          params: { query }
        });

        // Search for restaurants by filtering the restaurants endpoint
        const restaurantsResponse = await axios.get(`${API_URL}/restaurants`);
        
        // Process menu items results
        const menuItems = menuResponse.data.data.map(item => ({
          id: item._id,
          name: item.item_name || item.name,
          image: item.image,
          price: item.item_price || item.price,
          oldPrice: item.originalPrice,
          rating: item.averageRating || item.rating || 4.0,
          restaurant: item.restaurant?.name || 'Restaurant',
          location: item.restaurant?.location || '',
          discount: item.discount ? item.discount.toString() : '',
          type: 'food'
        }));

        // Process restaurant results that match the query
        const matchingRestaurants = restaurantsResponse.data.data
          .filter(restaurant => 
            restaurant.name.toLowerCase().includes(query.toLowerCase()) ||
            (restaurant.description && restaurant.description.toLowerCase().includes(query.toLowerCase())) ||
            (restaurant.cuisine && restaurant.cuisine.some(c => c.toLowerCase().includes(query.toLowerCase())))
          )
          .map(restaurant => ({
            id: restaurant._id,
            name: restaurant.name,
            image: restaurant.logo || '/uploads/placeholders/restaurant-placeholder.jpg',
            price: 0, // Not applicable for restaurants
            oldPrice: 0,
            rating: restaurant.rating || 4.0,
            restaurant: 'View Restaurant',
            location: restaurant.location || restaurant.address || '',
            discount: '',
            type: 'restaurant'
          }));

        // Combine results
        const combinedResults = [...menuItems, ...matchingRestaurants];
        
        setResults(combinedResults);
      } catch (err) {
        console.error('Search error:', err);
        setError('An error occurred while searching. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  return (
    <section className="py-8">
      <Container>
        <h2 className="text-2xl font-bold mb-4">Search Results for &quot;{query}&quot;</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <Spinner size="lg" />
            <p className="mt-3 text-gray-600">Searching...</p>
          </div>
        ) : error ? (
          <Alert variant="error" className="mb-6">{error}</Alert>
        ) : results.length === 0 ? (
          <Alert variant="info" className="mb-6">
            No results found for &quot;{query}&quot;. Try a different search term or browse our categories.
          </Alert>
        ) : (
          <>
            <p className="mb-6 text-gray-600">Found {results.length} result(s) for your search</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map(item => {
                if (item.type === 'restaurant') {
                  // For restaurants, link to restaurant page
                  return (
                    <ProductItem 
                      key={`restaurant-${item.id}`}
                      id={item.id}
                      name={item.name}
                      imgSrc={item.image}
                      oldPrice=""
                      newPrice=""
                      rating={item.rating}
                      location={item.location}
                      discount=""
                      linkTo={`/restaurant/${item.id}`}
                      isRestaurant={true}
                    />
                  );
                } else {
                  // For food items
                  return (
                    <ProductItem 
                      key={`food-${item.id}`}
                      id={item.id}
                      name={item.name}
                      imgSrc={item.image}
                      oldPrice={item.oldPrice ? item.oldPrice.toString() : ''}
                      newPrice={item.price.toString()}
                      rating={item.rating}
                      location={item.restaurant}
                      discount={item.discount}
                    />
                  );
                }
              })}
            </div>
          </>
        )}
      </Container>
    </section>
  );
};

export default SearchResults; 