import { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, Loader, Search } from 'lucide-react';
import { getRegionsList } from '@/app/apiService';

export default function RegionDropdown({ selectedRegion, setSelectedRegion }) {
  const [isOpen, setIsOpen] = useState(false);
  const [regions, setRegions] = useState([]);
  const [filteredRegions, setFilteredRegions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

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

  // Fetch regions on component mount
  useEffect(() => {
    async function fetchRegions() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Use the API service function
        const data = await getRegionsList();
        
        // Find if Jakarta Selatan already exists in the data
        // Find if a region matching "Jakarta Selatan" exists in the data
        // Be more flexible to match potential backend variations
        const jakselRegionFromApi = data.find(region =>
          (region.name && region.name.toLowerCase().includes('jakarta selatan') && region.type === 'Kota') ||
          (region.provinsi && region.provinsi.toLowerCase().includes('dki jakarta') && region.type === 'Kota' && region.name.toLowerCase().includes('jakarta selatan'))
        );

        let regionsToSet = data;

        // Add default "Semua Wilayah" option at the beginning
        regionsToSet.unshift(defaultRegion);

        // If "Kota Jakarta Selatan" wasn't found in API data, add the mock version
        if (!jakselRegionFromApi) {
           // Check if a region with the mock ID already exists to avoid duplicates
           const mockJakselExists = regionsToSet.some(region => region.id === jakartaSelatanRegion.id);
           if (!mockJakselExists) {
             regionsToSet.splice(1, 0, jakartaSelatanRegion); // Add after "Semua Wilayah"
           }
        }


        setRegions(regionsToSet);
        setFilteredRegions(regionsToSet);
      } catch (err) {
        console.error('Error fetching regions:', err);
        setError('Gagal memuat data wilayah');
        // Provide fallback data with "Semua Wilayah" and mock Jakarta Selatan
        const fallbackRegions = [defaultRegion, jakartaSelatanRegion];
        setRegions(fallbackRegions);
        setFilteredRegions(fallbackRegions);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRegions();
  }, []);

  // Set default region if not already set
  useEffect(() => {
    if (!selectedRegion && regions.length > 0) {
      // Try to find the actual "Kota Jakarta Selatan" from the fetched regions first
      const jakselRegion = regions.find(r =>
         (r.name && r.name.toLowerCase().includes('jakarta selatan') && r.type === 'Kota') ||
         (r.provinsi && r.provinsi.toLowerCase().includes('dki jakarta') && r.type === 'Kota' && r.name.toLowerCase().includes('jakarta selatan'))
      );

      // Use the found Jakarta Selatan region, or fallback to the mock one, or finally "Semua Wilayah"
      const defaultSelection = jakselRegion || regions.find(r => r.id === jakartaSelatanRegion.id) || regions[0];
      setSelectedRegion(defaultSelection);
    }
  }, [regions, selectedRegion, setSelectedRegion]);

  // Filter regions based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRegions(regions);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = regions.filter(region => 
        region.id === 'all' || // Always include "Semua Wilayah"
        region.name.toLowerCase().includes(term) || 
        (region.provinsi && region.provinsi.toLowerCase().includes(term)) ||
        (region.type && region.type.toLowerCase().includes(term))
      );
      setFilteredRegions(filtered);
    }
  }, [searchTerm, regions]);

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

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Reset search term when opening dropdown
      setSearchTerm('');
      setFilteredRegions(regions);
    }
  };

  const selectRegion = (region) => {
    setSelectedRegion(region);
    setIsOpen(false);
    
    // Make sure this change propagates to parent components
    if (typeof setSelectedRegion === 'function') {
      setSelectedRegion(region);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

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
          {/* Search input */}
          <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Cari wilayah..."
                className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>
          
          {error && (
            <div className="px-4 py-2 text-sm text-red-500">{error}</div>
          )}
          
          {filteredRegions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Tidak ditemukan wilayah yang sesuai
            </div>
          ) : (
            filteredRegions.map(region => (
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
            ))
          )}
        </div>
      )}
    </div>
  );
}