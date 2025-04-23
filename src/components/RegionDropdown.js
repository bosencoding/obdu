import { useState, useEffect } from 'react';
import { MapPin, ChevronDown, Loader } from 'lucide-react';
import { getRegionsList } from '@/app/apiService';

export default function RegionDropdown({ selectedRegion, setSelectedRegion }) {
  const [isOpen, setIsOpen] = useState(false);
  const [regions, setRegions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Default "Semua Wilayah" option
  const defaultRegion = { id: 'all', name: 'Semua Wilayah', provinsi: null, type: null, count: 0 };

  useEffect(() => {
    async function fetchRegions() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Use the API service function
        const data = await getRegionsList();
        
        // Add default "Semua Wilayah" option
        setRegions([defaultRegion, ...data]);
      } catch (err) {
        console.error('Error fetching regions:', err);
        setError('Gagal memuat data wilayah');
        // Provide fallback data
        setRegions([defaultRegion]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRegions();
  }, []);

  // Set default region if not already set
  useEffect(() => {
    if (!selectedRegion && regions.length > 0) {
      setSelectedRegion(regions[0]);
    }
  }, [regions, selectedRegion, setSelectedRegion]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const selectRegion = (region) => {
    setSelectedRegion(region);
    setIsOpen(false);
  };

  return (
    <div className="relative">
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
          {isLoading ? 'Memuat...' : (selectedRegion ? selectedRegion.name : 'Pilih Wilayah')}
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
              {region.provinsi && region.id !== 'all' && region.id.startsWith('region-') && (
                <div className="text-xs text-gray-500">{region.provinsi}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}