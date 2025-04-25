"use client"

import { memo, Suspense, lazy, useMemo } from 'react';
import { useData } from '@/app/context/DataContext';

// Komponen chart placeholder saat loading
const ChartPlaceholder = () => (
  <div className="h-64 w-full bg-gray-100 animate-pulse rounded"></div>
);

// Lazy load chart components untuk performa lebih baik
const PieChartComponent = lazy(() => import('./PieChartComponent'));
const BarChartComponent = lazy(() => import('./BarChartComponent'));

// Memoized chart components untuk mencegah re-render yang tidak perlu
const MemoizedPieChart = memo(({ data }) => (
  <Suspense fallback={<ChartPlaceholder />}>
    <PieChartComponent data={data} />
  </Suspense>
));

const MemoizedBarChart = memo(({ data }) => (
  <Suspense fallback={<ChartPlaceholder />}>
    <BarChartComponent data={data} />
  </Suspense>
));

// Komponen untuk state loading
const LoadingChart = () => (
  <div className="h-64 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
);

// Komponen untuk state error
const ErrorChart = ({ message }) => (
  <div className="h-64 flex flex-col items-center justify-center">
    <p className="text-red-500">Gagal memuat chart</p>
    {message && <p className="text-sm text-gray-500 mt-2">{message}</p>}
  </div>
);

// Komponen untuk state kosong
const EmptyChart = ({ type }) => (
  <div className="h-64 flex flex-col items-center justify-center">
    <p className="text-gray-500">Tidak ada data {type === 'pie' ? 'distribusi' : 'paket'}</p>
  </div>
);

function ChartsSection({ 
  // Props for backward compatibility
  pieData: propsPieData, 
  barData: propsBarData, 
  isLoading: propsIsLoading,
  // New prop to determine if we use the DataContext
  useDataContext = true
}) {
  // Get data from context if useDataContext is true
  const { chartData, loading, error } = useDataContext 
    ? useData() 
    : { chartData: { pie: [], bar: [] }, loading: { charts: false }, error: {} };
  
  // Determine which data source to use
  const pieData = useDataContext ? chartData.pie : propsPieData;
  const barData = useDataContext ? chartData.bar : propsBarData;
  const isLoading = useDataContext ? loading.charts : propsIsLoading;
  const errorMessage = useDataContext ? error?.dashboard || error?.charts : null;
  
  // Check if we have valid data
  const hasPieData = Array.isArray(pieData) && pieData.length > 0;
  const hasBarData = Array.isArray(barData) && barData.length > 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4">Distribusi Paket Pekerjaan</h2>
        {isLoading ? (
          <LoadingChart />
        ) : errorMessage ? (
          <ErrorChart message={errorMessage} />
        ) : !hasPieData ? (
          <EmptyChart type="pie" />
        ) : (
          <div className="h-64">
            <MemoizedPieChart data={pieData} />
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4">Paket Pekerjaan Teratas</h2>
        {isLoading ? (
          <LoadingChart />
        ) : errorMessage ? (
          <ErrorChart message={errorMessage} />
        ) : !hasBarData ? (
          <EmptyChart type="bar" />
        ) : (
          <div className="h-64">
            <MemoizedBarChart data={barData} />
          </div>
        )}
      </div>
    </div>
  );
}

// Export memoized component untuk mencegah re-render yang tidak perlu
export default memo(ChartsSection);