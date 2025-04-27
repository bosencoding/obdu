// src/app/context/DataContext.js - Anti-Loop Version
'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { 
  getDashboardStats, 
  getChartData, 
  getFilteredPackages, 
  getRegionsList,
  getPackageCount  // Import the count function
} from '@/app/apiService';

// Create context
const DataContext = createContext(null);

// Custom hook to use the data context
export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    console.error('useData must be used within a DataProvider');
    // Return empty data instead of dummy data
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
      // Provide no-op functions
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
  const lastFetchTimeRef = useRef(0);
  const pendingFetchRef = useRef(null);
  const dataFetchedRef = useRef(false);
  
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
  
  // Global filters state
  const [filters, setFilters] = useState({
    searchQuery: '',
    year: '2025',
    regionId: null,
    provinsi: 'DKI Jakarta',    // Default Jakarta
    daerahTingkat: 'Kota',      // Default Kota
    kotaKab: 'Jakarta Selatan', // Default Jakarta Selatan
    minPagu: null,
    maxPagu: null,
    metode: null,
    jenisPengadaan: null,
    page: 1,
    limit: 10
  });

  // Loading state
  const [loadingState, setLoadingState] = useState({
    initial: true,   // Initial loading state
    dashboard: false, // All dashboard data
    regions: false,   // Region list
    stats: false,     // Dashboard stats
    charts: false,    // Chart data
    table: false      // Table data
  });

  // Error state
  const [error, setError] = useState({
    dashboard: null,
    regions: null
  });

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
        
        // Set empty regions instead of dummy data
        setDashboardData(prev => ({
          ...prev,
          regions: [{ id: 'all', name: 'Semua Wilayah', provinsi: null, type: null, count: 0 }]
        }));
      } finally {
        setLoadingState(prev => ({ ...prev, regions: false }));
      }
    };
    
    loadRegions();
  }, [logDebug]); // Empty dependency array so it only runs once

  // Helper function to fetch dashboard stats
  const fetchDashboardStats = useCallback(async (currentFilters = null) => {
    const filtersToUse = currentFilters || filters;
    
    try {
      const stats = await getDashboardStats(filtersToUse);
      
      // Update state with fetched data
      setDashboardData(prev => ({
        ...prev,
        stats
      }));
      
      return stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Don't change the current stats on error
      return dashboardData.stats;
    }
  }, [filters, dashboardData.stats]);

  // Helper function to fetch chart data
  const fetchChartData = useCallback(async (chartType, currentFilters = null) => {
    const filtersToUse = currentFilters || filters;
    
    try {
      const data = await getChartData(chartType, filtersToUse);
      
      // Update state with fetched data
      setDashboardData(prev => ({
        ...prev,
        charts: {
          ...prev.charts,
          [chartType]: data
        }
      }));
      
      return data;
    } catch (error) {
      console.error(`Error fetching ${chartType} chart:`, error);
      // Return current chart data on error
      return dashboardData.charts[chartType];
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
  
  // Function to fetch just the total count of items
  const fetchTotalItemCount = useCallback(async (currentFilters = null) => {
    const filtersToUse = currentFilters || filters;
    
    try {
      logDebug('Fetching total item count for all records', filtersToUse);
      
      // Using the imported getPackageCount function
      const totalCount = await getPackageCount(filtersToUse);
      
      logDebug('API returned total count', totalCount);
      
      // Update dashboard data with the exact total count
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
      
      // On error, use a high default value rather than the current count
      // This ensures pagination works even if we can't get the exact count
      const fallbackCount = 1500;
      
      setDashboardData(prev => ({
        ...prev,
        table: {
          ...prev.table,
          totalItems: fallbackCount
        }
      }));
      
      return fallbackCount;
    }
  }, [filters, logDebug]);

  // Enhanced function to fetch table data with better pagination handling
  const fetchTableData = useCallback(async (page = 1, limit = 10, currentFilters = null) => {
    const filtersToUse = currentFilters || filters;
    
    // Make sure we use the provided page and limit
    const tableFilters = {
      ...filtersToUse,
      page,
      limit
    };
    
    try {
      setLoadingState(prev => ({ ...prev, table: true }));
      
      // Log pagination request for debugging
      logDebug('Fetching table data with pagination:', { page, limit, filters: tableFilters });
      
      const data = await getFilteredPackages(tableFilters);
      
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
      
      // Calculate total items based on API response
      const hasFullPage = data.length >= limit;
      const newTotalItems = calculateTotalItems(data, page, limit, dashboardData.table.totalItems);
      
      logDebug('Table data received:', { 
        count: data.length, 
        hasFullPage, 
        page, 
        limit,
        estimatedTotal: newTotalItems
      });
      
      // Update state with fetched data
      setDashboardData(prev => ({
        ...prev,
        table: {
          data: processedData,
          totalItems: newTotalItems,
          hasFullPage
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
  }, [filters, dashboardData.table, formatWilayah, determineStatus, calculateTotalItems, getFilteredPackages, logDebug]);

  // Single function to fetch all dashboard data in one go
  // With debounce and loop prevention
  const fetchAllDashboardData = useCallback(async (currentFilters = null) => {
    // Use current filters if not provided
    const filtersToUse = currentFilters || filters;
    
    // Check if there's already a fetch in progress
    if (pendingFetchRef.current) {
      logDebug('Fetch already in progress, skipping', { filters: filtersToUse });
      return null;
    }
    
    // Debounce fetches - don't fetch more often than every 500ms
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 500) {
      logDebug('Debouncing fetch, too soon since last fetch', {
        timeSinceLast: now - lastFetchTimeRef.current,
        filters: filtersToUse
      });
      return null;
    }
    
    // Create a new pending promise
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
        // First fetch the total count to ensure accurate pagination
        await fetchTotalItemCount(filtersToUse);
        
        // Then fetch all other data in parallel to reduce overall loading time
        const [stats, pieData, barData, tableData] = await Promise.all([
          fetchDashboardStats(filtersToUse),
          fetchChartData('pie', filtersToUse),
          fetchChartData('bar', filtersToUse),
          fetchTableData(filtersToUse.page, filtersToUse.limit, filtersToUse)
        ]);
        
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
  }, [filters, fetchTotalItemCount, fetchDashboardStats, fetchChartData, fetchTableData, logDebug]);

  const updateFilters = useCallback((newFilters) => {
    // Debug log
    logDebug('updateFilters called with', newFilters);
    
    // Check if the new filters are actually different from current filters
    let hasChanged = false;
    let hasChangedPageOnly = false;
    const updatedFilters = { ...filters };
    
    // Check each key for actual changes
    Object.keys(newFilters).forEach(key => {
      // Special handling for objects and arrays
      if (typeof newFilters[key] === 'object' && newFilters[key] !== null) {
        if (JSON.stringify(newFilters[key]) !== JSON.stringify(filters[key])) {
          updatedFilters[key] = newFilters[key];
          hasChanged = true;
          if (key !== 'page') hasChangedPageOnly = false;
        }
      } 
      // Standard value comparison
      else if (newFilters[key] !== filters[key]) {
        updatedFilters[key] = newFilters[key];
        hasChanged = true;
        // If searchQuery changed, mark as significant change
        if (key === 'searchQuery' || key === 'regionId' || key === 'provinsi' || 
            key === 'daerahTingkat' || key === 'kotaKab') {
          hasChangedPageOnly = false;
        } else if (key === 'page' && Object.keys(newFilters).length === 1) {
          hasChangedPageOnly = true;
        }
      }
    });
    
    // If nothing has changed, don't update state or trigger new fetch
    if (!hasChanged) {
      logDebug('No filter changes detected, skipping update');
      return filters;
    }
    
    // Reset to page 1 if anything other than page changes
    if (hasChanged && !hasChangedPageOnly && newFilters.page === undefined) {
      updatedFilters.page = 1;
    }
    
    // Update filters state
    setFilters(updatedFilters);
    
    // Schedule fetch for next tick to avoid potential loops
    setTimeout(() => {
      // If only the page changed, just fetch the table data for that page
      if (hasChangedPageOnly) {
        // Use the page from newFilters, fallback to current page
        const pageToFetch = newFilters.page || filters.page || 1;
        const limitToUse = filters.limit || 10;
        
        fetchTableData(pageToFetch, limitToUse, updatedFilters);
      } else {
        // Other filters changed, fetch all data
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
    fetchTotalItemCount, // Add this new function
    
    // Individual data fetching functions for compatibility
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
    fetchTotalItemCount, // Include in dependency array
    fetchDashboardStats,
    fetchChartData,
    fetchTableData
  ]);
  
  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}