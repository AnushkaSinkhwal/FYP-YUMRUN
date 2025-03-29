import { useState, useEffect, useRef } from 'react';
import { FaAngleDown } from 'react-icons/fa'; 
import { IoSearchSharp } from "react-icons/io5";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input
} from "../../components/ui";

const CityDropdown = () => {
  const [isOpenModel, setisOpenModel] = useState(false);
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("Select Location");
  const [activeCity, setActiveCity] = useState("");
  const searchInputRef = useRef(null);

  // Focus search input when dialog opens
  useEffect(() => {
    if (isOpenModel && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [isOpenModel]);

  // Fetch cities from JSON
  useEffect(() => {
    fetch("/np.json")
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched data:", data);
        setCities(data);
      })
      .catch((error) => console.error("Error fetching JSON:", error));
  }, []);

  // Filter cities based on search input
  const filteredCities = cities.filter((cityObj) =>
    cityObj.city.toLowerCase().includes(search.toLowerCase())
  );

  // Handle city selection
  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setActiveCity(city);
    setisOpenModel(false);
  };

  return (
    <>
      <button 
        onClick={() => setisOpenModel(true)}
        className="flex items-center text-gray-700 text-sm hover:text-yumrun-orange transition-colors"
      >
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500">Your Location</span>
          <span className="font-medium">{selectedCity}</span>
        </div>
        <FaAngleDown className="ml-2" />
      </button>

      <Dialog open={isOpenModel} onOpenChange={setisOpenModel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose your Delivery Location</DialogTitle>
            <DialogDescription>
              Enter your address and we will specify the offer for your area.
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative my-4">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search your area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <IoSearchSharp className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-1">
            {filteredCities.length > 0 ? (
              <ul className="grid grid-cols-1 gap-1">
                {filteredCities.map((cityObj, index) => (
                  <li key={index}>
                    <Button
                      variant={cityObj.city === activeCity ? "default" : "ghost"}
                      onClick={() => handleCitySelect(cityObj.city)}
                      className="w-full justify-start"
                    >
                      {cityObj.city}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-4 text-center text-gray-500">No cities found</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CityDropdown;
