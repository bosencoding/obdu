import { useState } from 'react';
import { Search, Filter, Download, ChevronDown } from 'lucide-react';
import RegionDropdown from './RegionDropdown';

export default function FilterBar({ 
  searchQuery, 
  setSearchQuery, 
  filterYear, 
  setFilterYear,
  selectedRegion,
  setSelectedRegion
}) {
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const years = ['2021', '2022', '2023', '2024', '2025'];
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-grow">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari paket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Region Dropdown */}
          <div className="w-full sm:w-48">
            <RegionDropdown 
              selectedRegion={selectedRegion} 
              setSelectedRegion={setSelectedRegion} 
            />
          </div>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
              <Filter size={16} />
              <span>Filter</span>
            </button>
            
            <button className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
              <Download size={16} />
              <span>Export</span>
            </button>
            
            <div className="relative">
              <button 
                className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                onClick={() => setShowYearDropdown(!showYearDropdown)}
              >
                <span>Tahun: {filterYear}</span>
                <ChevronDown size={16} />
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
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}