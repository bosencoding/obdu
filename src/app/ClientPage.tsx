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
  // Get data and functions from DataContext
  const { 
    dashboardStats, 
    chartData,
    loading, 
    filters,
    updateFilters,
    fetchAllDashboardData,
    error
  } = useData();
  
  // Local UI state for FilterBar
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('2025');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isPending, startTransition] = useTransition();
  
  // Refs for state management
  const syncingFromContextRef = useRef(false);
  
  // Debug logger
  const logDebug = useCallback((message, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ClientPage] ${message}`, data);
    }
  }, []);
  
  // Initialize local state from DataContext (sync from context to local state)
  useEffect(() => {
    // Skip if we're already syncing to avoid loops
    if (syncingFromContextRef.current) return;
    
    // Only sync if filters is defined
    if (filters) {
      syncingFromContextRef.current = true;
      logDebug('Syncing from context filters to local state', filters);
      
      try {
        // Update search query
        if (filters.searchQuery !== undefined && filters.searchQuery !== searchQuery) {
          setSearchQuery(filters.searchQuery);
        }
        
        // Update year filter
        if (filters.year !== undefined) {
          const yearStr = filters.year.toString();
          if (yearStr !== filterYear) {
            setFilterYear(yearStr);
          }
        }
        
        // Update selected location or region based on filter data
        if (filters.regionId && filters.daerahTingkat && filters.kotaKab) {
          // If we have detailed location info, create a location object
          if (!selectedLocation || selectedLocation.name !== `${filters.daerahTingkat} ${filters.kotaKab}`) {
            const locationFromFilters = {
              id: filters.regionId,
              name: `${filters.daerahTingkat} ${filters.kotaKab}`,
              provinsi: filters.provinsi,
              type: filters.daerahTingkat,
              count: 0
            };
            setSelectedLocation(locationFromFilters);
            
            // Clear region when location is set
            if (selectedRegion) {
              setSelectedRegion(null);
            }
          }
        } else if (filters.regionId && filters.provinsi && !filters.kotaKab) {
          // If we just have province info, create a region object
          if (!selectedRegion || selectedRegion.name !== filters.provinsi) {
            const regionFromFilters = {
              id: filters.regionId,
              name: filters.provinsi,
              provinsi: filters.provinsi,
              type: null,
              count: 0
            };
            setSelectedRegion(regionFromFilters);
            
            // Clear location when region is set
            if (selectedLocation) {
              setSelectedLocation(null);
            }
          }
        }
      } finally {
        // Important: always reset the syncing flag when done
        setTimeout(() => {
          syncingFromContextRef.current = false;
        }, 50);
      }
    }
  }, [filters, searchQuery, filterYear, selectedRegion, selectedLocation, logDebug]);
  
  // Handler for search query changes
  const handleSearchQueryChange = useCallback((query) => {
    logDebug('Search query changed', query);
    setSearchQuery(query);
  }, [logDebug]);

  // Handler for year filter changes
  const handleYearChange = useCallback((year) => {
    logDebug('Year filter changed', year);
    setFilterYear(year);
  }, [logDebug]);

  // Handler for region selection changes
  const handleRegionChange = useCallback((region) => {
    logDebug('Region changed', region);
    setSelectedRegion(region);
    // Reset location selection when region is selected
    if (region && region.id !== 'all') {
      setSelectedLocation(null);
    }
  }, [logDebug]);

  // Handler for location selection changes
  const handleLocationChange = useCallback((location) => {
    logDebug('Location changed', location);
    setSelectedLocation(location);
    // Reset region selection when location is selected
    if (location) {
      setSelectedRegion(null);
    }
  }, [logDebug]);

  // Effect to trigger data load when search, year, region, or location changes
  useEffect(() => {
    // Skip if we're syncing from context to avoid loops
    if (syncingFromContextRef.current) return;
    
    // Log that we're about to trigger data load
    logDebug('Local filter state changed, preparing to sync', {
      searchQuery,
      filterYear,
      selectedRegion,
      selectedLocation
    });
    
    // If updateFilters is available, use it to update global state
    if (typeof updateFilters === 'function') {
      // Using startTransition to avoid UI freezes
      startTransition(() => {
        // Build filters object based on current UI state
        const newFilters: any = {};
        
        // Add search query if provided
        if (searchQuery) {
          newFilters.searchQuery = searchQuery;
        }
        
        // Add filter year
        if (filterYear) {
          newFilters.year = parseInt(filterYear);
        }
        
        // Add location or region filters
        if (selectedLocation) {
          newFilters.regionId = selectedLocation.id;
          newFilters.provinsi = selectedLocation.provinsi;
          newFilters.daerahTingkat = selectedLocation.type || null;
          
          // Extract kotaKab from name by removing type prefix
          const kotaKab = selectedLocation.type 
            ? selectedLocation.name.replace(selectedLocation.type, '').trim() 
            : selectedLocation.name;
            
          newFilters.kotaKab = kotaKab;
        } else if (selectedRegion && selectedRegion.id !== 'all') {
          newFilters.regionId = selectedRegion.id;
          
          if (selectedRegion.id.startsWith('province-')) {
            newFilters.provinsi = selectedRegion.name;
            // Clear district filters
            newFilters.daerahTingkat = null;
            newFilters.kotaKab = null;
          } else if (selectedRegion.id.startsWith('region-')) {
            newFilters.provinsi = selectedRegion.provinsi;
            newFilters.daerahTingkat = selectedRegion.type;
            
            // Extract kotaKab from name
            const kotaKab = selectedRegion.type 
              ? selectedRegion.name.replace(selectedRegion.type, '').trim() 
              : selectedRegion.name;
              
            newFilters.kotaKab = kotaKab;
          }
        } else if (selectedRegion && selectedRegion.id === 'all') {
          // Clear all region filters if "all" is selected
          newFilters.regionId = null;
          newFilters.provinsi = null;
          newFilters.daerahTingkat = null;
          newFilters.kotaKab = null;
        }
        
        // Only update if we have actual filter values
        if (Object.keys(newFilters).length > 0) {
          logDebug('Updating global filters', newFilters);
          updateFilters(newFilters);
        }
      });
    }
  }, [searchQuery, filterYear, selectedRegion, selectedLocation, updateFilters, logDebug]);

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
        useDataContext={true}
      />
      
      <SecondarySection 
        data={dashboardStats}
      />
      
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={handleSearchQueryChange}
        filterYear={filterYear}
        setFilterYear={handleYearChange}
        selectedRegion={selectedRegion}
        setSelectedRegion={handleRegionChange}
        selectedLocation={selectedLocation}
        setSelectedLocation={handleLocationChange}
      />
      
      <ChartsSection 
        useDataContext={true}
      />
      
      <TableSection 
        useDataContext={true}
      />
      
      <DashboardFooter />
    </div>
  );
}