'use client'

import { useState, useEffect, useCallback, useMemo, useTransition, useRef } from 'react';
import { useData } from '@/app/context/DataContext';
import dynamic from 'next/dynamic';
import DashboardHeader from '@/components/DashboardHeader';
import SummaryCards from '@/components/SummaryCards';
import SecondarySection from '@/components/SecondarySection';
import FilterBar from '@/components/FilterBar';
import DashboardFooter from '@/components/DashboardFooter';
import { type Filters, type Location, type Region, type DataContextType } from '../../types'; // Import types from types/index.ts
import { type Dispatch, type SetStateAction } from 'react'; // Import types from react


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
  const initialSyncDoneRef = useRef(false);
  
  // Debug logger
  const logDebug = useCallback((message: string, data?: any) => {
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
  } = useData() as DataContextType; // Cast useData hook result to DataContextType
  
  // Local UI state (will update DataContext on submit/debounce)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('2025');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isPending, startTransition] = useTransition();
  
  // Correct type for filtersTimeoutRef
  const filtersTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Single effect for syncing state from context
  // This prevents multiple state updates triggering multiple API calls
  useEffect(() => {
    // Skip if we're in the middle of updating filters to avoid loops
    if (updatingFiltersRef.current) return;
    
    // Only update if filters is defined
    if (filters) {
      // Only log on first sync or when filters change
      if (!initialSyncDoneRef.current) {
        logDebug('Initial sync from context filters to local state', filters);
        initialSyncDoneRef.current = true;
      }
      
      // Batch state updates to prevent multiple renders
      const updates: Partial<Filters> = {}; // Use Partial<Filters>
      
      // Check if filters properties exist before accessing
      if (filters.searchQuery !== undefined && filters.searchQuery !== searchQuery) {
        setSearchQuery(filters.searchQuery);
        updates.searchQuery = filters.searchQuery; // Store actual value
      }
      
      if (filters.year !== undefined && filters.year.toString() !== filterYear) {
        setFilterYear(filters.year.toString());
        updates.year = filters.year; // Store actual value
      }
      
      // Note: selectedRegion and selectedLocation are not synced from context here
      // as they are primarily driven by user interaction in FilterBar.
      // If context needed to control these, additional logic would be required.
      
      // Only log if something actually changed
      if (Object.keys(updates).length > 0) {
        logDebug('Updated local state from context', updates);
      }
    }
  }, [filters, searchQuery, filterYear, logDebug]);
  
  // Create filters object for context update - memoized to prevent unnecessary recalculations
  const prepareFilters = useMemo((): Filters => { // Explicitly type the return value
    const newFilters: Filters = {}; // Explicitly type newFilters
    
    // Add filter year
    if (filterYear) {
      newFilters.year = parseInt(filterYear, 10); // Ensure base 10
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
        // Ensure selectedRegion.provinsi and selectedRegion.type are not null/undefined before assigning
        if (selectedRegion.provinsi !== null && selectedRegion.provinsi !== undefined) {
           newFilters.provinsi = selectedRegion.provinsi;
        }
        if (selectedRegion.type !== null && selectedRegion.type !== undefined) {
           newFilters.daerahTingkat = selectedRegion.type;
        }
       
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
    
    // Add location filter if selected (This part seems contradictory with the user's request
    // to NOT filter the table based on AIDA selection. I will keep it for now but
    // note that handleLocationChange below has been modified to prevent this path).
    // If the user confirms AIDA selection should *never* filter the table, this block
    // should be removed or modified.
    // Removed selectedLocation filtering based on user feedback.
    // If you need to re-enable filtering by AIDA selection, uncomment the block below.
    /*
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
    */
    
    return newFilters;
  }, [filterYear, selectedRegion, selectedLocation, searchQuery]);
  
  // Handle filter updates with debounce
  const updateFiltersWithDebounce = useCallback(() => {
    // Skip if we're already updating
    if (updatingFiltersRef.current) return;
    
    // Clear any pending timeouts
    if (filtersTimeoutRef.current) {
      clearTimeout(filtersTimeoutRef.current);
    }
    
    // Set a new timeout to update filters after debounce period
    filtersTimeoutRef.current = setTimeout(() => {
      // Set updating flag to prevent loops
      updatingFiltersRef.current = true;
      
      // Get the current filters
      const currentFilters = prepareFilters;
      logDebug('Debounced filter update', currentFilters);
      
      if (typeof updateFilters === 'function') {
        startTransition(() => {
          // Pass the filters object to updateFilters
          updateFilters(currentFilters);
          
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
  
  // Optimized handlers for filter changes
  // These handlers update local state but don't trigger immediate API calls
  // Instead, they rely on the useEffect below to batch updates
  
  // Handle location selection changes (from AutocompleteSearch)
  const handleLocationChange = useCallback((location: Location | null) => { // Explicitly type location
    logDebug('Location selected from AIDA dropdown', location);
    
    // Update local state only
    setSelectedLocation(location);
    
    // Do NOT call updateFiltersWithDebounce() here based on user feedback.
    // This prevents the unwanted redirect/modal and keeps the selection for future use.
    // Note: This means selecting a location from the AIDA dropdown will no longer filter the main table.
    // If you need to trigger a filter update based on AIDA selection in the future,
    // you would re-enable updateFiltersWithDebounce() here.
    
    // If you need to reset region when a location is selected from AIDA:
    // if (location) {
    //   setSelectedRegion(null);
    // }
    
  }, [logDebug]); // Removed updateFiltersWithDebounce from dependencies

  // Handle region selection changes (from RegionDropdown)
  const handleRegionChange = useCallback((region: Region | null) => { // Explicitly type region
    logDebug('Region changed', region);
    
    // Update local state
    setSelectedRegion(region);
    
    // Reset location selection when region is selected
    if (region && region.id !== 'all') {
      setSelectedLocation(null);
    }
    
    // Schedule debounced update
    updateFiltersWithDebounce();
  }, [logDebug, updateFiltersWithDebounce]); // Keep updateFiltersWithDebounce here to filter by region

  // Handler for search query changes (from FilterBar search input)
  const handleSearchQueryChange = useCallback((query: string) => { // Explicitly type query
    logDebug('Search query changed', query);
    
    // Update local state
    setSearchQuery(query);
    
    // Schedule debounced update
    updateFiltersWithDebounce();
  }, [logDebug, updateFiltersWithDebounce]); // Keep updateFiltersWithDebounce here to filter by search query

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
        setFilterYear={setFilterYear as Dispatch<SetStateAction<string>>} // Cast to correct type
        selectedRegion={selectedRegion}
        setSelectedRegion={handleRegionChange}
        selectedLocation={selectedLocation}
        setSelectedLocation={handleLocationChange}
        // updateFilters prop is not needed in FilterBar as it uses DataContext directly
        // Removed: updateFilters={updateFilters}
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