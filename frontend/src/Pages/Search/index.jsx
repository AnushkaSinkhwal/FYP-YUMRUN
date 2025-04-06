import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, CircularProgress } from '@mui/material';
import ProductItem from '../../components/ProductItem';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API endpoint for search (adjust based on your actual API)
  const API_URL = 'http://localhost:5000/api';

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
        // First try to fetch from actual API
        try {
          const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
          
          if (response.ok) {
            const data = await response.json();
            setResults(data);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.warn('API search failed, falling back to mock data:', apiError);
          // If API fails, we'll continue to fallback mock data
        }
        
        // Fallback to mock data if API isn't available
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        
        // Mock data for search results
        const mockResults = [
          {
            id: '1',
            name: 'Fire and Ice Pizza',
            image: 'https://assets.surlatable.com/m/15a89c2d9c6c1345/72_dpi_webp-REC-283110_Pizza.jpg',
            price: 520,
            oldPrice: 650,
            rating: 4.5,
            restaurant: 'Namaste',
            location: 'Bhaktapur',
            discount: '20'
          },
          {
            id: '2',
            name: 'Veggie Supreme Pizza',
            image: 'https://assets.surlatable.com/m/15a89c2d9c6c1345/72_dpi_webp-REC-283110_Pizza.jpg',
            price: 480,
            oldPrice: 600,
            rating: 4.2,
            restaurant: 'KFC',
            location: 'Kathmandu',
            discount: '15'
          },
          {
            id: '3',
            name: 'Chicken Momo',
            image: 'https://b.zmtcdn.com/data/dish_photos/c76/85cc5218c3cb86aa29db2bd4bc7e0c76.jpg',
            price: 350,
            oldPrice: 400,
            rating: 4.8,
            restaurant: 'Momo House',
            location: 'Lalitpur',
            discount: '10'
          },
          {
            id: '4',
            name: 'Chicken Burger',
            image: 'https://recipe-graphics.grocerywebsite.com/0_GraphicsRecipes/4589_4k.jpg',
            price: 280,
            oldPrice: 320,
            rating: 4.3,
            restaurant: 'Burger House',
            location: 'Kathmandu',
            discount: '12'
          }
        ];
        
        // Filter mock results based on query - case insensitive search in name, restaurant and location
        const filteredResults = mockResults.filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase()) || 
          item.restaurant.toLowerCase().includes(query.toLowerCase()) ||
          (item.location && item.location.toLowerCase().includes(query.toLowerCase()))
        );
        
        setResults(filteredResults);
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
    <section className="section searchPage py-8">
      <div className="container max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4">Search Results for &quot;{query}&quot;</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <CircularProgress />
            <p className="mt-3">Searching...</p>
          </div>
        ) : error ? (
          <Alert severity="error" className="mb-6">{error}</Alert>
        ) : results.length === 0 ? (
          <Alert severity="info" className="mb-6">
            No results found for &quot;{query}&quot;. Try a different search term or browse our categories.
          </Alert>
        ) : (
          <>
            <p className="mb-6 text-gray-600">Found {results.length} result(s) for your search</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map(product => (
                <ProductItem 
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  imgSrc={product.image}
                  oldPrice={product.oldPrice.toString()}
                  newPrice={product.price.toString()}
                  rating={product.rating}
                  location={product.restaurant}
                  discount={product.discount}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default SearchResults; 