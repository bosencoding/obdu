// Improved FilterBar.js with better search and filter integration

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
  // Get updateFilters and filters directly from DataContext for centralized state management
  const { updateFilters, filters, fetchAllDashboardData } = useData();
  
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debounceTimerRef = useRef(null);
  const years = ['2021', '2022', '2023', '2024', '2025'];
  
  // Sync local state with global filters initially and when global filters change
  useEffect(() => {
    if (filters?.searchQuery !== undefined && filters.searchQuery !== localSearchQuery) {
      setLocalSearchQuery(filters.searchQuery);
    }
  }, [filters]);
  
  // Debounce search query to prevent excessive API calls
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (localSearchQuery !== searchQuery) {
        // Update the parent's state via prop
        if (setSearchQuery) {
          setSearchQuery(localSearchQuery);
        }
        
        // Update global filters for search
        if (updateFilters) {
          updateFilters({ 
            searchQuery: localSearchQuery,
            page: 1 // Reset to page 1 when search changes
          });
        }
      }
    }, 500); // Wait 500ms after user stops typing
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [localSearchQuery, searchQuery, setSearchQuery, updateFilters]);
  
  // Callbacks for location and region selection with central state management
  const handleLocationSelect = useCallback((location) => {
    // Update local state
    if (setSelectedLocation) {
      setSelectedLocation(location);
    }
    
    // Reset region selection when location is selected
    if (location && setSelectedRegion) {
      setSelectedRegion(null);
    }
    
    // Update filters directly when location changes
    if (updateFilters) {
      if (location) {
        const filterUpdates = {
          regionId: location.id,
          provinsi: location.provinsi,
          daerahTingkat: location.type || null,
          kotaKab: location.name && location.type ? 
                  location.name.replace(location.type, '').trim() : 
                  location.name,
          page: 1 // Reset to page 1 when location changes
        };
        updateFilters(filterUpdates);
      } else {
        // Reset location filters if location is cleared
        updateFilters({
          regionId: null,
          daerahTingkat: null,
          kotaKab: null,
          page: 1 // Reset to page 1
        });
      }
    }
  }, [setSelectedLocation, setSelectedRegion, updateFilters]);

  const handleRegionSelect = useCallback((region) => {
    // Update local state
    if (setSelectedRegion) {
      setSelectedRegion(region);
    }
    
    // Reset location selection if region is selected
    if (region && region.id !== 'all' && setSelectedLocation) {
      setSelectedLocation(null);
    }
    
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
          page: 1 // Reset to page 1
        });
      }
    }
  }, [setSelectedRegion, setSelectedLocation, updateFilters]);
  
  // Handle year filter changes
  const handleYearChange = useCallback((year) => {
    if (setFilterYear) {
      setFilterYear(year);
    }
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
    // Reset local state
    if (setSelectedLocation) {
      setSelectedLocation(null);
    }
    
    if (setSearchQuery) {
      setSearchQuery('');
    }
    
    setLocalSearchQuery('');
    
    // Set to default Jakarta Selatan region
    if (setSelectedRegion) {
      // Either reset to "all" or you can create a default Jakarta Selatan region
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
        page: 1                      // Reset to page 1
      });
    }
  }, [setSelectedLocation, setSelectedRegion, setSearchQuery, updateFilters]);
  
  // Create Jakarta Selatan filter label if no specific filters are applied
  const isDefaultJakselView = !searchQuery && 
    (!selectedRegion || selectedRegion.id === 'all') && 
    !selectedLocation;
  
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
          
          <button 
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            onClick={handleExportData}
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          
          {/* Year Dropdown - Updated with direct filter updating */}
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
      </div>
      
      {/* Location Search and Region Dropdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AutocompleteSearch onLocationSelect={handleLocationSelect} />
        <RegionDropdown selectedRegion={selectedRegion} setSelectedRegion={handleRegionSelect} />
      </div>
      
      {/* Active Location Filter Indicator */}
      {isDefaultJakselView ? (
        <div className="mt-2 text-sm text-gray-500">
          Filter lokasi default: Kota Jakarta Selatan
          {/* No reset button needed for default view */}
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
      ) : null}
    </div>
  );
}

// Placeholder for handleExportData function
function handleExportData() {
  alert('Data akan diekspor (fungsi belum diimplementasikan)');
}