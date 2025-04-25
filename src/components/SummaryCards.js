import { memo, useMemo } from 'react';
import { BarChart3, Package, FileText, AlertCircle } from 'lucide-react';
import StatCard from './StatCard';
import { useData } from '@/app/context/DataContext';

// Memoized StatCard to prevent unnecessary re-renders
const MemoizedStatCard = memo(StatCard);

function SummaryCards({ 
  // Props for backward compatibility
  data: propsData, 
  isLoading: propsIsLoading,
  // New prop to determine if we use DataContext
  useDataContext = true 
}) {
  // Get data from context if useDataContext is true
  const { dashboardStats, loading } = useDataContext 
    ? useData() 
    : { dashboardStats: {}, loading: { stats: false } };
  
  // Determine which data source to use
  const data = useDataContext ? dashboardStats : propsData;
  const isLoading = useDataContext ? loading.stats : propsIsLoading;
  
  // Create fallback data if none provided
  const fallbackData = useMemo(() => ({
    totalAnggaran: 'Rp 0',
    totalPaket: 0,
    tender: 0,
    dikecualikan: 0
  }), []);
  
  // Use either provided data or fallback
  const displayData = useMemo(() => ({
    ...fallbackData,
    ...data
  }), [data, fallbackData]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MemoizedStatCard 
        icon={<BarChart3 size={18} />}
        title="Total Anggaran"
        value={displayData.totalAnggaran}
        isLoading={isLoading}
      />
      
      <MemoizedStatCard 
        icon={<Package size={18} />}
        title="Total Paket"
        value={displayData.totalPaket}
        isLoading={isLoading}
      />
      
      <MemoizedStatCard 
        icon={<FileText size={18} />}
        title="Tender"
        value={displayData.tender}
        isLoading={isLoading}
      />
      
      <MemoizedStatCard 
        icon={<AlertCircle size={18} />}
        title="Dikecualikan"
        value={displayData.dikecualikan}
        isLoading={isLoading}
      />
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default memo(SummaryCards);