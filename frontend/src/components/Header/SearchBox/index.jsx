import { IoSearchSharp } from "react-icons/io5";
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Input } from '../../../components/ui';

const SearchBox = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const suggestionsRef = useRef(null);
    const inputRef = useRef(null);
    const searchDebounceRef = useRef(null);

    // API endpoint for search suggestions
    const API_URL = 'http://localhost:5000/api';

    // Extract search query from URL on component mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const queryParam = params.get('q');
        if (queryParam && location.pathname === '/search') {
            setSearchTerm(queryParam);
        } else {
            setSearchTerm('');
        }
    }, [location]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fetch suggestions when search term changes
    useEffect(() => {
        // Clear previous timeout
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }

        if (searchTerm.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        // Debounce search to avoid too many requests
        searchDebounceRef.current = setTimeout(async () => {
            try {
                // Try to fetch from actual API
                try {
                    const response = await fetch(`${API_URL}/suggestions?q=${encodeURIComponent(searchTerm)}`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        setSuggestions(data);
                        setShowSuggestions(true);
                        setIsLoading(false);
                        return;
                    }
                } catch (apiError) {
                    console.warn('API suggestions failed, falling back to mock data:', apiError);
                    // If API fails, we'll continue to fallback mock data
                }
                
                // Fallback to mock suggestions
                const dummySuggestions = [
                    { id: 1, name: 'Pizza', type: 'category' },
                    { id: 2, name: 'Burger', type: 'category' },
                    { id: 3, name: 'Namaste Restaurant', type: 'restaurant' },
                    { id: 4, name: 'Chicken Momo', type: 'food' },
                    { id: 5, name: 'Veg Thali', type: 'food' },
                    { id: 6, name: 'American Chopsuey', type: 'food' },
                    { id: 7, name: 'Chicken Burger', type: 'food' },
                    { id: 8, name: 'KFC', type: 'restaurant' }
                ];

                const filteredSuggestions = dummySuggestions.filter(item =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                ).slice(0, 5); // Limit to 5 suggestions

                setSuggestions(filteredSuggestions);
                setShowSuggestions(filteredSuggestions.length > 0);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300); // Wait for 300ms after user stops typing

        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
        };
    }, [searchTerm]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
            setShowSuggestions(false);
            // Remove focus from input
            if (inputRef.current) {
                inputRef.current.blur();
            }
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setSearchTerm(suggestion.name);
        setShowSuggestions(false);
        
        // Navigate based on suggestion type
        if (suggestion.type === 'category') {
            navigate(`/cat/${suggestion.id}`);
        } else if (suggestion.type === 'restaurant') {
            navigate(`/restaurant/${suggestion.id}`);
        } else {
            navigate(`/search?q=${encodeURIComponent(suggestion.name)}`);
        }
        
        // Remove focus from input
        if (inputRef.current) {
            inputRef.current.blur();
        }
    };

    return (
        <div className="relative w-full" ref={suggestionsRef}>
            <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                    <Input 
                        type="text" 
                        placeholder="Search for food, restaurants..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-12 bg-gray-50 border-gray-200 focus:bg-white"
                        onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                        ref={inputRef}
                    />
                    <Button 
                        type="submit" 
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full rounded-l-none"
                        aria-label="Search"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                        ) : (
                            <IoSearchSharp className="text-gray-500 text-xl" />
                        )}
                    </Button>
                </div>
            </form>
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                    <ul className="py-1 max-h-60 overflow-y-auto">
                        {suggestions.map((suggestion) => (
                            <li key={`${suggestion.type}-${suggestion.id}`}>
                                <button
                                    type="button"
                                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    <IoSearchSharp className="mr-2 text-gray-400" />
                                    <span className="font-medium">{suggestion.name}</span>
                                    <span className="ml-auto text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-500">
                                        {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchBox;
