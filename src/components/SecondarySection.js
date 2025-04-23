import { Package, Users } from 'lucide-react';
import StatCard from './StatCard';

export default function SecondarySection({ data }) {
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
      
      {/* Empty div to maintain grid layout */}
      <div></div>
    </div>
  );
}