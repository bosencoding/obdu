import { memo } from 'react';
import { BarChart3, Package, FileText, AlertCircle } from 'lucide-react';
import StatCard from './StatCard';

// Memoized StatCard to prevent unnecessary re-renders
const MemoizedStatCard = memo(StatCard);

function SummaryCards({ data, isLoading }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MemoizedStatCard 
        icon={<BarChart3 size={18} />}
        title="Total Anggaran"
        value={data.totalAnggaran}
        isLoading={isLoading}
      />
      
      <MemoizedStatCard 
        icon={<Package size={18} />}
        title="Total Paket"
        value={data.totalPaket}
        isLoading={isLoading}
      />
      
      <MemoizedStatCard 
        icon={<FileText size={18} />}
        title="Tender"
        value={data.tender}
        isLoading={isLoading}
      />
      
      <MemoizedStatCard 
        icon={<AlertCircle size={18} />}
        title="Dikecualikan"
        value={data.dikecualikan}
        isLoading={isLoading}
      />
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default memo(SummaryCards);