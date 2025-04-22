"use client"

import { useState, useEffect } from 'react';
import PaketTable from './PaketTable';

export default function TableSection({ searchQuery, filterYear, selectedRegion }) {
  // Sample data dengan penambahan field wilayah
  const [tableData, setTableData] = useState([
    { 
      no: 1, 
      nama: 'Pengadaan NIA', 
      satuan: 'Dinas KOM', 
      krema: 'E-Purchasing',
      jadwal: 'April 2025',
      status: 'Sesuai',
      keterangan: 'dil.',
      wilayah: 'Kota Bogor'
    },
    { 
      no: 2, 
      nama: 'Kampanye Kesehatan', 
      satuan: 'Dinas Pnchrlnn', 
      krema: 'E-Purchasing',
      jadwal: 'Mei 2025',
      status: 'Dibth Flnxnnm',
      keterangan: 'dil.',
      wilayah: 'Kabupaten Bogor'
    },
    { 
      no: 3, 
      nama: 'WhatsApp Bisnis', 
      satuan: 'Tender', 
      krema: 'Tender',
      jadwal: 'Juni 2025',
      status: 'Hrge Esak Btorch',
      keterangan: 'dil.',
      wilayah: 'Kota Depok'
    },
    { 
      no: 4, 
      nama: 'Event Seni', 
      satuan: 'Bram Pndslkan', 
      krema: 'Tender',
      jadwal: 'Juni 2025',
      status: 'Sesuai',
      keterangan: '',
      wilayah: 'Kota Bogor'
    },
    { 
      no: 5, 
      nama: 'Renovasi Kantor', 
      satuan: 'DPUPR', 
      krema: 'Tender',
      jadwal: 'Juli 2025',
      status: 'Sesuai',
      keterangan: '',
      wilayah: 'Kota Bandung'
    },
    { 
      no: 6, 
      nama: 'Pengadaan Komputer', 
      satuan: 'DISKOMINFO', 
      krema: 'E-Purchasing',
      jadwal: 'Mei 2025',
      status: 'Sesuai',
      keterangan: '',
      wilayah: 'Kota Bekasi'
    }
  ]);
  
  const [filteredData, setFilteredData] = useState(tableData);
  
  // Filter data berdasarkan pencarian dan wilayah
  useEffect(() => {
    let filtered = tableData;
    
    // Filter berdasarkan query pencarian
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.satuan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter berdasarkan wilayah yang dipilih
    if (selectedRegion && selectedRegion.id !== 'all') {
      filtered = filtered.filter(item => 
        item.wilayah === selectedRegion.name
      );
    }
    
    setFilteredData(filtered);
  }, [searchQuery, tableData, selectedRegion]);
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">Paket Pekerjaan Sesuai</h2>
      <PaketTable data={filteredData} />
    </div>
  );
}