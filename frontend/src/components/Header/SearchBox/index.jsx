import { IoSearchSharp } from "react-icons/io5";
import Button from '@mui/material/Button'; 
import { useState } from 'react';

const SearchBox = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        // Add search functionality here
        console.log('Searching for:', searchTerm);
    };

    return (
        <form className="search-box" onSubmit={handleSearch}>
            <div className="search-input-wrapper">
                <input 
                    type="text" 
                    placeholder="Search for food, restaurants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <Button 
                    type="submit" 
                    className="search-button"
                    aria-label="Search"
                >
                    <IoSearchSharp className="search-icon" />
                </Button>
            </div>
        </form>
    );
};

export default SearchBox;
