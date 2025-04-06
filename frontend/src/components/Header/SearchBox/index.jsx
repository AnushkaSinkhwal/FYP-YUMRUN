import { IoSearchSharp } from "react-icons/io5";
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Input } from '../../../components/ui';

const SearchBox = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const suggestionsRef = useRef(null);

    // Dummy search suggestions for demonstration
    // In a real application, this would come from an API call
    const dummySuggestions = [
        { id: 1, name: 'Pizza', type: 'category' },
        { id: 2, name: 'Burger', type: 'category' },
        { id: 3, name: 'Namaste Restaurant', type: 'restaurant' },
        { id: 4, name: 'Chicken Momo', type: 'food' },
        { id: 5, name: 'Veg Thali', type: 'food' },
    ];

    // Reset search term when navigating to a different page
    useEffect(() => {
        setSearchTerm('');
        setShowSuggestions(false);
    }, [location.pathname]);

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

    // Filter suggestions based on search term
    useEffect(() => {
        if (searchTerm.length > 1) {
            const filtered = dummySuggestions.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [searchTerm]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
            setShowSuggestions(false);
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
                        onFocus={() => searchTerm.length > 1 && setShowSuggestions(true)}
                    />
                    <Button 
                        type="submit" 
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full rounded-l-none"
                        aria-label="Search"
                    >
                        <IoSearchSharp className="text-gray-500 text-xl" />
                    </Button>
                </div>
            </form>
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                    <ul className="py-1">
                        {suggestions.map((suggestion) => (
                            <li key={`${suggestion.type}-${suggestion.id}`}>
                                <button
                                    type="button"
                                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    <IoSearchSharp className="mr-2 text-gray-400" />
                                    <span>{suggestion.name}</span>
                                    <span className="ml-auto text-xs text-gray-400">
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
