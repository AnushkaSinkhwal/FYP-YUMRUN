import { IoSearchSharp } from "react-icons/io5";
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Input } from '../../../components/ui';
import axios from 'axios';
import { FaUtensils, FaStore } from 'react-icons/fa';

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

    // Use the actual server URL from environment variables or default
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
                console.log(`Searching for: "${searchTerm}" using ${API_URL}`);
                
                // Search for menu items
                const menuResponse = await axios.get(`${API_URL}/menu`);
                
                // Filter menu items client-side
                const menuItems = menuResponse.data.data || [];
                const filteredMenuItems = menuItems.filter(item => {
                    const itemName = (item.name || item.item_name || "").toLowerCase();
                    const itemDesc = (item.description || "").toLowerCase();
                    const searchTermLower = searchTerm.toLowerCase();
                    return itemName.includes(searchTermLower) || itemDesc.includes(searchTermLower);
                });
                
                // Search for restaurants
                const restaurantsResponse = await axios.get(`${API_URL}/restaurants`);
                
                // Filter restaurants client-side
                const restaurants = restaurantsResponse.data.data || [];
                const filteredRestaurants = restaurants.filter(restaurant => {
                    const restaurantName = (restaurant.name || "").toLowerCase();
                    const restaurantDesc = (restaurant.description || "").toLowerCase();
                    const searchTermLower = searchTerm.toLowerCase();
                    return restaurantName.includes(searchTermLower) || restaurantDesc.includes(searchTermLower);
                });
                
                // Process menu items and convert to suggestion format
                const foodSuggestions = filteredMenuItems.slice(0, 3).map(item => ({
                    id: item._id || item.id || `food-${Math.random().toString(36).substr(2, 9)}`,
                    name: item.item_name || item.name || "Unnamed Food Item",
                    type: 'food',
                    image: item.image || null,
                    description: item.description?.substring(0, 50) || null
                }));
                
                // Process restaurants
                const restaurantSuggestions = filteredRestaurants.slice(0, 2).map(restaurant => ({
                    id: restaurant._id || restaurant.id || `restaurant-${Math.random().toString(36).substr(2, 9)}`,
                    name: restaurant.name || "Unnamed Restaurant",
                    type: 'restaurant',
                    image: restaurant.logo || restaurant.image || null,
                    description: restaurant.description?.substring(0, 50) || null
                }));
                
                // Combine suggestions
                const combinedSuggestions = [...foodSuggestions, ...restaurantSuggestions];
                
                if (combinedSuggestions.length > 0) {
                    console.log('Found suggestions:', combinedSuggestions.length);
                    setSuggestions(combinedSuggestions);
                    setShowSuggestions(true);
                } else {
                    // Fallback to food categories if no items found
                    const categories = [
                        { id: 'pizza', name: 'Pizza', type: 'category' },
                        { id: 'burger', name: 'Burger', type: 'category' },
                        { id: 'momo', name: 'Momo', type: 'category' },
                        { id: 'dessert', name: 'Dessert', type: 'category' },
                        { id: 'drinks', name: 'Drinks', type: 'category' }
                    ];
                    
                    const filteredCategories = categories.filter(cat => 
                        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    
                    console.log('No direct matches, showing categories:', filteredCategories.length);
                    setSuggestions(filteredCategories);
                    setShowSuggestions(filteredCategories.length > 0);
                }
            } catch (error) {
                console.error('Error fetching suggestions:', error);
                
                // Fallback to mock suggestions on error
                const dummySuggestions = [
                    { id: 'pizza', name: 'Pizza', type: 'category' },
                    { id: 'burger', name: 'Burger', type: 'category' },
                    { id: 'namaste', name: 'Namaste Restaurant', type: 'restaurant' },
                    { id: 'momo', name: 'Chicken Momo', type: 'food' },
                    { id: 'thali', name: 'Veg Thali', type: 'food' }
                ];

                const filteredSuggestions = dummySuggestions.filter(item =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                ).slice(0, 5); // Limit to 5 suggestions

                setSuggestions(filteredSuggestions);
                setShowSuggestions(filteredSuggestions.length > 0);
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
        } else if (suggestion.type === 'food') {
            navigate(`/product/${suggestion.id}`);
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
                                    {suggestion.image ? (
                                        <div className="w-8 h-8 mr-2 overflow-hidden bg-gray-100 rounded-full flex-shrink-0">
                                            <img 
                                                src={suggestion.image} 
                                                alt={suggestion.name}
                                                className="object-cover w-full h-full"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://via.placeholder.com/40";
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center w-8 h-8 mr-2 overflow-hidden text-gray-500 bg-gray-100 rounded-full flex-shrink-0">
                                            {suggestion.type === 'food' ? (
                                                <FaUtensils className="text-xs" />
                                            ) : suggestion.type === 'restaurant' ? (
                                                <FaStore className="text-xs" />
                                            ) : (
                                                <IoSearchSharp className="text-xs" />
                                            )}
                                        </div>
                                    )}
                                    <div className="flex-1 overflow-hidden">
                                        <span className="block font-medium text-sm truncate">{suggestion.name}</span>
                                        {suggestion.description && (
                                            <span className="block text-xs text-gray-500 truncate">{suggestion.description}</span>
                                        )}
                                    </div>
                                    <span className="ml-auto text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-500 flex-shrink-0">
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
