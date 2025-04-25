// src/app/context/DataContext.js - Anti-Loop Version
'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { getDashboardStats, getChartData, getFilteredPackages, getRegionsList } from '@/app/apiService';

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
    // If we have fewer items than the limit, we can calculate the exact total
    if (data.length < limit) {
      return (page - 1) * limit + data.length;
    }
    
    // Otherwise, we know there are at least this many items
    const minTotal = page * limit;
    
    // Use the larger of our current estimate and the new minimum
    return Math.max(minTotal, currentTotal || 0);
  }, []);
  
  // Helper function to fetch table data
  const fetchTableData = useCallback(async (page = 1, limit = 10, currentFilters = null) => {
    const filtersToUse = currentFilters || filters;
    
    // Use provided page and limit
    const tableFilters = {
      ...filtersToUse,
      page,
      limit
    };
    
    try {
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
      const totalItems = calculateTotalItems(data, page, limit, dashboardData.table.totalItems);
      
      // Update state with fetched data
      setDashboardData(prev => ({
        ...prev,
        table: {
          data: processedData,
          totalItems
        }
      }));
      
      return processedData;
    } catch (error) {
      console.error('Error fetching table data:', error);
      // Keep current table data on error
      return dashboardData.table.data;
    }
  }, [filters, dashboardData.table, formatWilayah, determineStatus, calculateTotalItems]);

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
        // Fetch all data in parallel to reduce overall loading time
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
  }, [filters, fetchDashboardStats, fetchChartData, fetchTableData, logDebug]);

  // Function to update filters and fetch new data
  // With anti-loop protection
  const updateFilters = useCallback((newFilters) => {
    // Debug log
    logDebug('updateFilters called with', newFilters);
    
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
    const isPageChangeOnly = 
      Object.keys(newFilters).length === 1 && 
      Object.keys(newFilters)[0] === 'page';
    
    if (!isPageChangeOnly && newFilters.page === undefined) {
      updatedFilters.page = 1;
    }
    
    // Update filters state
    setFilters(updatedFilters);
    
    // Schedule fetch for next tick to avoid potential loops
    setTimeout(() => {
      // Only fetch new data if something other than page changed
      // or if page changed and we're in pagination mode
      if (!isPageChangeOnly || dataFetchedRef.current) {
        fetchAllDashboardData(updatedFilters);
      }
    }, 0);
    
    return updatedFilters;
  }, [filters, fetchAllDashboardData, logDebug]);

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
    fetchDashboardStats,
    fetchChartData,
    fetchTableData
  ]);
  
  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}