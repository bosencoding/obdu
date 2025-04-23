'use client'

import { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { useData } from '@/app/context/DataContext';
import dynamic from 'next/dynamic';
import DashboardHeader from '@/components/DashboardHeader';
import SummaryCards from '@/components/SummaryCards';
import SecondarySection from '@/components/SecondarySection';
import FilterBar from '@/components/FilterBar';
import DashboardFooter from '@/components/DashboardFooter';

// Lazy-load heavy components (correctly for client components)
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
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('2025');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isPending, startTransition] = useTransition();
  
  // Get data and functions from context
  const { 
    dashboardStats, 
    chartData,
    loading, 
    fetchAllDashboardData 
  } = useData();
  
  // Prepare filters object for API calls
  const filters = useMemo(() => {
    const result = {};
    
    // Add filter year
    if (filterYear) {
      result.year = parseInt(filterYear);
    }
    
    // Add region filter if selected
    if (selectedRegion && selectedRegion.id !== 'all') {
      result.regionId = selectedRegion.id;
      
      if (selectedRegion.id.startsWith('province-')) {
        result.provinsi = selectedRegion.name;
      } else if (selectedRegion.id.startsWith('region-')) {
        result.provinsi = selectedRegion.provinsi;
        result.daerahTingkat = selectedRegion.type;
        // Extract kota_kab from the name by removing the type
        const kotaKab = selectedRegion.name.replace(selectedRegion.type, '').trim();
        result.kotaKab = kotaKab;
      }
    }
    
    // Add location filter if selected
    if (selectedLocation) {
      result.regionId = selectedLocation.id;
      result.provinsi = selectedLocation.provinsi;
      if (selectedLocation.type) {
        result.daerahTingkat = selectedLocation.type;
        // Extract kota_kab from the name by removing the type
        const kotaKab = selectedLocation.name.replace(selectedLocation.type, '').trim();
        result.kotaKab = kotaKab;
      }
    }
    
    return result;
  }, [filterYear, selectedRegion, selectedLocation]);
  
  // Fetch dashboard data when filters change
  useEffect(() => {
    // Use transition to prevent UI freezing
    startTransition(() => {
      fetchAllDashboardData(filters);
    });
  }, [filters, fetchAllDashboardData]);
  
  // Handle location selection changes with debounce
  const handleLocationChange = useCallback((location) => {
    setSelectedLocation(location);
    // Reset region selection when location is selected
    if (location) {
      setSelectedRegion(null);
    }
  }, []);

  // Handle region selection changes with debounce
  const handleRegionChange = useCallback((region) => {
    setSelectedRegion(region);
    // Reset location selection when region is selected
    if (region && region.id !== 'all') {
      setSelectedLocation(null);
    }
  }, []);

  // Debounced search query handler
  const handleSearchQueryChange = useCallback((value) => {
    startTransition(() => {
      setSearchQuery(value);
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <DashboardHeader />
      
      <SummaryCards 
        data={dashboardStats} 
        isLoading={loading.stats || isPending}
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
        isLoading={loading.charts || isPending}
      />
      
      <TableSection 
        searchQuery={searchQuery} 
        filterYear={filterYear}
        selectedRegion={selectedRegion}
        selectedLocation={selectedLocation}
      />
      
      <DashboardFooter />
    </div>
  );
}