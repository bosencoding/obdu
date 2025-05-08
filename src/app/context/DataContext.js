'use client';

import { createContext, useContext, useMemo } from 'react';
import { useDashboardData } from '@/app/hooks/useDashboardData';

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
      error: {
        dashboard: null,
        regions: null,
        table: null,
        charts: null
      },
      updateFilters: () => {},
      fetchAllDashboardData: () => Promise.resolve(),
      fetchTotalItemCount: () => Promise.resolve(0),
      fetchDashboardStats: () => Promise.resolve({}),
      fetchChartData: () => Promise.resolve([]),
      fetchTableData: () => Promise.resolve([])
    };
  }
  return context;
}

// Provider component
export function DataProvider({ children }) {
  // Use the custom hook to manage dashboard data and filters
  const {
    dashboardData,
    filters,
    loadingState,
    error,
    updateFilters,
    fetchAllDashboardData,
    fetchTotalItemCount,
    fetchDashboardStats,
    fetchChartData,
    fetchTableData,
    regions // Expose regions directly for convenience
  } = useDashboardData();

  // Create the context value
  const contextValue = useMemo(() => ({
    // Data
    dashboardStats: dashboardData.stats,
    chartData: dashboardData.charts,
    tableData: dashboardData.table.data,
    totalItems: dashboardData.table.totalItems,
    regions, // Use regions from the hook

    // Filters
    filters,

    // Loading states
    loading: loadingState, // Use loadingState directly from the hook

    // Error states
    error, // Use error directly from the hook

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
    fetchTableData,
    regions
  ]);

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}