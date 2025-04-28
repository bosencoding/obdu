// src/components/FilterBar.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, Download, ChevronDown } from 'lucide-react';
import RegionDropdown from './RegionDropdown';
import AutocompleteSearch from './AutoCompleteSearch';
import { useData } from '@/app/context/DataContext';

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
  // Get updateFilters directly from DataContext
  const { updateFilters, filters: contextFilters } = useData();
  
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
  const debounceTimerRef = useRef(null);
  const years = ['2021', '2022', '2023', '2024', '2025'];
  
  // Sync local state with context when needed
  useEffect(() => {
    if (contextFilters?.searchQuery !== undefined && contextFilters.searchQuery !== localSearchQuery) {
      setLocalSearchQuery(contextFilters.searchQuery);
    }
  }, [contextFilters?.searchQuery]);
  
  // When searchQuery prop changes (from parent), update local state
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== localSearchQuery) {
      setLocalSearchQuery(searchQuery);
    }
  }, [searchQuery]);
  
  // Apply the search filter directly without debounce when user submits
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // Apply search immediately on submit
    setSearchQuery(localSearchQuery);
    
    // Update global filters
    if (updateFilters) {
      updateFilters({ 
        searchQuery: localSearchQuery,
        page: 1 // Reset to page 1 when searching
      });
    }
  };
  
  // Debounced search handling
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
      
      // Update global filters after debounce
      if (updateFilters) {
        updateFilters({ 
          searchQuery: value,
          page: 1 // Reset to page 1 when search changes
        });
      }
    }, 800); // Slightly longer debounce for typing
  };
  
  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  // Callbacks for location and region selection
  const handleLocationSelect = useCallback((location) => {
    console.log('Location selected:', location);
    setSelectedLocation(location);
    
    // Update filters directly when location changes
    if (updateFilters && location) {
      const locationName = location.name || '';
      // Extract the city name from the location name if it includes the type
      const kotaKab = location.type ? locationName.replace(location.type, '').trim() : locationName;
      
      updateFilters({
        regionId: location.id,
        provinsi: location.provinsi,
        daerahTingkat: location.type || null,
        kotaKab: kotaKab,
        page: 1 // Reset to page 1 when location changes
      });
    } else if (updateFilters && !location) {
      // Reset location filters if location is cleared
      updateFilters({
        regionId: null,
        daerahTingkat: null,
        kotaKab: null,
        page: 1
      });
    }
    
    // Reset region selection when location is selected
    if (location) {
      setSelectedRegion(null);
    }
  }, [setSelectedLocation, setSelectedRegion, updateFilters]);

  const handleRegionSelect = useCallback((region) => {
    console.log('Region selected:', region);
    setSelectedRegion(region);
    
    // Update filters directly when region changes
    if (updateFilters) {
      if (region && region.id !== 'all') {
        // Prepare filter updates based on region type
        const filterUpdates = { 
          regionId: region.id,
          page: 1 // Reset to page 1 when region changes
        };
        
        if (region.id.startsWith('province-')) {
          filterUpdates.provinsi = region.name;
          filterUpdates.daerahTingkat = null;
          filterUpdates.kotaKab = null;
        } else if (region.id.startsWith('region-')) {
          filterUpdates.provinsi = region.provinsi;
          filterUpdates.daerahTingkat = region.type;
          const kotaKab = region.name.replace(region.type || '', '').trim();
          filterUpdates.kotaKab = kotaKab;
        }
        
        updateFilters(filterUpdates);
      } else {
        // Reset region filters if "all" is selected
        updateFilters({
          regionId: null,
          provinsi: null,
          daerahTingkat: null,
          kotaKab: null,
          page: 1
        });
      }
    }
    
    // Reset location search if region is selected
    if (region && region.id !== 'all') {
      setSelectedLocation(null);
    }
  }, [setSelectedRegion, setSelectedLocation, updateFilters]);
  
  // Handle year filter changes
  const handleYearChange = useCallback((year) => {
    setFilterYear(year);
    setShowYearDropdown(false);
    
    // Update global filters when year changes
    if (updateFilters) {
      updateFilters({ 
        year: parseInt(year, 10),
        page: 1 // Reset to page 1 when year changes
      });
    }
  }, [setFilterYear, updateFilters]);
  
  // Reset to Jakarta Selatan default view
  const handleResetFilter = useCallback(() => {
    setSelectedLocation(null);
    setLocalSearchQuery('');
    setSearchQuery('');
    
    // Reset to default Jakarta Selatan region
    if (setSelectedRegion) {
      const defaultRegion = { id: 'all', name: 'Semua Wilayah', provinsi: null, type: null, count: 0 };
      setSelectedRegion(defaultRegion);
    }
    
    // Reset filters in global context
    if (updateFilters) {
      updateFilters({
        searchQuery: '',
        regionId: null,
        provinsi: 'DKI Jakarta',    // Default Jakarta
        daerahTingkat: 'Kota',      // Default Kota
        kotaKab: 'Jakarta Selatan', // Default Jakarta Selatan
        page: 1
      });
    }
  }, [setSelectedLocation, setSelectedRegion, setSearchQuery, updateFilters]);
  
  // Create Jakarta Selatan filter label if no specific filters are applied
  const isDefaultJakselView = !localSearchQuery && 
    (!selectedRegion || selectedRegion.id === 'all') && 
    !selectedLocation;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 justify-between mb-4">
        {/* Search input wrapped in form for submit handling */}
        <div className="relative flex-grow">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari paket..."
            value={localSearchQuery}
            onChange={handleSearchChange}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="sr-only">Cari</button>
        </div>
         {/* Location Search and Region Dropdown */}
      <div className="relative flex-grow">
        <AutocompleteSearch onLocationSelect={handleLocationSelect} />
        <RegionDropdown selectedRegion={selectedRegion} setSelectedRegion={handleRegionSelect} />
      </div>
      
      {/* Active filter indicator */}
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button type="button" className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
            <Filter size={16} />
            <span>Filter</span>
          </button>
          
          <button 
            type="button"
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            onClick={handleExportData}
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          
          {/* Year Dropdown */}
          <div className="relative">
            <button 
              type="button"
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
                    type="button"
                    onClick={() => handleYearChange(year)}
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
      </form>
      
     
      {isDefaultJakselView ? (
        <div className="mt-2 text-sm text-gray-500">
          Filter lokasi default: Kota Jakarta Selatan
        </div>
      ) : (selectedRegion && selectedRegion.id !== 'all') || selectedLocation ? (
        <div className="mt-2 text-sm text-gray-500">
          Filter lokasi aktif: {selectedLocation?.name || selectedRegion?.name}
          <button 
            onClick={handleResetFilter}
            className="ml-2 text-blue-500 hover:underline"
          >
            Reset ke Jakarta Selatan
          </button>
        </div>
      ) : localSearchQuery ? (
        <div className="mt-2 text-sm text-gray-500">
          Pencarian aktif: "{localSearchQuery}"
          <button 
            onClick={handleResetFilter}
            className="ml-2 text-blue-500 hover:underline"
          >
            Reset pencarian
          </button>
        </div>
      ) : null}
    </div>
  );
}

// Placeholder for handleExportData function
function handleExportData() {
  alert('Data akan diekspor (fungsi belum diimplementasikan)');
}