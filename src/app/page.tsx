'use client'

import { useState, useEffect } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import SummaryCards from '@/components/SummaryCards';
import SecondarySection from '@/components/SecondarySection';
import ChartsSection from '@/components/ChartsSection';
import TableSection from '@/components/TableSection';
import FilterBar from '@/components/FilterBar';
import DashboardFooter from '@/components/DashboardFooter';
import { getDashboardStats, getChartData, getMockData} from '@/app/apiService';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('2025');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalAnggaran: 'Rp 5,240,000,000',
    totalPaket: 42,
    tender: 15,
    dikecualikan: 7,
    epkem: 12,
    pengadaanLangsung: 8
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pieChartData, setPieChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);

  // Fetch dashboard statistics whenever filters change
  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Prepare filter parameters
        const filters = {};
        
        // Add filter year
        if (filterYear) {
          filters.year = parseInt(filterYear);
        }
        
        // Add region filter if selected
        if (selectedRegion && selectedRegion.id !== 'all') {
          filters.regionId = selectedRegion.id;
          
          if (selectedRegion.id.startsWith('province-')) {
            filters.provinsi = selectedRegion.name;
          } else if (selectedRegion.id.startsWith('region-')) {
            filters.provinsi = selectedRegion.provinsi;
            filters.daerahTingkat = selectedRegion.type;
            // Extract kota_kab from the name by removing the type
            const kotaKab = selectedRegion.name.replace(selectedRegion.type, '').trim();
            filters.kotaKab = kotaKab;
          }
        }
        
        // Add location filter if selected
        if (selectedLocation) {
          filters.regionId = selectedLocation.id;
          filters.provinsi = selectedLocation.provinsi;
          if (selectedLocation.type) {
            filters.daerahTingkat = selectedLocation.type;
            // Extract kota_kab from the name by removing the type
            const kotaKab = selectedLocation.name.replace(selectedLocation.type, '').trim();
            filters.kotaKab = kotaKab;
          }
        }
        
        // Fetch dashboard statistics
        const stats = await getDashboardStats(filters);
        setDashboardStats(stats);
        
        // Fetch pie chart data
        const pieData = await getChartData('pie', filters);
        setPieChartData(pieData);
        
        // Fetch bar chart data
        const barData = await getChartData('bar', filters);
        setBarChartData(barData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
        
        // Set fallback data
        setDashboardStats({
          totalAnggaran: 'Rp 5,240,000,000',
          totalPaket: 42,
          tender: 15,
          dikecualikan: 7,
          epkem: 12,
          pengadaanLangsung: 8
        });
        
        setPieChartData([
          { name: 'Event Budaya', value: 46.1 },
          { name: 'Kesehatan', value: 28.4 },
          { name: 'WhatsApp Bisnis', value: 15.2 },
          { name: 'Event Seni', value: 10.3 }
        ]);
        
        setBarChartData([
          { name: 'Event Budaya', value: 30 },
          { name: 'Kampanye Kesehatan', value: 24 },
          { name: 'WhatsApp Bisnis', value: 18 },
          { name: 'Event Seni Bisnis', value: 15 },
          { name: 'Event Budaya 2', value: 12 },
          { name: 'WhatsApp Bisnis 2', value: 8 },
          { name: 'Lainnya', value: 5 }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [filterYear, selectedRegion, selectedLocation]);

  // Handle location selection changes
  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    // Reset region selection when location is selected
    if (location) {
      setSelectedRegion(null);
    }
  };

  // Handle region selection changes
  const handleRegionChange = (region) => {
    setSelectedRegion(region);
    // Reset location selection when region is selected
    if (region && region.id !== 'all') {
      setSelectedLocation(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <DashboardHeader />
      
      <SummaryCards 
        data={dashboardStats} 
        isLoading={isLoading}
      />
      
      <SecondarySection 
        data={dashboardStats}
      />
      
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterYear={filterYear}
        setFilterYear={setFilterYear}
        selectedRegion={selectedRegion}
        setSelectedRegion={handleRegionChange}
        selectedLocation={selectedLocation}
        setSelectedLocation={handleLocationChange}
      />
      
      <ChartsSection 
        pieData={pieChartData}
        barData={barChartData}
        isLoading={isLoading}
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