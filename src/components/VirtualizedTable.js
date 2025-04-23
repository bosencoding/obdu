"use client"

import { useRef, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';

export default function VirtualizedTable({ data }) {
  const [dimensions, setDimensions] = useState({ width: 1000, height: 400 });
  const containerRef = useRef(null);
  
  // Status color mapping
  const statusColors = {
    'Sesuai': 'bg-emerald-500',
    'Dibth Flnxnnm': 'bg-amber-500',
    'Hrge Esak Btorch': 'bg-rose-500'
  };
  
  // Format status label function
  const formatStatusLabel = (status) => {
    if (status === 'Sesuai') return 'Sesuai';
    if (status === 'Dibth Flnxnnm') return 'Dibatalkan';
    if (status === 'Hrge Esak Btorch') return 'Terlambat';
    return status;
  };
  
  // Update dimensions on resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 400 // Fixed height or you can calculate based on container
        });
      }
    };
    
    // Set initial dimensions
    updateDimensions();
    
    // Add resize listener
    window.addEventListener('resize', updateDimensions);
    
    // Clean up
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Table header component
  const TableHeader = () => (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="flex items-center h-10">
        <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">No</div>
        <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex-1">Nama Paket</div>
        <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Satuan</div>
        <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Metode</div>
        <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Jadwal</div>
        <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Wilayah</div>
        <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Status</div>
        <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Keterangan</div>
      </div>
    </div>
  );
  
  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="overflow-x-auto" ref={containerRef}>
        <TableHeader />
        <div className="py-8 text-center text-gray-500">
          Tidak ada data yang ditemukan
        </div>
      </div>
    );
  }
  
  // Row component
  const Row = ({ index, style }) => {
    const row = data[index];
    return (
      <div 
        style={style} 
        className={`flex items-center hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
      >
        <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-16">{row.no}</div>
        <div className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex-1 truncate" title={row.nama}>{row.nama}</div>
        <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-32 truncate" title={row.satuan}>{row.satuan}</div>
        <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-32 truncate" title={row.krema}>{row.krema}</div>
        <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-32 truncate" title={row.jadwal}>{row.jadwal}</div>
        <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-32 truncate" title={row.wilayah}>{row.wilayah}</div>
        <div className="px-6 py-4 whitespace-nowrap w-32">
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[row.status] || 'bg-gray-100'} text-white`}>
            {formatStatusLabel(row.status)}
          </span>
        </div>
        <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-32 truncate" title={row.keterangan}>{row.keterangan}</div>
      </div>
    );
  };
  
  return (
    <div className="overflow-x-auto" ref={containerRef}>
      <TableHeader />
      <List
        height={dimensions.height}
        itemCount={data.length}
        itemSize={40} // Altura de cada fila
        width={dimensions.width}
      >
        {Row}
      </List>
    </div>
  );
}