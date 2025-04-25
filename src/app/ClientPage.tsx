'use client'

import { useState, useEffect, useCallback, useMemo, useTransition, useRef } from 'react';
import { useData } from '@/app/context/DataContext';
import dynamic from 'next/dynamic';
import DashboardHeader from '@/components/DashboardHeader';
import SummaryCards from '@/components/SummaryCards';
import SecondarySection from '@/components/SecondarySection';
import FilterBar from '@/components/FilterBar';
import DashboardFooter from '@/components/DashboardFooter';

// Lazy-load heavy components for better performance
const ChartsSection = dynamic(() => import('@/components/ChartsSection'), {
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-sm p-4 h-64 animate-pulse"></div>
      <div className="bg-white rounded-lg shadow-sm p-4 h-64 animate-pulse"></div>
    </div>
  )
});

const TableSection = dynamic(() => import('@/components/TableSection'), {
  loading: () => (
    <div className="bg-white rounded-lg shadow-sm p-4 h-96 animate-pulse"></div>
  )
});

// Main Dashboard content component
export default function ClientPage() {
  // Refs to prevent update loops
  const updatingFiltersRef = useRef(false);
  const filtersTimeoutRef = useRef(null);
  
  // Debug logger
  const logDebug = useCallback((message, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ClientPage] ${message}`, data);
    }
  }, []);
  
  // Get data and functions from DataContext
  const { 
    dashboardStats, 
    chartData,
    loading, 
    filters,
    updateFilters,
    error
  } = useData();
  
  // Local UI state (will update DataContext on submit/debounce)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('2025');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isPending, startTransition] = useTransition();
  
  // Initialize local state from DataContext
  useEffect(() => {
    // Skip if we're in the middle of updating filters to avoid loops
    if (updatingFiltersRef.current) return;
    
    // Only update if filters is defined
    if (filters) {
      logDebug('Syncing from context filters to local state', filters);
      
      if (filters.searchQuery !== undefined && filters.searchQuery !== searchQuery) {
        setSearchQuery(filters.searchQuery);
      }
      
      if (filters.year !== undefined && filters.year.toString() !== filterYear) {
        setFilterYear(filters.year.toString());
      }
    }
  }, [filters, searchQuery, filterYear, logDebug]);
  
  // Create filters object for context update
  const prepareFilters = useCallback(() => {
    const newFilters = {};
    
    // Add filter year
    if (filterYear) {
      newFilters.year = parseInt(filterYear);
    }
    
    // Add search query if provided
    if (searchQuery) {
      newFilters.searchQuery = searchQuery;
    }
    
    // Add region filter if selected
    if (selectedRegion && selectedRegion.id !== 'all') {
      newFilters.regionId = selectedRegion.id;
      
      if (selectedRegion.id.startsWith('province-')) {
        newFilters.provinsi = selectedRegion.name;
        // Clear any district filters
        newFilters.daerahTingkat = null;
        newFilters.kotaKab = null;
      } else if (selectedRegion.id.startsWith('region-')) {
        newFilters.provinsi = selectedRegion.provinsi;
        newFilters.daerahTingkat = selectedRegion.type;
        // Extract kota_kab from the name by removing the type
        const kotaKab = selectedRegion.name.replace(selectedRegion.type || '', '').trim();
        newFilters.kotaKab = kotaKab;
      }
    } else if (selectedRegion && selectedRegion.id === 'all') {
      // Clear region filters if "all" is selected
      newFilters.regionId = null;
      newFilters.provinsi = null;
      newFilters.daerahTingkat = null;
      newFilters.kotaKab = null;
    }
    
    // Add location filter if selected
    if (selectedLocation) {
      newFilters.regionId = selectedLocation.id;
      newFilters.provinsi = selectedLocation.provinsi;
      if (selectedLocation.type) {
        newFilters.daerahTingkat = selectedLocation.type;
        // Extract kota_kab from the name by removing the type
        const kotaKab = selectedLocation.name.replace(selectedLocation.type || '', '').trim();
        newFilters.kotaKab = kotaKab;
      }
    }
    
    return newFilters;
  }, [filterYear, selectedRegion, selectedLocation, searchQuery]);
  
  // Handle filter updates - debounced with loop prevention
  const updateFiltersWithDebounce = useCallback(() => {
    // Clear any pending timeouts
    if (filtersTimeoutRef.current) {
      clearTimeout(filtersTimeoutRef.current);
    }
    
    // Set a new timeout to update filters after debounce period
    filtersTimeoutRef.current = setTimeout(() => {
      const newFilters = prepareFilters();
      
      // Set updating flag to prevent loops
      updatingFiltersRef.current = true;
      
      logDebug('Debounced filter update', newFilters);
      
      if (typeof updateFilters === 'function') {
        startTransition(() => {
          updateFilters(newFilters);
          
          // Reset updating flag after a small delay
          setTimeout(() => {
            updatingFiltersRef.current = false;
          }, 100);
        });
      } else {
        console.error('updateFilters is not a function. Check DataContext setup.');
        updatingFiltersRef.current = false;
      }
    }, 500); // 500ms debounce
  }, [prepareFilters, updateFilters, logDebug]);
  
  // Update filters when search, year, region or location changes
  // But with loop prevention
  useEffect(() => {
    // Skip if we're in the middle of updating from context to local state
    if (updatingFiltersRef.current) return;
    
    logDebug('Filter dependencies changed, scheduling update', { 
      searchQuery, filterYear, selectedRegion, selectedLocation 
    });
    
    updateFiltersWithDebounce();
    
    // Cleanup function
    return () => {
      if (filtersTimeoutRef.current) {
        clearTimeout(filtersTimeoutRef.current);
      }
    };
  }, [searchQuery, filterYear, selectedRegion, selectedLocation, updateFiltersWithDebounce, logDebug]);
  
  // Handle location selection changes
  const handleLocationChange = useCallback((location) => {
    logDebug('Location changed', location);
    setSelectedLocation(location);
    // Reset region selection when location is selected
    if (location) {
      setSelectedRegion(null);
    }
  }, [logDebug]);

  // Handle region selection changes
  const handleRegionChange = useCallback((region) => {
    logDebug('Region changed', region);
    setSelectedRegion(region);
    // Reset location selection when region is selected
    if (region && region.id !== 'all') {
      setSelectedLocation(null);
    }
  }, [logDebug]);

  // Handler for search query changes
  const handleSearchQueryChange = useCallback((query) => {
    logDebug('Search query changed', query);
    setSearchQuery(query);
  }, [logDebug]);

  // Show error state if DataContext reported an error
  if (error && error.dashboard) {
    return (
      <div className="container mx-auto px-4 py-6">
        <DashboardHeader />
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Terjadi Kesalahan</h2>
          <p className="mb-4">{error.dashboard}</p>
          <p className="text-gray-600">Silakan coba muat ulang halaman atau hubungi administrator sistem.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <DashboardHeader />
      
      <SummaryCards 
        data={dashboardStats} 
        isLoading={loading.dashboard || loading.stats || isPending}
      />
      
      <SecondarySection 
        data={dashboardStats}
      />
      
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={handleSearchQueryChange}
        filterYear={filterYear}
        setFilterYear={setFilterYear}
        selectedRegion={selectedRegion}
        setSelectedRegion={handleRegionChange}
        selectedLocation={selectedLocation}
        setSelectedLocation={handleLocationChange}
      />
      
      <ChartsSection 
        pieData={chartData.pie}
        barData={chartData.bar}
        isLoading={loading.dashboard || loading.charts || isPending}
      />
      
      <TableSection 
        useDataContext={true}
        // For backward compatibility
        searchQuery={searchQuery} 
        filterYear={filterYear}
        selectedRegion={selectedRegion}
        selectedLocation={selectedLocation}
      />
      
      <DashboardFooter />
    </div>
  );
}