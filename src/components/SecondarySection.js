import { Package, Users } from 'lucide-react';
import StatCard from './StatCard';
import FilterBar from './FilterBar';

export default function SecondarySection({ 
  data, 
  searchQuery, 
  setSearchQuery, 
  filterYear, 
  setFilterYear,
  selectedRegion,
  setSelectedRegion
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Secondary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard 
          icon={<Package size={18} />}
          title="e-Purchasing"
          value={data.epkem}
        />
        
        <StatCard 
          icon={<Users size={18} />}
          title="Pengadaan Langsung"
          value={data.pengadaanLangsung}
        />
      </div>
      
      {/* Filter Area with Region Dropdown */}
      <FilterBar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery}
        filterYear={filterYear}
        setFilterYear={setFilterYear}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
      />
    </div>
  );
}