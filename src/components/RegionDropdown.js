import { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';

export default function RegionDropdown({ selectedRegion, setSelectedRegion }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Data contoh kota/kabupaten
  const regions = [
    { id: 'all', name: 'Semua Wilayah' },
    { id: 'bogor', name: 'Kota Bogor' },
    { id: 'depok', name: 'Kota Depok' },
    { id: 'bekasi', name: 'Kota Bekasi' },
    { id: 'bogorkab', name: 'Kabupaten Bogor' },
    { id: 'sukabumi', name: 'Kota Sukabumi' },
    { id: 'sukabumiKab', name: 'Kabupaten Sukabumi' },
    { id: 'bandung', name: 'Kota Bandung' },
    { id: 'bandungKab', name: 'Kabupaten Bandung' }
  ];

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
      >
        <MapPin size={16} className="text-gray-500" />
        <span className="text-sm flex-grow text-left">
          {selectedRegion ? selectedRegion.name : 'Pilih Wilayah'}
        </span>
        <ChevronDown size={16} className="text-gray-500" />
      </button>
      
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
          {regions.map(region => (
            <button 
              key={region.id}
              onClick={() => selectRegion(region)}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
            >
              {region.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}