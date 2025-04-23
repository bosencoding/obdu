"use client"

import PieChartComponent from './PieChartComponent';
import BarChartComponent from './BarChartComponent';

export default function ChartsSection({ pieData, barData, isLoading }) {
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
  
  // Gunakan data dari props jika tersedia, jika tidak gunakan default
  const finalPieData = pieData && pieData.length > 0 ? pieData : defaultPieData;
  const finalBarData = barData && barData.length > 0 ? barData : defaultBarData;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4">Distribusi Paket Pekerjaan</h2>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="h-64">
            <PieChartComponent data={finalPieData} />
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4">Paket Pekerjaan Sesuai</h2>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="h-64">
            <BarChartComponent data={finalBarData} />
          </div>
        )}
      </div>
    </div>
  );
}