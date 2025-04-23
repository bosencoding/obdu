// src/app/context/DataContext.js
'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getDashboardStats, getChartData, getFilteredPackages } from '@/app/apiService';

// Create context
const DataContext = createContext();

// Custom hook to use the data context
export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

// Provider component
export function DataProvider({ children }) {
  // Shared state
  const [dashboardStats, setDashboardStats] = useState({
    totalAnggaran: 'Rp 0',
    totalPaket: 0,
    tender: 0,
    dikecualikan: 0,
    epkem: 0,
    pengadaanLangsung: 0
  });
  
  const [chartData, setChartData] = useState({
    pie: [],
    bar: []
  });
  
  const [tableData, setTableData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  
  const [loadingState, setLoadingState] = useState({
    stats: false,
    charts: false,
    table: false
  });

  // Load default Jakarta Selatan data on initial render
  useEffect(() => {
    // Load Jakarta Selatan data by default
    const loadDefaultData = async () => {
      setLoadingState({ stats: true, charts: true, table: true });
      
      try {
        // Default Jakarta Selatan filters
        const defaultFilters = {
          provinsi: 'DKI Jakarta',
          daerahTingkat: 'Kota',
          kotaKab: 'Jakarta Selatan'
        };
        
        // Fetch all data for Jakarta Selatan
        await Promise.all([
          fetchDashboardStats(defaultFilters),
          fetchChartData(defaultFilters),
          fetchTableData(1, 10, defaultFilters)
        ]);
      } catch (error) {
        console.error('Error loading default Jakarta Selatan data:', error);
        // Use fallback data if API fails
      } finally {
        setLoadingState({ stats: false, charts: false, table: false });
      }
    };
    
    loadDefaultData();
  }, []);
  
  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async (filters = {}) => {
    setLoadingState(prev => ({ ...prev, stats: true }));
    try {
      const stats = await getDashboardStats(filters);
      setDashboardStats(stats);
      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default Jakarta Selatan stats on error
      const jakselStats = {
        totalAnggaran: 'Rp 15,780,000,000',
        totalPaket: 128,
        tender: 42,
        dikecualikan: 17,
        epkem: 38,
        pengadaanLangsung: 31
      };
      setDashboardStats(jakselStats);
      return jakselStats;
    } finally {
      setLoadingState(prev => ({ ...prev, stats: false }));
    }
  }, []);
  
  // Fetch chart data
  const fetchChartData = useCallback(async (filters = {}) => {
    setLoadingState(prev => ({ ...prev, charts: true }));
    try {
      const [pieData, barData] = await Promise.all([
        getChartData('pie', filters),
        getChartData('bar', filters)
      ]);
      
      const newChartData = { pie: pieData, bar: barData };
      setChartData(newChartData);
      return newChartData;
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Jakarta Selatan fallback chart data
      const jakselChartData = {
        pie: [
          { name: 'Jasa Lainnya', value: 42.5 },
          { name: 'Barang', value: 28.7 },
          { name: 'Jasa Konsultansi', value: 16.8 },
          { name: 'Pekerjaan Konstruksi', value: 12.0 }
        ],
        bar: [
          { name: 'Pengadaan WhatsApp Business API', value: 2450000000 },
          { name: 'Sistem Notifikasi WhatsApp', value: 1850000000 },
          { name: 'Integrasi WhatsApp ke Sistem', value: 1650000000 },
          { name: 'Workshop Pelatihan WhatsApp', value: 1250000000 },
          { name: 'Pengembangan Chatbot WhatsApp', value: 950000000 },
          { name: 'Pembuatan Konten Marketing', value: 750000000 }
        ]
      };
      setChartData(jakselChartData);
      return jakselChartData;
    } finally {
      setLoadingState(prev => ({ ...prev, charts: false }));
    }
  }, []);
  
  // Fetch table data with pagination
  const fetchTableData = useCallback(async (page = 1, pageSize = 10, filters = {}) => {
    setLoadingState(prev => ({ ...prev, table: true }));
    try {
      const apiFilters = {
        ...filters,
        skip: (page - 1) * pageSize,
        limit: pageSize
      };
      
      const data = await getFilteredPackages(apiFilters);
      
      // Transform data for the table component
      const formattedData = data.map((item, index) => ({
        no: (page - 1) * pageSize + index + 1,
        nama: item.paket,
        satuan: item.satuan_kerja,
        krema: item.metode,
        jadwal: item.pemilihan || 'Belum ditentukan',
        wilayah: item.lokasi || item.provinsi ? `${item.daerah_tingkat || 'Kota'} ${item.kota_kab || ''}, ${item.provinsi || ''}`.trim() : '-',
        status: determineStatus(item),
        keterangan: item.jenis_pengadaan || '-'
      }));
      
      setTableData(formattedData);
      
      // Set total items
      if (data.length === pageSize) {
        setTotalItems(Math.max(totalItems, page * pageSize + 1));
      } else if (data.length < pageSize && page === 1) {
        setTotalItems(data.length);
      }
      
      return { data: formattedData, total: totalItems };
    } catch (error) {
      console.error('Error fetching table data:', error);
      
      // Jakarta Selatan fallback data
      const jakselFallbackData = generateJakselFallbackData(page, pageSize);
      setTableData(jakselFallbackData);
      setTotalItems(jakselFallbackData.length > 0 ? 128 : 0); // Simulate total count
      
      return { data: jakselFallbackData, total: 128 };
    } finally {
      setLoadingState(prev => ({ ...prev, table: false }));
    }
  }, [totalItems]);
  
  // Generate Jakarta Selatan fallback data
  function generateJakselFallbackData(page = 1, pageSize = 10) {
    const baseData = [
      { 
        no: 1,
        nama: 'Pengadaan WhatsApp Business API untuk UMKM Jakarta Selatan', 
        satuan: 'Dinas KUMKM Jakarta Selatan', 
        krema: 'E-Purchasing',
        jadwal: 'Mei 2025',
        status: 'Sesuai',
        keterangan: 'Jasa',
        wilayah: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        no: 2,
        nama: 'Workshop Pelatihan Penggunaan WhatsApp Business', 
        satuan: 'Bidang Ekonomi Digital', 
        krema: 'Tender',
        jadwal: 'Juni 2025',
        status: 'Sesuai',
        keterangan: 'Jasa Konsultansi',
        wilayah: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        no: 3,
        nama: 'Pembuatan Konten Digital WhatsApp Marketing', 
        satuan: 'Dinas Kominfo Jakarta Selatan', 
        krema: 'Pengadaan Langsung',
        jadwal: 'April 2025',
        status: 'Sesuai',
        keterangan: 'Jasa Lainnya',
        wilayah: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        no: 4,
        nama: 'Pengembangan Chatbot WhatsApp untuk Layanan Publik', 
        satuan: 'Dinas Kominfo Jakarta Selatan', 
        krema: 'Tender',
        jadwal: 'Juli 2025',
        status: 'Sesuai',
        keterangan: 'Jasa',
        wilayah: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        no: 5,
        nama: 'Sistem Notifikasi WhatsApp untuk Pelayanan Kesehatan', 
        satuan: 'Dinas Kesehatan Jakarta Selatan', 
        krema: 'E-Purchasing',
        jadwal: 'Mei 2025',
        status: 'Dibth Flnxnnm',
        keterangan: 'Jasa',
        wilayah: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        no: 6,
        nama: 'Implementasi WhatsApp API untuk Pusat Pelayanan Terpadu', 
        satuan: 'Kantor Walikota Jakarta Selatan', 
        krema: 'Seleksi Langsung',
        jadwal: 'Juni 2025',
        status: 'Sesuai',
        keterangan: 'Jasa Konsultansi',
        wilayah: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        no: 7,
        nama: 'Sewa Perangkat untuk Pengelolaan WhatsApp Business',
        satuan: 'Dinas KUMKM Jakarta Selatan', 
        krema: 'E-Purchasing',
        jadwal: 'April 2025',
        status: 'Hrge Esak Btorch',
        keterangan: 'Barang',
        wilayah: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        no: 8,
        nama: 'Integrasi WhatsApp ke Sistem Informasi Kecamatan',
        satuan: 'Kecamatan Pancoran', 
        krema: 'Pengadaan Langsung',
        jadwal: 'Mei 2025',
        status: 'Sesuai',
        keterangan: 'Jasa',
        wilayah: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        no: 9,
        nama: 'Perawatan Sistem WhatsApp Business Tahunan', 
        satuan: 'Dinas Kominfo Jakarta Selatan', 
        krema: 'Pengadaan Langsung',
        jadwal: 'Juni 2025',
        status: 'Sesuai',
        keterangan: 'Jasa',
        wilayah: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        no: 10,
        nama: 'Pengadaan Server untuk WhatsApp Business API', 
        satuan: 'Dinas Kominfo Jakarta Selatan', 
        krema: 'Tender',
        jadwal: 'Juli 2025',
        status: 'Sesuai',
        keterangan: 'Barang',
        wilayah: 'Kota Jakarta Selatan, DKI Jakarta'
      }
    ];
    
    // For page 1, return the base data
    if (page === 1) {
      return baseData.slice(0, pageSize);
    }
    
    // For other pages, return modified versions of the base data with different numbers
    return baseData.map((item, index) => ({
      ...item,
      no: (page - 1) * pageSize + index + 1,
      nama: `${item.nama} (Tahap ${page})`,
    })).slice(0, pageSize);
  }
  
  // Fetch all dashboard data at once
  const fetchAllDashboardData = useCallback(async (filters = {}) => {
    setLoadingState({ stats: true, charts: true, table: true });
    
    try {
      // If no filters are provided, use Jakarta Selatan as default
      const useFilters = Object.keys(filters).length > 0 ? filters : {
        provinsi: 'DKI Jakarta',
        daerahTingkat: 'Kota',
        kotaKab: 'Jakarta Selatan'
      };
      
      // Fetch all data in parallel
      const [stats, chartResults, tableResults] = await Promise.all([
        fetchDashboardStats(useFilters),
        fetchChartData(useFilters),
        fetchTableData(1, 10, useFilters)
      ]);
      
      return {
        stats,
        pieData: chartResults.pie,
        barData: chartResults.bar,
        tableData: tableResults
      };
    } catch (error) {
      console.error('Error fetching all dashboard data:', error);
      // Use Jakarta Selatan fallback data
      return {
        stats: dashboardStats,
        pieData: chartData.pie,
        barData: chartData.bar,
        tableData: { data: tableData, total: totalItems }
      };
    } finally {
      setLoadingState({ stats: false, charts: false, table: false });
    }
  }, [fetchDashboardStats, fetchChartData, fetchTableData, dashboardStats, chartData, tableData, totalItems]);
  
  // Helper function to determine status
  function determineStatus(item) {
    // Logic to determine status based on the data
    const currentDate = new Date();
    const itemDate = item.pemilihan_datetime ? new Date(item.pemilihan_datetime) : null;
    
    if (!itemDate) return 'Sesuai';
    
    if (itemDate < currentDate) return 'Hrge Esak Btorch';
    if (item.is_pdn === false) return 'Dibth Flnxnnm';
    return 'Sesuai';
  }
  
  const value = {
    // State
    dashboardStats,
    chartData,
    tableData,
    totalItems,
    loading: loadingState,
    
    // Actions
    fetchDashboardStats,
    fetchChartData,
    fetchTableData,
    fetchAllDashboardData
  };
  
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}