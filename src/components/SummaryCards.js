import { BarChart3, Package, FileText, AlertCircle } from 'lucide-react';
import StatCard from './StatCard';

export default function SummaryCards({ data }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard 
        icon={<BarChart3 size={18} />}
        title="Total Anggaran"
        value={data.totalAnggaran}
      />
      
      <StatCard 
        icon={<Package size={18} />}
        title="Total Paket"
        value={data.totalPaket}
      />
      
      <StatCard 
        icon={<FileText size={18} />}
        title="Tender"
        value={data.tender}
      />
      
      <StatCard 
        icon={<AlertCircle size={18} />}
        title="Dikecualikan"
        value={data.dikecualikan}
      />
    </div>
  );
}