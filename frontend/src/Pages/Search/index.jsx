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

  // Mock data for search results
  const mockResults = [
    {
      id: '1',
      name: 'Fire and Ice Pizza',
      image: 'https://assets.surlatable.com/m/15a89c2d9c6c1345/72_dpi_webp-REC-283110_Pizza.jpg',
      price: 520,
      rating: 4.5,
      restaurant: 'Namaste'
    },
    {
      id: '2',
      name: 'Veggie Supreme Pizza',
      image: 'https://assets.surlatable.com/m/15a89c2d9c6c1345/72_dpi_webp-REC-283110_Pizza.jpg',
      price: 480,
      rating: 4.2,
      restaurant: 'KFC'
    },
    {
      id: '3',
      name: 'Chicken Momo',
      image: 'https://assets.surlatable.com/m/15a89c2d9c6c1345/72_dpi_webp-REC-283110_Pizza.jpg',
      price: 350,
      rating: 4.8,
      restaurant: 'Momo House'
    }
  ];

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Filter mock results based on query
        const filteredResults = mockResults.filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase()) || 
          item.restaurant.toLowerCase().includes(query.toLowerCase())
        );
        
        setResults(filteredResults);
      } catch (err) {
        console.error('Search error:', err);
        setError('An error occurred while searching. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      performSearch();
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [query]);

  return (
    <section className="section searchPage">
      <div className="container">
        <h2 className="hd mb-4">Search Results for &quot;{query}&quot;</h2>
        
        {loading ? (
          <div className="text-center py-5">
            <CircularProgress />
            <p className="mt-3">Searching...</p>
          </div>
        ) : error ? (
          <Alert severity="error" className="mb-4">{error}</Alert>
        ) : results.length === 0 ? (
          <Alert severity="info" className="mb-4">
            No results found for &quot;{query}&quot;. Try a different search term or browse our categories.
          </Alert>
        ) : (
          <>
            <p className="mb-4">Found {results.length} result(s) for your search</p>
            
            <div className="row">
              {results.map(product => (
                <div className="col-md-4 mb-4" key={product.id}>
                  <ProductItem product={product} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default SearchResults; 