import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, ChevronDown } from 'lucide-react';
import RegionDropdown from './RegionDropdown';
import AutocompleteSearch from './AutoCompleteSearch';

export default function FilterBar({ 
  searchQuery, 
  setSearchQuery, 
  filterYear, 
  setFilterYear,
  selectedRegion,
  setSelectedRegion,
  selectedLocation,
  setSelectedLocation
}) {
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const years = ['2021', '2022', '2023', '2024', '2025'];
  
  // Debounce search query to prevent excessive API calls
  useEffect(() => {
    const timerId = setTimeout(() => {
      if (localSearchQuery !== searchQuery) {
        setSearchQuery(localSearchQuery);
      }
    }, 500); // Wait 500ms after user stops typing
    
    return () => clearTimeout(timerId);
  }, [localSearchQuery, searchQuery, setSearchQuery]);
  
  // When searchQuery prop changes (from parent), update local state
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  
  // Callbacks for location and region selection
  const handleLocationSelect = useCallback((location) => {
    setSelectedLocation(location);
    // Reset region selection when location is selected
    if (location) {
      setSelectedRegion(null);
    }
  }, [setSelectedLocation, setSelectedRegion]);

  const handleRegionSelect = useCallback((region) => {
    setSelectedRegion(region);
    // Reset location search if region is selected
    if (region && region.id !== 'all') {
      setSelectedLocation(null);
    }
  }, [setSelectedRegion, setSelectedLocation]);
  
  // Memoized reset filter handler
  const handleResetFilter = useCallback(() => {
    setSelectedLocation(null);
    // Reset region to "Semua Wilayah" if your RegionDropdown has this default option
    if (setSelectedRegion) {
      const defaultRegion = { id: 'all', name: 'Semua Wilayah', provinsi: null, type: null, count: 0 };
      setSelectedRegion(defaultRegion);
    }
  }, [setSelectedLocation, setSelectedRegion]);
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-3 justify-between mb-4">
        {/* Search with debouncing */}
        <div className="relative flex-grow">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari paket..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
            <Filter size={16} />
            <span>Filter</span>
          </button>
          
          <button className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
            <Download size={16} />
            <span>Export</span>
          </button>
          
          {/* Year Dropdown - Optimized with callback */}
          <div className="relative">
            <button 
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
              onClick={() => setShowYearDropdown(!showYearDropdown)}
            >
              <span>Tahun: {filterYear}</span>
              <ChevronDown size={16} className="text-gray-500" />
            </button>
            
            {showYearDropdown && (
              <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                {years.map(year => (
                  <button 
                    key={year}
                    onClick={() => {
                      setFilterYear(year);
                      setShowYearDropdown(false);
                    }}
                    className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                      year === filterYear ? 'bg-gray-50 font-medium' : ''
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Location Search and Region Dropdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AutocompleteSearch onLocationSelect={handleLocationSelect} />
        <RegionDropdown selectedRegion={selectedRegion} setSelectedRegion={handleRegionSelect} />
      </div>
      
      {/* Active Location Filter Indicator */}
      {(selectedRegion && selectedRegion.id !== 'all') || selectedLocation ? (
        <div className="mt-2 text-sm text-gray-500">
          Filter lokasi aktif: {selectedLocation?.name || selectedRegion?.name}
          <button 
            onClick={handleResetFilter}
            className="ml-2 text-blue-500 hover:underline"
          >
            Reset
          </button>
        </div>
      ) : null}
    </div>
  );
}