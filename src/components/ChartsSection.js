"use client"

import PieChartComponent from './PieChartComponent';
import BarChartComponent from './BarChartComponent';

export default function ChartsSection() {
  // Data untuk chart
  const pieData = [
    { name: 'Event Budaya', value: 46.1 },
    { name: 'Kesehatan', value: 28.4 },
    { name: 'WhatsApp Bisnis', value: 15.2 },
    { name: 'Event Seni', value: 10.3 }
  ];
  
  const barData = [
    { name: 'Event Budaya', value: 30 },
    { name: 'Kampanye Kesehatan', value: 24 },
    { name: 'WhatsApp Bisnis', value: 18 },
    { name: 'Event Seni Bisnis', value: 15 },
    { name: 'Event Budaya 2', value: 12 },
    { name: 'WhatsApp Bisnis 2', value: 8 },
    { name: 'Lainnya', value: 5 }
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4">Distribusi Paket Pekerjaan</h2>
        <div className="h-64">
          <PieChartComponent data={pieData} />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4">Paket Pekerjaan Sesuai</h2>
        <div className="h-64">
          <BarChartComponent data={barData} />
        </div>
      </div>
    </div>
  );
}
