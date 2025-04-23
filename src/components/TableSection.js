"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { useData } from '@/app/context/DataContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TableLoadingState from './TableLoadingState';
import VirtualizedTable from './VirtualizedTable';

export default function TableSection({ 
  searchQuery, 
  filterYear,
  selectedRegion,
  selectedLocation
}) {
  // Use table data from context
  const { tableData, totalItems, loading, fetchTableData } = useData();
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10; // Number of items per page
  
  // Previous filters ref to prevent unnecessary API calls
  const prevFiltersRef = useRef({ searchQuery, filterYear, selectedRegion, selectedLocation, currentPage });
  
  // Prepare filters object for API calls
  const prepareFilters = useCallback(() => {
    const filters = {};
    
    // Add search query if provided
    if (searchQuery) {
      filters.search = searchQuery;
    }
    
    // Add filter year if provided
    if (filterYear) {
      filters.year = parseInt(filterYear);
    }
    
    // Add region filter if selected from dropdown
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
    
    // Add location filter if selected from autocomplete
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
    
    return filters;
  }, [searchQuery, filterYear, selectedRegion, selectedLocation]);
  
  // Fetch data based on filters and pagination
  useEffect(() => {
    const filters = prepareFilters();
    
    // Check if filters have changed to prevent unnecessary API calls
    const currentFilters = { searchQuery, filterYear, selectedRegion, selectedLocation, currentPage };
    const prevFilters = prevFiltersRef.current;
    
    // Compare if any filter has changed
    const filtersChanged = 
      prevFilters.searchQuery !== currentFilters.searchQuery ||
      prevFilters.filterYear !== currentFilters.filterYear ||
      prevFilters.selectedRegion?.id !== currentFilters.selectedRegion?.id ||
      prevFilters.selectedLocation?.id !== currentFilters.selectedLocation?.id ||
      prevFilters.currentPage !== currentFilters.currentPage;
    
    if (filtersChanged) {
      const fetchData = async () => {
        setError(null);
        
        try {
          // Fetch data using the context function
          await fetchTableData(currentPage, itemsPerPage, filters);
          
          // Calculate total pages
          setTotalPages(Math.max(1, Math.ceil(totalItems / itemsPerPage)));
          
          // Update the previous filters ref
          prevFiltersRef.current = currentFilters;
        } catch (err) {
          console.error('Error fetching data:', err);
          setError(err.message);
        }
      };
      
      fetchData();
    }
  }, [
    searchQuery, 
    filterYear, 
    selectedRegion, 
    selectedLocation, 
    currentPage, 
    totalItems, 
    fetchTableData, 
    prepareFilters
  ]);
  
  // Handle pagination
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);
  
  if (loading.table) {
    return <TableLoadingState />;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">
        Paket Pekerjaan {selectedLocation?.name || (selectedRegion?.id !== 'all' ? selectedRegion?.name : 'Sesuai')}
      </h2>
      
      {error ? (
        <div className="text-center py-8 text-red-500">
          <p>Terjadi kesalahan: {error}</p>
          <p className="mt-2 text-sm">Menampilkan data contoh.</p>
        </div>
      ) : (
        <>
          {/* Use optimized virtualized table component */}
          <VirtualizedTable data={tableData} />
          
          {/* Pagination controls */}
          <div className="flex items-center justify-between mt-4 border-t pt-4">
            <div className="text-sm text-gray-500">
              Menampilkan {tableData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {(currentPage - 1) * itemsPerPage + tableData.length} dari {totalItems} item
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ChevronLeft size={16} />
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Logic to show current page and surrounding pages
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={i}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 rounded-md ${currentPage === pageNum ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button 
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}