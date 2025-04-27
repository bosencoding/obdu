// src/app/context/DataContext.js - Versi lengkap dengan perbaikan
'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { 
  getDashboardStats, 
  getChartData, 
  getFilteredPackages, 
  getRegionsList,
  getPackageCount,
  getAccurateTotalCount
} from '@/app/apiService';

// Create context
const DataContext = createContext(null);

// Constants for pagination strategy
const ITEMS_PER_PAGE = 10;  // Items shown per page in UI
const ITEMS_PER_BATCH = 50; // Items fetched per API request

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
      tableBatchData: [],
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
      fetchAllDashboardData: () => Promise.resolve(),
      fetchTableData: () => Promise.resolve(),
      handlePageChange: () => {},
      fetchTotalItemCount: () => Promise.resolve()
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
  const filterUpdateTimeoutRef = useRef(null);
  const previousFilterRef = useRef({});
  const currentBatchRef = useRef(1);
  const updatingFiltersRef = useRef(false);
  
  // Debug logger
  const logDebug = useCallback((message, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DataContext] ${message}`, data !== null ? data : '');
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
      data: [], // Data for current page (10 items)
      batchData: [], // All fetched data in batches (multiples of 50)
      totalItems: 0,  // Total items in the entire dataset
      currentBatch: 1 // Current batch number
    },
    regions: [],
  });
  
  // Global filters state with default Jakarta Selatan
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
    batchSize: ITEMS_PER_BATCH, // Items per API request
    limit: ITEMS_PER_PAGE       // Items per page
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
    regions: null,
    table: null
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
        
        // Set empty regions with "all" option
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
  const fetchTotalItemCount = useCallback(async (currentFilters = null) => {
    const filtersToUse = currentFilters || filters;
    
    try {
      logDebug('Fetching total item count for current filters', filtersToUse);
      
      // Extract just the filter parameters (tanpa pagination)
      const filterOnlyParams = {
        searchQuery: filtersToUse.searchQuery,
        year: filtersToUse.year,
        regionId: filtersToUse.regionId,
        provinsi: filtersToUse.provinsi,
        daerahTingkat: filtersToUse.daerahTingkat,
        kotaKab: filtersToUse.kotaKab,
        minPagu: filtersToUse.minPagu,
        maxPagu: filtersToUse.maxPagu,
        metode: filtersToUse.metode,
        jenisPengadaan: filtersToUse.jenisPengadaan,
        countOnly: true
      };
      
      // Using the imported getPackageCount function with explicit filter parameters
      const totalCount = await getPackageCount(filterOnlyParams);
      
      logDebug('API returned total count', totalCount);
      
      // Update dashboard data with the exact total count - PENTING: Pastikan ini selalu diperbarui
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
      
      // Pada error, gunakan nilai yang lebih moderat (bukan 1500 yang terlalu tinggi)
      const fallbackCount = 100;
      
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

  // Specialized function to get accurate count, suitable for dashboard
  const getAccurateCount = useCallback(async (currentFilters = null) => {
    const filtersToUse = currentFilters || filters;
    
    try {
      // Gunakan fungsi khusus untuk mendapatkan count yang lebih akurat
      const count = await getAccurateTotalCount(filtersToUse);
      logDebug('Got accurate count:', count);
      
      // Update dashboard data dengan count yang akurat
      setDashboardData(prev => ({
        ...prev,
        table: {
          ...prev.table,
          totalItems: count
        }
      }));
      
      return count;
    } catch (error) {
      console.error('Error getting accurate count:', error);
      return dashboardData.table.totalItems; // Return existing value on error
    }
  }, [filters, dashboardData.table.totalItems, logDebug]);

  // Helper function to fetch dashboard stats
  const fetchDashboardStats = useCallback(async (currentFilters = null) => {
    const filtersToUse = currentFilters || filters;
    logDebug('Fetching dashboard stats', filtersToUse);
    
    try {
      setLoadingState(prev => ({ ...prev, stats: true }));
      const stats = await getDashboardStats(filtersToUse);
      
      // Update state with fetched data
      setDashboardData(prev => ({
        ...prev,
        stats
      }));
      
      setError(prev => ({ ...prev, dashboard: null }));
      return stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(prev => ({ ...prev, dashboard: `Error fetching stats: ${error.message}` }));
      // Don't change the current stats on error
      return dashboardData.stats;
    } finally {
      setLoadingState(prev => ({ ...prev, stats: false }));
    }
  }, [filters, dashboardData.stats, logDebug]);

  // Helper function to fetch chart data
  const fetchChartData = useCallback(async (chartType, currentFilters = null) => {
    const filtersToUse = currentFilters || filters;
    logDebug(`Fetching ${chartType} chart data`, filtersToUse);
    
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
      
      setError(prev => ({ ...prev, dashboard: null }));
      return data;
    } catch (error) {
      console.error(`Error fetching ${chartType} chart:`, error);
      setError(prev => ({ ...prev, dashboard: `Error fetching chart: ${error.message}` }));
      // Return current chart data on error
      return dashboardData.charts[chartType];
    } finally {
      setLoadingState(prev => ({ ...prev, charts: false }));
    }
  }, [filters, dashboardData.charts, logDebug]);

  // Extract page data from a batch of data - PENTING: Definisikan ini SEBELUM fungsi yang menggunakannya
  const extractPageFromBatch = useCallback((batchData, page, batch) => {
    if (!batchData || batchData.length === 0) return [];
    
    // Calculate the start index within the batch
    const batchStartIndex = (batch - 1) * ITEMS_PER_BATCH;
    const globalStartIndex = (page - 1) * ITEMS_PER_PAGE;
    const relativeStartIndex = globalStartIndex - batchStartIndex;
    
    logDebug('Extracting page from batch', {
      page,
      batch,
      batchStartIndex,
      globalStartIndex,
      relativeStartIndex,
      batchLength: batchData.length
    });
    
    // Safety check to prevent going out of bounds
    if (relativeStartIndex < 0) {
      console.error('Invalid relative start index:', relativeStartIndex);
      return batchData.slice(0, ITEMS_PER_PAGE);
    }
    
    if (relativeStartIndex >= batchData.length) {
      console.error('Relative start index exceeds batch length:', relativeStartIndex, batchData.length);
      return [];
    }
    
    // Extract the page data
    return batchData.slice(relativeStartIndex, relativeStartIndex + ITEMS_PER_PAGE);
  }, [logDebug]);

  // Process raw data from API into UI-ready format
  const processTableData = useCallback((data, startIndex = 0) => {
    return data.map((item, index) => ({
      no: startIndex + index + 1,
      nama: item.paket || '',
      satuan: item.satuan_kerja || '',
      krema: item.metode || '',
      jadwal: item.pemilihan || 'Belum ditentukan',
      wilayah: formatWilayah(item),
      status: determineStatus(item),
      keterangan: item.jenis_pengadaan || '',
      // Keep original data for reference
      rawData: item
    }));
  }, [formatWilayah, determineStatus]);

  // Calculate which batch contains the requested page
  const getBatchForPage = useCallback((page) => {
    return Math.ceil(page * ITEMS_PER_PAGE / ITEMS_PER_BATCH);
  }, []);

  // Enhanced function to fetch table data with batching strategy
  const fetchTableData = useCallback(async (page = 1, limit = ITEMS_PER_PAGE, currentFilters = null) => {
    const filtersToUse = currentFilters || filters;
    const batchSize = ITEMS_PER_BATCH;
    
    // Calculate which batch contains this page
    const targetBatch = getBatchForPage(page);
    logDebug(`Page ${page} requires batch ${targetBatch}, current batch is ${currentBatchRef.current}`);
    
    // PENTING: Selalu update total count terlebih dahulu untuk tampilan jumlah yang akurat
    let totalItems = dashboardData.table.totalItems;
    try {
      totalItems = await fetchTotalItemCount(filtersToUse);
      logDebug('Updated total count:', totalItems);
    } catch (err) {
      console.error('Error fetching total count:', err);
      // Tetap gunakan nilai sebelumnya jika gagal
    }
    
    // Check if we need to fetch a new batch
    if (targetBatch !== currentBatchRef.current || dashboardData.table.batchData.length === 0) {
      try {
        setLoadingState(prev => ({ ...prev, table: true }));
        
        // Calculate API parameters for batch request
        const skip = (targetBatch - 1) * batchSize;
        
        // Prepare API request
        const batchFilters = {
          ...filtersToUse,
          skip,
          limit: batchSize
        };
        
        logDebug('Fetching table data batch:', { 
          batch: targetBatch, 
          skip,
          limit: batchSize,
          filters: batchFilters
        });
        
        const data = await getFilteredPackages(batchFilters);
        
        if (!Array.isArray(data)) {
          console.error('API returned non-array data:', data);
          throw new Error('Invalid data format returned from API');
        }
        
        // Process the entire batch data
        const processedBatchData = processTableData(data, skip);
        
        // Extract totalCount from API response if available
        // Prioritas tinggi: gunakan nilai dari respons API jika tersedia
        if (data.totalCount !== undefined) {
          totalItems = data.totalCount;
          logDebug('Using totalCount from API response:', totalItems);
        }
        
        // Calculate if we have a full batch
        const hasFullBatch = data.length >= batchSize;
        
        logDebug('Batch data received:', { 
          batch: targetBatch,
          count: data.length, 
          hasFullBatch,
          totalItems
        });
        
        // Update current batch reference
        currentBatchRef.current = targetBatch;
        
        // Update state with fetched batch data and ACCURATE total items
        setDashboardData(prev => ({
          ...prev,
          table: {
            ...prev.table,
            batchData: processedBatchData,
            totalItems: totalItems, // Gunakan nilai yang baru dihitung
            currentBatch: targetBatch
          }
        }));
        
        // Now extract the page data from the batch
        const pageData = extractPageFromBatch(processedBatchData, page, targetBatch);
        
        // Update state with page data
        setDashboardData(prev => ({
          ...prev,
          table: {
            ...prev.table,
            data: pageData
          }
        }));
        
        setError(prev => ({ ...prev, table: null }));
        return pageData;
      } catch (error) {
        console.error('Error fetching table data:', error);
        setError(prev => ({ ...prev, table: `Error fetching data: ${error.message}` }));
        // Keep current data on error
        return dashboardData.table.data;
      } finally {
        setLoadingState(prev => ({ ...prev, table: false }));
      }
    } else {
      // Tetap update totalItems meskipun menggunakan batch yang ada
      setDashboardData(prev => ({
        ...prev,
        table: {
          ...prev.table,
          totalItems: totalItems
        }
      }));
      
      // We already have the batch data, just extract the page
      logDebug('Using existing batch data for page', page);
      const pageData = extractPageFromBatch(dashboardData.table.batchData, page, targetBatch);
      
      // Update state with just the page data
      setDashboardData(prev => ({
        ...prev,
        table: {
          ...prev.table,
          data: pageData
        }
      }));
      
      return pageData;
    }
  }, [filters, dashboardData.table, processTableData, getBatchForPage, extractPageFromBatch, fetchTotalItemCount, logDebug]);

  // Handler for page changes
  const handlePageChange = useCallback((newPage) => {
    logDebug(`Page change requested: ${newPage}`);
    
    // Update filters with new page
    const updatedFilters = {
      ...filters,
      page: newPage
    };
    
    // Update filters state
    setFilters(updatedFilters);
    
    // Calculate which batch contains this page
    const targetBatch = getBatchForPage(newPage);
    const currentBatch = currentBatchRef.current;
    
    if (targetBatch !== currentBatch || dashboardData.table.batchData.length === 0) {
      // Need to fetch new batch
      logDebug(`Fetching new batch ${targetBatch} for page ${newPage}`);
      fetchTableData(newPage, ITEMS_PER_PAGE, updatedFilters);
    } else {
      // Just extract page from existing batch
      logDebug(`Using existing batch ${currentBatch} for page ${newPage}`);
      const pageData = extractPageFromBatch(dashboardData.table.batchData, newPage, currentBatch);
      
      // Update only the page data
      setDashboardData(prev => ({
        ...prev,
        table: {
          ...prev.table,
          data: pageData
        }
      }));
    }
    
    return newPage;
  }, [filters, dashboardData.table.batchData, getBatchForPage, fetchTableData, extractPageFromBatch, logDebug]);

  // Function to fetch all dashboard data in one go with debounce and loop prevention
  const fetchAllDashboardData = useCallback(async (currentFilters = null) => {
    // Use current filters if not provided
    const filtersToUse = currentFilters || filters;
    
    // Check if there's already a fetch in progress
    if (pendingFetchRef.current) {
      logDebug('Fetch already in progress, skipping');
      return null;
    }
    
    // Debounce fetches - don't fetch more often than every 500ms
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 500) {
      logDebug('Debouncing fetch, too soon since last fetch');
      return null;
    }
    
    // Create a new pending promise
    pendingFetchRef.current = (async () => {
      logDebug('Starting fetch all dashboard data', { filters: filtersToUse });
      lastFetchTimeRef.current = now;
      
      // Reset the current page to 1 and batch to 1
      const pageOneFilters = {
        ...filtersToUse,
        page: 1
      };
      
      // Update filters to ensure page 1
      setFilters(pageOneFilters);
      
      // Reset batch reference
      currentBatchRef.current = 1;
      
      // Set loading state
      setLoadingState(prev => ({ 
        ...prev, 
        dashboard: true,
        stats: true,
        charts: true,
        table: true
      }));
      
      try {
        // CRITICAL: First fetch the total count for accurate pagination
        // This MUST be awaited and completed first
        const totalCount = await fetchTotalItemCount(pageOneFilters);
        logDebug('Total count fetched:', totalCount);
        
        // Try to get a more accurate count
        try {
          const accurateCount = await getAccurateCount(pageOneFilters);
          logDebug('Accurate count fetched:', accurateCount);
        } catch (err) {
          console.error('Error getting accurate count:', err);
        }
        
        // Then fetch all other data in parallel
        const [stats, pieData, barData, tableData] = await Promise.all([
          fetchDashboardStats(pageOneFilters),
          fetchChartData('pie', pageOneFilters),
          fetchChartData('bar', pageOneFilters),
          fetchTableData(1, ITEMS_PER_PAGE, pageOneFilters)
        ]);
        
        dataFetchedRef.current = true;
        
        // Success - error will be null
        setError(prev => ({ ...prev, dashboard: null }));
        
        return { stats, pieData, barData, tableData, totalCount };
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(prev => ({ ...prev, dashboard: `Error loading dashboard: ${error.message}` }));
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
  }, [filters, fetchTotalItemCount, getAccurateCount, fetchDashboardStats, fetchChartData, fetchTableData, logDebug]);

  // Compare two filter objects and determine if they're different
  const areFiltersChanged = useCallback((oldFilters, newFilters) => {
    // If the objects are the same instance, no change
    if (oldFilters === newFilters) return false;
    
    // Check if either is null/undefined when the other isn't
    if (!oldFilters || !newFilters) return true;
    
    // Get all keys from both objects
    const allKeys = [...new Set([...Object.keys(oldFilters), ...Object.keys(newFilters)])];
    
    // Compare values for each key
    for (const key of allKeys) {
      const oldValue = oldFilters[key];
      const newValue = newFilters[key];
      
      // Handle different types differently
      if (typeof oldValue !== typeof newValue) return true;
      
      // Special handling for objects and arrays
      if (typeof oldValue === 'object' && oldValue !== null && newValue !== null) {
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) return true;
      } 
      // Standard value comparison for primitives
      else if (oldValue !== newValue) {
        return true;
      }
    }
    
    // If we got here, no differences found
    return false;
  }, []);

  // Improved updateFilters function with better state management
  const updateFilters = useCallback((newFilters) => {
    // Log for debugging
    logDebug('updateFilters called with', newFilters);
    
    // Set flag to prevent loops
    updatingFiltersRef.current = true;
    
    // Clear any pending timeout
    if (filterUpdateTimeoutRef.current) {
      clearTimeout(filterUpdateTimeoutRef.current);
    }
    
    // Create combined filters
    const updatedFilters = { ...filters, ...newFilters };
    
    // Check if the filters actually changed
    if (!areFiltersChanged(previousFilterRef.current, updatedFilters)) {
      logDebug('Filters unchanged, skipping update');
      updatingFiltersRef.current = false;
      return filters; // Return current filters
    }
    
    // Special case: check if this is only a page change
    const isOnlyPageChange = 
      Object.keys(newFilters).length === 1 && 
      newFilters.page !== undefined && 
      newFilters.page !== filters.page;
    
    // If filters other than page changed, reset to page 1
    if (!isOnlyPageChange && Object.keys(newFilters).some(key => key !== 'page' && filters[key] !== newFilters[key])) {
      updatedFilters.page = 1;
      // Reset batch reference for new filters
      currentBatchRef.current = 1;
    }
    
    // Update our previous filter reference
    previousFilterRef.current = { ...updatedFilters };
    
    // Update filters state immediately
    setFilters(updatedFilters);
    
    // Schedule data fetching with debounce
    filterUpdateTimeoutRef.current = setTimeout(() => {
      if (isOnlyPageChange) {
        // For page changes, use handlePageChange
        handlePageChange(newFilters.page);
      } else {
        // For other changes, update all dashboard data
        fetchAllDashboardData(updatedFilters);
      }
      
      // Reset the updating flag after a short delay
      setTimeout(() => {
        updatingFiltersRef.current = false;
      }, 100);
    }, 100); // Short debounce for responsiveness
    
    return updatedFilters;
  }, [filters, areFiltersChanged, handlePageChange, fetchAllDashboardData, logDebug]);

  // Effect untuk memastikan totalCount selalu diperbarui saat filter berubah
  useEffect(() => {
    // Skip if initial render or if we're updating filters
    if (!dataFetchedRef.current || updatingFiltersRef.current) return;
    
    // Function to update total count
    const updateTotalCount = async () => {
      try {
        const count = await getAccurateCount(filters);
        logDebug('Direct total count update:', count);
      } catch (error) {
        console.error('Error updating total count:', error);
      }
    };
    
    // Execute with short delay to avoid race conditions
    const timeoutId = setTimeout(updateTotalCount, 100);
    return () => clearTimeout(timeoutId);
  }, [filters, getAccurateCount, logDebug]);

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
    tableBatchData: dashboardData.table.batchData,
    totalItems: dashboardData.table.totalItems,
    currentBatch: dashboardData.table.currentBatch,
    regions: dashboardData.regions,
    
    // Pagination constants
    ITEMS_PER_PAGE,
    ITEMS_PER_BATCH,
    
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
    fetchTableData,
    handlePageChange,
    getAccurateCount,
    
    // Individual data fetching functions for compatibility
    fetchDashboardStats,
    fetchChartData
  }), [
    dashboardData, 
    filters, 
    loadingState, 
    error,
    updateFilters,
    fetchAllDashboardData,
    fetchTotalItemCount,
    fetchTableData,
    handlePageChange,
    getAccurateCount,
    fetchDashboardStats,
    fetchChartData,
    ITEMS_PER_PAGE,
    ITEMS_PER_BATCH
  ]);
  
  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}