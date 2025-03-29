import { IoSearchSharp } from "react-icons/io5";
import { useState } from 'react';
import { Button, Input } from '../../../components/ui';

const SearchBox = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        // Add search functionality here
        console.log('Searching for:', searchTerm);
    };

    return (
        <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
                <Input 
                    type="text" 
                    placeholder="Search for food, restaurants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-12 bg-gray-50 border-gray-200 focus:bg-white"
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
    );
};

export default SearchBox;
