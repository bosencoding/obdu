import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, ChevronDown, Loader } from 'lucide-react';
import { getRegionsList } from '@/app/apiService';
import { useData } from '@/app/context/DataContext';

export default function RegionDropdown({ selectedRegion, setSelectedRegion }) {
  const [isOpen, setIsOpen] = useState(false);
  const [regions, setRegions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const regionsLoadedRef = useRef(false);
  const dropdownRef = useRef(null);

  // Get data from context for better integration
  const { filters, regions: contextRegions } = useData();

  // Default "Semua Wilayah" option
  const defaultRegion = { id: 'all', name: 'Semua Wilayah', provinsi: null, type: null, count: 0 };
  
  // Default Jakarta Selatan option
  const jakartaSelatanRegion = { 
    id: 'region-jaksel',
    name: 'Kota Jakarta Selatan', 
    provinsi: 'DKI Jakarta', 
    type: 'Kota', 
    count: 542
  };

  // Function to find a region that matches given criteria
  const findRegion = useCallback((criteria) => {
    if (!regions || !regions.length) return null;
    
    return regions.find(region => {
      if (criteria.id && region.id === criteria.id) return true;
      if (criteria.name && region.name === criteria.name) return true;
      if (criteria.type && criteria.kotaKab && 
          region.type === criteria.type && 
          region.name.includes(criteria.kotaKab)) return true;
      return false;
    });
  }, [regions]);

  // Create a region object from filter parameters
  const createRegionFromFilters = useCallback((filters) => {
    if (!filters) return null;
    
    // Try to create a region object from filters
    if (filters.daerahTingkat && filters.kotaKab && filters.provinsi) {
      return {
        id: filters.regionId || `region-${Date.now()}`,
        name: `${filters.daerahTingkat} ${filters.kotaKab}`,
        provinsi: filters.provinsi,
        type: filters.daerahTingkat,
        count: 0
      };
    } else if (filters.provinsi && !filters.kotaKab) {
      return {
        id: filters.regionId || `province-${Date.now()}`,
        name: filters.provinsi,
        provinsi: filters.provinsi,
        type: null,
        count: 0
      };
    }
    
    return null;
  }, []);

  // Load regions when component mounts
  useEffect(() => {
    async function fetchRegions() {
      // Skip if we've already loaded regions
      if (regionsLoadedRef.current) return;
      
      // If we have regions from context, use those
      if (contextRegions && contextRegions.length > 0) {
        // Check if Jakarta Selatan already exists
        const jakselExists = contextRegions.some(region => 
          region.name === 'Kota Jakarta Selatan' || 
          (region.type === 'Kota' && region.name.includes('Jakarta Selatan'))
        );
        
        // Create final regions list
        const finalRegions = [...contextRegions];
        
        // Add Jakarta Selatan if it doesn't exist
        if (!jakselExists) {
          finalRegions.unshift(jakartaSelatanRegion);
        }
        
        // Make sure "all" option is first
        if (!finalRegions.some(r => r.id === 'all')) {
          finalRegions.unshift(defaultRegion);
        }
        
        setRegions(finalRegions);
        regionsLoadedRef.current = true;
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Use the API service function
        const data = await getRegionsList();
        
        // Find if Jakarta Selatan already exists in the data
        const jakselExists = data.some(region => 
          region.name === 'Kota Jakarta Selatan' || 
          (region.type === 'Kota' && region.name.includes('Jakarta Selatan'))
        );
        
        // Add Jakarta Selatan at the top if it doesn't exist
        const finalRegions = [...data];
        if (!jakselExists) {
          finalRegions.unshift(jakartaSelatanRegion);
        }
        
        // Add default "Semua Wilayah" option
        if (!finalRegions.some(r => r.id === 'all')) {
          finalRegions.unshift(defaultRegion);
        }
        
        setRegions(finalRegions);
        regionsLoadedRef.current = true;
      } catch (err) {
        console.error('Error fetching regions:', err);
        setError('Gagal memuat data wilayah');
        // Provide fallback data with Jakarta Selatan
        setRegions([defaultRegion, jakartaSelatanRegion]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRegions();
  }, [contextRegions]);

  // Sync with global filters when they change
  useEffect(() => {
    // Only run if we have regions and global filters but don't have a selected region yet
    if (regions.length > 0 && filters && (!selectedRegion || selectedRegion.id === 'all')) {
      // Try to find a matching region based on filters
      const matchingRegion = findRegion({
        id: filters.regionId,
        type: filters.daerahTingkat,
        kotaKab: filters.kotaKab
      });
      
      if (matchingRegion) {
        // Update selected region if we found a matching one
        if (setSelectedRegion) {
          setSelectedRegion(matchingRegion);
        }
      } else if (filters.daerahTingkat && filters.kotaKab) {
        // Create a new region object from filters if we can't find one
        const newRegion = createRegionFromFilters(filters);
        if (newRegion && setSelectedRegion) {
          setSelectedRegion(newRegion);
        }
      } else if (!selectedRegion && regions.length > 0) {
        // Default to Jakarta Selatan if no filters match and no selection
        const jakselRegion = regions.find(r => 
          r.name === 'Kota Jakarta Selatan' || 
          (r.type === 'Kota' && r.name.includes('Jakarta Selatan'))
        );
        
        // Use Jakarta Selatan if found, otherwise use first region
        if (jakselRegion && setSelectedRegion) {
          setSelectedRegion(jakselRegion);
        } else if (setSelectedRegion) {
          setSelectedRegion(regions[0]);
        }
      }
    }
  }, [regions, filters, selectedRegion, setSelectedRegion, findRegion, createRegionFromFilters]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle dropdown open/closed
  const toggleDropdown = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  // Select a region from the dropdown
  const selectRegion = useCallback((region) => {
    if (setSelectedRegion) {
      setSelectedRegion(region);
    }
    setIsOpen(false);
  }, [setSelectedRegion]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader size={16} className="text-gray-500 animate-spin" />
        ) : (
          <MapPin size={16} className="text-gray-500" />
        )}
        <span className="text-sm flex-grow text-left truncate">
          {isLoading ? 'Memuat...' : (selectedRegion ? selectedRegion.name : 'Kota Jakarta Selatan')}
        </span>
        <ChevronDown size={16} className="text-gray-500" />
      </button>
      
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-20 max-h-80 overflow-y-auto">
          {error && (
            <div className="px-4 py-2 text-sm text-red-500">{error}</div>
          )}
          
          {regions.map(region => (
            <button 
              key={region.id}
              onClick={() => selectRegion(region)}
              className={`block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm ${
                selectedRegion?.id === region.id ? 'bg-gray-50' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={region.id === 'all' ? 'font-medium' : ''}>{region.name}</span>
                {region.count > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {region.count}
                  </span>
                )}
              </div>
              {region.provinsi && region.id !== 'all' && (
                <div className="text-xs text-gray-500">{region.provinsi}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}