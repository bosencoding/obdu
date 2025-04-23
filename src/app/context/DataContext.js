// src/app/context/DataContext.js
'use client';

import { createContext, useContext, useState, useCallback } from 'react';
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
  
  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async (filters = {}) => {
    setLoadingState(prev => ({ ...prev, stats: true }));
    try {
      const stats = await getDashboardStats(filters);
      setDashboardStats(stats);
      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default data on error
      return dashboardStats;
    } finally {
      setLoadingState(prev => ({ ...prev, stats: false }));
    }
  }, [dashboardStats]);
  
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
      return chartData;
    } finally {
      setLoadingState(prev => ({ ...prev, charts: false }));
    }
  }, [chartData]);
  
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
        wilayah: item.lokasi || '-',
        status: determineStatus(item),
        keterangan: item.jenis_pengadaan || '-'
      }));
      
      setTableData(formattedData);
      
      // Estimate total items if not provided by API
      // Ideally, the API should return a total count
      if (data.length === pageSize) {
        setTotalItems(Math.max(totalItems, page * pageSize + 1));
      } else if (data.length < pageSize && page === 1) {
        setTotalItems(data.length);
      }
      
      return { data: formattedData, total: totalItems };
    } catch (error) {
      console.error('Error fetching table data:', error);
      return { data: [], total: 0 };
    } finally {
      setLoadingState(prev => ({ ...prev, table: false }));
    }
  }, [totalItems]);
  
  // Fetch all dashboard data at once using the optimized endpoint
  const fetchAllDashboardData = useCallback(async (filters = {}, tableSkip = 0, tableLimit = 10) => {
    setLoadingState({ stats: true, charts: true, table: true });
    
    try {
      // Import the optimized function that uses the all-in-one endpoint
      const { getAllDashboardData } = await import('@/app/apiService');
      
      // Get all dashboard data in a single request
      const result = await getAllDashboardData(filters, tableSkip, tableLimit);
      
      // Update all state values at once
      if (result.stats) {
        setDashboardStats(result.stats);
      }
      
      if (result.pieData && result.barData) {
        setChartData({
          pie: result.pieData,
          bar: result.barData
        });
      }
      
      if (result.tableData) {
        setTableData(result.tableData.data || []);
        setTotalItems(result.tableData.total || 0);
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching all dashboard data:', error);
      // Don't change state if there's an error to keep fallback values
    } finally {
      setLoadingState({ stats: false, charts: false, table: false });
    }
  }, []);
  
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