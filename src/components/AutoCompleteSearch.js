import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { searchLocations } from '@/app/apiService';

export default function AutocompleteSearch({ onLocationSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const searchRef = useRef(null);

  // Fetch locations when search term changes
  useEffect(() => {
    const fetchLocationsData = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setFilteredLocations([]);
        return;
      }
      
      setIsLoading(true);
      try {
        // Use the API service function
        const data = await searchLocations(searchTerm);
        setFilteredLocations(data);
      } catch (error) {
        console.error('Error fetching locations:', error);
        setFilteredLocations([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce the search to avoid too many API calls
    const timer = setTimeout(() => {
      fetchLocationsData();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim() !== '') {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
    setSelectedLocation(null);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedLocation(null);
    setShowSuggestions(false);
    
    // Call parent component with null to reset filter
    if (onLocationSelect) {
      onLocationSelect(null);
    }
  };

  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
    setSearchTerm(location.name);
    setShowSuggestions(false);
    
    // Call parent component with the selected location
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari kota, kabupaten, atau provinsi..."
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => searchTerm.trim() !== '' && setShowSuggestions(true)}
          className="pl-9 pr-9 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchTerm && (
          <button 
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      {isLoading && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-gray-500">
          Mencari lokasi...
        </div>
      )}
      
      {showSuggestions && filteredLocations.length > 0 && !isLoading && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredLocations.map(location => (
            <button
              key={location.id}
              onClick={() => handleSelectLocation(location)}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{location.name}</span>
                {location.count > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {location.count}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {location.provinsi}
              </p>
            </button>
          ))}
        </div>
      )}
      
      {showSuggestions && searchTerm && filteredLocations.length === 0 && !isLoading && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-gray-500">
          Tidak ditemukan lokasi yang sesuai
        </div>
      )}
    </div>
  );
}