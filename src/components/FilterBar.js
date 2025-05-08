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
  
  // Refs to prevent update loops
  const isUpdatingRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const batchedUpdatesRef = useRef({});
  
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
  const years = ['2021', '2022', '2023', '2024', '2025'];
  
  // Single effect to sync local state with context
  // This prevents multiple state updates triggering multiple API calls
  useEffect(() => {
    // Skip if we're in the middle of updating to prevent loops
    if (isUpdatingRef.current) return;
    
    // Sync search query from context if needed
    if (contextFilters?.searchQuery !== undefined &&
        contextFilters.searchQuery !== localSearchQuery) {
      setLocalSearchQuery(contextFilters.searchQuery);
    }
    
    // Sync search query from props if needed
    if (searchQuery !== undefined &&
        searchQuery !== localSearchQuery &&
        searchQuery !== contextFilters?.searchQuery) {
      setLocalSearchQuery(searchQuery);
    }
  }, [contextFilters?.searchQuery, searchQuery, localSearchQuery]);
  
  // Batched filter updates to reduce API calls
  const batchFilterUpdates = useCallback((updates) => {
    // Store updates in the ref
    batchedUpdatesRef.current = {
      ...batchedUpdatesRef.current,
      ...updates,
      // Always reset to page 1 when filters change
      page: 1
    };
    
    // Clear any existing timeout
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new timeout to apply all batched updates at once
    debounceTimerRef.current = setTimeout(() => {
      if (Object.keys(batchedUpdatesRef.current).length > 0) {
        // Set updating flag to prevent loops
        isUpdatingRef.current = true;
        
        // Apply all batched updates at once
        if (updateFilters) {
          updateFilters(batchedUpdatesRef.current);
        }
        
        // Reset batched updates
        batchedUpdatesRef.current = {};
        
        // Reset updating flag after a short delay
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }
    }, 300);
  }, [updateFilters]);
  
  // Apply the search filter when user submits
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // Apply search immediately on submit
    setSearchQuery(localSearchQuery);
    
    // Batch update
    batchFilterUpdates({ searchQuery: localSearchQuery });
  };
  
  // Debounced search handling
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    
    // Clear any existing timeout
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a longer debounce for typing
    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
      
      // Batch update
      batchFilterUpdates({ searchQuery: value });
    }, 800);
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
    // Update local state
    setSelectedLocation(location);
    
    // Prepare filter updates
    let updates = {};
    
    if (location) {
      const locationName = location.name || '';
      // Extract the city name from the location name if it includes the type
      const kotaKab = location.type ? locationName.replace(location.type, '').trim() : locationName;
      
      updates = {
        regionId: location.id,
        provinsi: location.provinsi,
        daerahTingkat: location.type || null,
        kotaKab: kotaKab
      };
      
      // Reset region selection when location is selected
      setSelectedRegion(null);
    } else {
      // Reset location filters if location is cleared
      updates = {
        regionId: null,
        daerahTingkat: null,
        kotaKab: null
      };
    }
    
    // Batch update filters
    batchFilterUpdates(updates);
  }, [setSelectedLocation, setSelectedRegion, batchFilterUpdates]);

  const handleRegionSelect = useCallback((region) => {
    // Update local state
    setSelectedRegion(region);
    
    // Prepare filter updates
    let updates = {};
    
    if (region && region.id !== 'all') {
      updates = { regionId: region.id };
      
      if (region.id.startsWith('province-')) {
        updates.provinsi = region.name;
        updates.daerahTingkat = null;
        updates.kotaKab = null;
      } else if (region.id.startsWith('region-')) {
        updates.provinsi = region.provinsi;
        updates.daerahTingkat = region.type;
        const kotaKab = region.name.replace(region.type || '', '').trim();
        updates.kotaKab = kotaKab;
      }
      
      // Reset location search if region is selected
      setSelectedLocation(null);
    } else {
      // Reset region filters if "all" is selected
      updates = {
        regionId: null,
        provinsi: null,
        daerahTingkat: null,
        kotaKab: null
      };
    }
    
    // Batch update filters
    batchFilterUpdates(updates);
  }, [setSelectedRegion, setSelectedLocation, batchFilterUpdates]);
  
  // Handle year filter changes
  const handleYearChange = useCallback((year) => {
    // Update local state
    setFilterYear(year);
    setShowYearDropdown(false);
    
    // Batch update filters
    batchFilterUpdates({ year: parseInt(year, 10) });
  }, [setFilterYear, batchFilterUpdates]);
  
  // Reset to Jakarta Selatan default view
  const handleResetFilter = useCallback(() => {
    // Update local state
    setSelectedLocation(null);
    setLocalSearchQuery('');
    setSearchQuery('');
    
    // Reset to default Jakarta Selatan region
    const defaultRegion = { id: 'all', name: 'Semua Wilayah', provinsi: null, type: null, count: 0 };
    setSelectedRegion(defaultRegion);
    
    // Batch update all filters at once
    batchFilterUpdates({
      searchQuery: '',
      regionId: null,
      provinsi: 'DKI Jakarta',    // Default Jakarta
      daerahTingkat: 'Kota',      // Default Kota
      kotaKab: 'Jakarta Selatan'  // Default Jakarta Selatan
    });
  }, [setSelectedLocation, setSelectedRegion, setSearchQuery, batchFilterUpdates]);
  
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