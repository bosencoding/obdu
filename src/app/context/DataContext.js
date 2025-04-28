'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { 
  getDashboardStats, 
  getChartData, 
  getFilteredPackages, 
  getRegionsList,
  getPackageCount
} from '@/app/apiService';

// Create context
const DataContext = createContext(null);

// Custom hook to use the data context
export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    console.error('useData must be used within a DataProvider');
    // Return empty data
    return {
      dashboardStats: {},
      chartData: { pie: [], bar: [] },
      tableData: [],
      totalItems: 0,
      regions: [],
      filters: {},
      loading: { 
        dashboard: false, 
        initial: true,
        regions: false,
        stats: false,
        charts: false,
        table: false
      },
      updateFilters: () => {},
      fetchAllDashboardData: () => Promise.resolve()
    };
  }
  return context;
}

// Provider component
export function DataProvider({ children }) {
  // Refs to prevent loops
  const isMountedRef = useRef(false);
  const pendingFetchRef = useRef(null);
  const dataFetchedRef = useRef(false);
  const isUpdatingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  
  // Debug logger
  const logDebug = useCallback((message, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DataContext] ${message}`, data);
    }
  }, []);
  
  // Shared state for all dashboard data
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalAnggaran: '',
      totalPaket: 0,
      tender: 0,
      dikecualikan: 0,
      epkem: 0,
      pengadaanLangsung: 0
    },
    charts: {
      pie: [],
      bar: []
    },
    table: {
      data: [],
      totalItems: 0
    },
    regions: [],
  });
  
  // Global filters state with Jakarta Selatan as default
  const [filters, setFilters] = useState({
    searchQuery: '',
    year: 2025,
    regionId: null,
    provinsi: 'DKI Jakarta',
    daerahTingkat: 'Kota',
    kotaKab: 'Jakarta Selatan',
    page: 1,
    limit: 10
  });

  // Loading state
  const [loadingState, setLoadingState] = useState({
    initial: true,    // Initial loading state
    dashboard: false, // All dashboard data
    regions: false,   // Region list
    stats: false,     // Dashboard stats
    charts: false,    // Chart data
    table: false      // Table data
  });

  // Error state
  const [error, setError] = useState({
    dashboard: null,
    regions: null,
    table: null,
    charts: null
  });

  // Calculate total items for pagination
  const calculateTotalItems = useCallback((data, page, limit, currentTotal) => {
    // If the API directly provides a total count
    if (data.totalCount !== undefined) {
      return data.totalCount;
    }
    
    // Calculate based on the data we have
    if (!Array.isArray(data)) {
      return currentTotal || 0;
    }
    
    // Case 1: If this is the first page and we got fewer items than the limit,
    // then this is the exact total
    if (page === 1 && data.length < limit) {
      return data.length;
    }
    
    // Case 2: If we have a full page of data, we know there are at least
    // this many items (current page * limit), possibly more
    if (data.length >= limit) {
      // Ensure our total count is at least the items we've seen plus one more page
      return Math.max(currentTotal || 0, page * limit + 1);
    }
    
    // Case 3: If we have a partial page (not the first page), we can calculate exactly
    if (data.length < limit && page > 1) {
      return (page - 1) * limit + data.length;
    }
    
    // Default: Keep the current total if higher, or calculate based on what we know
    return Math.max(currentTotal || 0, page * limit);
  }, []);

  // Load regions on initial render - only once
  useEffect(() => {
    // Only run once
    if (isMountedRef.current) return;
    isMountedRef.current = true;
    
    logDebug('Loading regions (first mount)');
    
    const loadRegions = async () => {
      setLoadingState(prev => ({ ...prev, regions: true }));
      
      try {
        // Use the API service function
        const data = await getRegionsList();
        
        // Add "all" option
        const allOption = { id: 'all', name: 'Semua Wilayah', provinsi: null, type: null, count: 0 };
        
        setDashboardData(prev => ({
          ...prev,
          regions: [allOption, ...data]
        }));
        
        setError(prev => ({ ...prev, regions: null }));
      } catch (error) {
        console.error('Error loading regions:', error);
        setError(prev => ({ ...prev, regions: error.message }));
        
        // Set empty regions
        setDashboardData(prev => ({
          ...prev,
          regions: [{ id: 'all', name: 'Semua Wilayah', provinsi: null, type: null, count: 0 }]
        }));
      } finally {
        setLoadingState(prev => ({ ...prev, regions: false }));
      }
    };
    
    loadRegions();
  }, [logDebug]);

  // Helper function to fetch dashboard stats
  const fetchDashboardStats = useCallback(async (currentFilters = null) => {
    const filtersToUse = currentFilters || filters;
    
    try {
      setLoadingState(prev => ({ ...prev, stats: true }));
      const stats = await getDashboardStats(filtersToUse);
      
      // Update state with fetched data
      setDashboardData(prev => ({
        ...prev,
        stats
      }));
      
      setError(prev => ({ ...prev, stats: null }));
      return stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(prev => ({ ...prev, stats: error.message }));
      return dashboardData.stats;
    } finally {
      setLoadingState(prev => ({ ...prev, stats: false }));
    }
  }, [filters, dashboardData.stats]);

  // Helper function to fetch chart data
  const fetchChartData = useCallback(async (chartType, currentFilters = null) => {
    const filtersToUse = currentFilters || filters;
    
    try {
      setLoadingState(prev => ({ ...prev, charts: true }));
      const data = await getChartData(chartType, filtersToUse);
      
      // Update state with fetched data
      setDashboardData(prev => ({
        ...prev,
        charts: {
          ...prev.charts,
          [chartType]: data
        }
      }));
      
      setError(prev => ({ ...prev, charts: null }));
      return data;
    } catch (error) {
      console.error(`Error fetching ${chartType} chart:`, error);
      setError(prev => ({ ...prev, charts: error.message }));
      return dashboardData.charts[chartType];
    } finally {
      setLoadingState(prev => ({ ...prev, charts: false }));
    }
  }, [filters, dashboardData.charts]);

  // Format wilayah from item data
  const formatWilayah = useCallback((item) => {
    if (item.lokasi) return item.lokasi;
    
    if (item.provinsi) {
      let result = '';
      if (item.daerah_tingkat) result += `${item.daerah_tingkat} `;
      if (item.kota_kab) result += item.kota_kab;
      if (result) result += `, ${item.provinsi}`;
      else result = item.provinsi;
      return result;
    }
    
    return '';
  }, []);

  // Determine status based on item data
  const determineStatus = useCallback((item) => {
    const currentDate = new Date();
    const itemDate = item.pemilihan_datetime ? new Date(item.pemilihan_datetime) : null;
    
    if (!itemDate) return 'Sesuai';
    
    if (itemDate < currentDate) return 'Hrge Esak Btorch';
    if (item.is_pdn === false) return 'Dibth Flnxnnm';
    return 'Sesuai';
  }, []);

  // Function to fetch just the total count of items
// Fungsi untuk mengambil jumlah total item
const fetchTotalItemCount = useCallback(async (currentFilters = null) => {
  const filtersToUse = currentFilters || filters;
  
  try {
    logDebug('Fetching total item count for all records', filtersToUse);
    
    // Menggunakan fungsi getPackageCount yang telah diimpor
    const totalCount = await getPackageCount(filtersToUse);
    
    logDebug('API returned total count', totalCount);
    
    // Perbarui data dashboard dengan jumlah total yang tepat
    setDashboardData(prev => ({
      ...prev,
      table: {
        ...prev.table,
        totalItems: totalCount
      }
    }));
    
    return totalCount;
  } catch (error) {
    console.error('Error fetching total item count:', error);
    
    // Jangan mengganti totalItems jika terjadi error, pertahankan nilai sebelumnya
    return dashboardData.table.totalItems || 0;
  }
}, [filters, logDebug, dashboardData.table.totalItems]);

  // Perbaikan pada fetchTableData di DataContext.js
// Enhanced function to fetch table data with less API calls
const fetchTableData = useCallback(async (page = 1, limit = 10, currentFilters = null) => {
  const filtersToUse = currentFilters || filters;
  
  // Optimize: Skip count fetch if we already know the total count
  const optimizedFilters = {
    ...filtersToUse,
    page,
    limit,
    // Only include count_only if we don't already know the total count
    countOnly: filtersToUse.skipCountFetch ? undefined : true
  };
  
  try {
    setLoadingState(prev => ({ ...prev, table: true }));
    
    // Log pagination request for debugging
    logDebug('Fetching table data with pagination:', { 
      page, 
      limit, 
      filters: optimizedFilters,
      skipCountFetch: filtersToUse.skipCountFetch
    });
    
    const data = await getFilteredPackages(optimizedFilters);
    
    if (!Array.isArray(data)) {
      logDebug('Received non-array data from API:', data);
      return dashboardData.table.data;
    }
    
    // Process table data
    const processedData = data.map((item, index) => ({
      no: (page - 1) * limit + index + 1,
      nama: item.paket || '',
      satuan: item.satuan_kerja || '',
      krema: item.metode || '',
      jadwal: item.pemilihan || 'Belum ditentukan',
      wilayah: formatWilayah(item),
      status: determineStatus(item),
      keterangan: item.jenis_pengadaan || ''
    }));
    
    // Update total items if available from API response or use existing/provided count
    let newTotalItems = filtersToUse.knownTotalCount || dashboardData.table.totalItems;
    
    // If data has totalCount property directly from API
    if (data.totalCount !== undefined) {
      newTotalItems = data.totalCount;
    } else if (!filtersToUse.skipCountFetch) {
      // Only calculate if we haven't explicitly skipped count fetch
      newTotalItems = calculateTotalItems(data, page, limit, dashboardData.table.totalItems);
    }
    
    logDebug('Table data received:', { 
      count: data.length, 
      hasFullPage: data.length >= limit, 
      page, 
      limit,
      totalItems: newTotalItems
    });
    
    // Update state with fetched data
    setDashboardData(prev => ({
      ...prev,
      table: {
        data: processedData,
        totalItems: newTotalItems,
        hasFullPage: data.length >= limit
      }
    }));
    
    return processedData;
  } catch (error) {
    console.error('Error fetching table data:', error);
    // Keep current table data on error
    return dashboardData.table.data;
  } finally {
    setLoadingState(prev => ({ ...prev, table: false }));
  }
}, [filters, dashboardData.table, formatWilayah, determineStatus, calculateTotalItems, logDebug]);

  // Tambahkan fungsi ini di dalam DataContext.js dalam Provider component:

// Function to fetch all dashboard data in one go
const fetchAllDashboardData = useCallback(async (currentFilters = null) => {
  // Gunakan current filters jika tidak disediakan
  const filtersToUse = currentFilters || filters;
  
  // Periksa jika sudah ada fetch yang sedang berlangsung
  if (pendingFetchRef.current) {
    logDebug('Fetch already in progress, skipping', { filters: filtersToUse });
    return null;
  }
  
  // Debounce fetches - jangan fetch lebih sering dari setiap 500ms
  const now = Date.now();
  if (now - lastFetchTimeRef.current < 500) {
    logDebug('Debouncing fetch, too soon since last fetch', {
      timeSinceLast: now - lastFetchTimeRef.current,
      filters: filtersToUse
    });
    return null;
  }
  
  // Buat promise pending baru
  pendingFetchRef.current = (async () => {
    logDebug('Starting fetch all dashboard data', { filters: filtersToUse });
    lastFetchTimeRef.current = now;
    
    // Set loading state
    setLoadingState(prev => ({ 
      ...prev, 
      dashboard: true,
      stats: true,
      charts: true,
      table: true
    }));
    
    try {
      // PENTING: Ambil total count terlebih dahulu dalam satu panggilan API
      const totalCount = await fetchTotalItemCount(filtersToUse);
      
      // Gunakan totalCount yang sudah diambil sebagai parameter tambahan
      // Ini mencegah fetchTableData melakukan panggilan count lagi
      const enhancedFilters = {
        ...filtersToUse,
        // Flag untuk menandai bahwa count sudah diambil
        skipCountFetch: true,
        knownTotalCount: totalCount
      };
      
      // Fetch data tabel dalam satu panggilan lain (tidak perlu fetch count lagi)
      const tableData = await fetchTableData(
        enhancedFilters.page || 1, 
        enhancedFilters.limit || 10, 
        enhancedFilters
      );
      
      // Pisahkan fetching untuk stats dan charts karena tidak selalu dibutuhkan 
      // saat navigasi paginasi
      let stats = dashboardData.stats;
      let pieData = dashboardData.charts.pie;
      let barData = dashboardData.charts.bar;
      
      // Hanya fetch stats dan charts jika filter utama berubah (bukan hanya paginasi)
      const isPageChangeOnly = 
        Object.keys(filtersToUse).length === 1 && 
        filtersToUse.page !== undefined;
        
      if (!isPageChangeOnly) {
        [stats, pieData, barData] = await Promise.all([
          fetchDashboardStats(enhancedFilters),
          fetchChartData('pie', enhancedFilters),
          fetchChartData('bar', enhancedFilters)
        ]);
      }
      
      dataFetchedRef.current = true;
      
      // Success - error will be null
      setError(prev => ({ ...prev, dashboard: null }));
      
      return { stats, pieData, barData, tableData };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(prev => ({ ...prev, dashboard: error.message }));
      return null;
    } finally {
      setLoadingState(prev => ({ 
        ...prev, 
        dashboard: false,
        stats: false,
        charts: false,
        table: false,
        initial: false // Clear initial loading state
      }));
      pendingFetchRef.current = null;
    }
  })();
  
  return pendingFetchRef.current;
}, [filters, fetchTotalItemCount, fetchDashboardStats, fetchChartData, fetchTableData, logDebug, dashboardData]);

// Main function to update filters with optimized fetch logic
const updateFilters = useCallback((newFilters) => {
  // Debug log
  logDebug('updateFilters called with', newFilters);
  
  // Check if this is just a page change
  const isPageChangeOnly = 
    Object.keys(newFilters).length === 1 && 
    newFilters.page !== undefined;
  
  // Check if the new filters are actually different from current filters
  let hasChanged = false;
  const updatedFilters = { ...filters };
  
  // Check each key for actual changes
  Object.keys(newFilters).forEach(key => {
    // Special handling for objects and arrays
    if (typeof newFilters[key] === 'object' && newFilters[key] !== null) {
      if (JSON.stringify(newFilters[key]) !== JSON.stringify(filters[key])) {
        updatedFilters[key] = newFilters[key];
        hasChanged = true;
      }
    } 
    // Standard value comparison
    else if (newFilters[key] !== filters[key]) {
      updatedFilters[key] = newFilters[key];
      hasChanged = true;
    }
  });
  
  // If nothing has changed, don't update state or trigger new fetch
  if (!hasChanged) {
    logDebug('No filter changes detected, skipping update');
    return filters;
  }
  
  // Reset to page 1 if anything other than page changes
  if (hasChanged && !isPageChangeOnly) {
    updatedFilters.page = 1;
  }
  
  // Update filters state immediately
  setFilters(updatedFilters);
  logDebug('Filter state updated to', updatedFilters);
  
  // Optimize fetching based on what changed
  setTimeout(() => {
    if (isPageChangeOnly) {
      // If only the page changed, just fetch the table data for that page
      // without refetching stats or charts
      const pageToFetch = newFilters.page || filters.page || 1;
      const limitToUse = filters.limit || 10;
      
      logDebug(`Fetching ONLY table data for page ${pageToFetch}`);
      fetchTableData(pageToFetch, limitToUse, updatedFilters);
    } else {
      // Other filters changed, fetch all data
      logDebug('Fetching all dashboard data with updated filters');
      fetchAllDashboardData(updatedFilters);
    }
  }, 0);
  
  return updatedFilters;
}, [filters, fetchAllDashboardData, fetchTableData, logDebug]);

  // Initial data loading (only once)
  useEffect(() => {
    if (loadingState.initial && !dataFetchedRef.current) {
      logDebug('Initial data load');
      // Load data with default filters (Jakarta Selatan)
      fetchAllDashboardData();
    }
  }, [loadingState.initial, fetchAllDashboardData, logDebug]);

  // Create the context value
  const contextValue = useMemo(() => ({
    // Data
    dashboardStats: dashboardData.stats,
    chartData: dashboardData.charts,
    tableData: dashboardData.table.data,
    totalItems: dashboardData.table.totalItems,
    regions: dashboardData.regions,
    
    // Filters
    filters,
    
    // Loading states
    loading: {
      dashboard: loadingState.dashboard,
      regions: loadingState.regions,
      initial: loadingState.initial,
      stats: loadingState.stats,
      charts: loadingState.charts,
      table: loadingState.table
    },
    
    // Error states
    error,
    
    // Functions
    updateFilters,
    fetchAllDashboardData,
    fetchTotalItemCount,
    fetchDashboardStats,
    fetchChartData,
    fetchTableData
  }), [
    dashboardData, 
    filters, 
    loadingState, 
    error,
    updateFilters,
    fetchAllDashboardData,
    fetchTotalItemCount,
    fetchDashboardStats,
    fetchChartData,
    fetchTableData
  ]);
  
  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}