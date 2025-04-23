"use client"

import { memo, Suspense, lazy } from 'react';

// Komponen chart placeholder saat loading
const ChartPlaceholder = () => (
  <div className="h-64 w-full bg-gray-100 animate-pulse rounded"></div>
);

// Lazy load chart components dengan Suspense
const PieChartComponent = lazy(() => import('./PieChartComponent'));
const BarChartComponent = lazy(() => import('./BarChartComponent'));

// Default data jika data dari API kosong atau belum tersedia
const defaultPieData = [
  { name: 'Event Budaya', value: 46.1 },
  { name: 'Kesehatan', value: 28.4 },
  { name: 'WhatsApp Bisnis', value: 15.2 },
  { name: 'Event Seni', value: 10.3 }
];

const defaultBarData = [
  { name: 'Event Budaya', value: 30 },
  { name: 'Kampanye Kesehatan', value: 24 },
  { name: 'WhatsApp Bisnis', value: 18 },
  { name: 'Event Seni Bisnis', value: 15 },
  { name: 'Event Budaya 2', value: 12 },
  { name: 'WhatsApp Bisnis 2', value: 8 },
  { name: 'Lainnya', value: 5 }
];

// Memoized chart components to prevent unnecessary re-renders
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

function ChartsSection({ pieData, barData, isLoading }) {
  // Gunakan data dari props jika tersedia, jika tidak gunakan default
  const finalPieData = pieData && pieData.length > 0 ? pieData : defaultPieData;
  const finalBarData = barData && barData.length > 0 ? barData : defaultBarData;
  
  // Loading state template
  const LoadingChart = () => (
    <div className="h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4">Distribusi Paket Pekerjaan</h2>
        {isLoading ? (
          <LoadingChart />
        ) : (
          <div className="h-64">
            <MemoizedPieChart data={finalPieData} />
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4">Paket Pekerjaan Sesuai</h2>
        {isLoading ? (
          <LoadingChart />
        ) : (
          <div className="h-64">
            <MemoizedBarChart data={finalBarData} />
          </div>
        )}
      </div>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default memo(ChartsSection);