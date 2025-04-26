"use client"

import { useState, useEffect, useCallback } from 'react';
import { useData } from '@/app/context/DataContext';
import PaketTable from './PaketTable';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TableSection({ 
  // Props below for backward compatibility
  searchQuery, 
  filterYear,
  selectedRegion,
  selectedLocation,
  // Use DataContext by default
  useDataContext = true
}) {
  // Get data from context
  const { 
    tableData: contextTableData,
    totalItems: contextTotalItems, 
    loading, 
    filters,
    updateFilters,
    fetchTableData,
    fetchTotalItemCount,
    error
  } = useData();
  
  // Local state for non-context mode (backward compatibility)
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Determine which data source to use
  const tableData = useDataContext ? contextTableData : allData;
  const loadingState = useDataContext ? (loading.dashboard || loading.table) : isLoading;
  const tableError = useDataContext ? (error?.dashboard || error?.table) : errorMessage;
  
  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Use context total items - default to 1500 if not available
  // This ensures pagination works with a large number of pages initially
  const totalItems = useDataContext 
    ? (contextTotalItems || 1500)
    : allData.length;
  
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Force show next page button if we have a full page of items
  const shouldShowNextPage = tableData.length >= itemsPerPage;
  
  // Fetch total item count on component mount and when filters change
  // This ensures we always have the most accurate count
  useEffect(() => {
    if (useDataContext && typeof fetchTotalItemCount === 'function') {
      fetchTotalItemCount(filters);
    }
  }, [useDataContext, fetchTotalItemCount, filters]);
  
  // More reliable handler for pagination changes
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && (newPage <= totalPages || (newPage === currentPage + 1 && shouldShowNextPage))) {
      setCurrentPage(newPage);
      
      if (useDataContext && typeof updateFilters === 'function') {
        // Important: Use an object with just the page property to avoid overriding other filters
        updateFilters({ page: newPage });
        
        // For more reliable pagination, directly fetch table data with new page
        if (typeof fetchTableData === 'function') {
          fetchTableData(newPage, itemsPerPage);
        }
      }
    }
  }, [useDataContext, updateFilters, fetchTableData, totalPages, itemsPerPage, currentPage, shouldShowNextPage]);
  
  // Sync local page with context page when filters change
  useEffect(() => {
    if (useDataContext && filters?.page && filters.page !== currentPage) {
      setCurrentPage(filters.page);
    }
  }, [filters, currentPage, useDataContext]);
  
  // Calculate current page data slice (for non-context mode)
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayData = useDataContext 
    ? tableData 
    : allData.slice(startIndex, endIndex).map((item, index) => ({
        no: startIndex + index + 1,
        nama: item.paket || item.nama || '-',
        satuan: item.satuan_kerja || item.satuan || '-',
        krema: item.metode || item.krema || '-',
        jadwal: item.pemilihan || item.jadwal || 'Belum ditentukan',
        status: item.status || determineStatus(item),
        keterangan: item.keterangan || item.jenis_pengadaan || '-',
        wilayah: item.wilayah || item.lokasi || formatWilayah(item)
      }));
  
  // Format wilayah from item data (for non-context mode)
  function formatWilayah(item) {
    if (item.lokasi) return item.lokasi;
    
    if (item.provinsi) {
      let result = '';
      if (item.daerah_tingkat) result += `${item.daerah_tingkat} `;
      if (item.kota_kab) result += item.kota_kab;
      if (result) result += `, ${item.provinsi}`;
      else result = item.provinsi;
      return result;
    }
    
    return '-';
  }
  
  // Determine status based on item data (for non-context mode)
  function determineStatus(item) {
    const currentDate = new Date();
    const itemDate = item.pemilihan_datetime ? new Date(item.pemilihan_datetime) : null;
    
    if (!itemDate) return 'Sesuai';
    
    if (itemDate < currentDate) return 'Hrge Esak Btorch';
    if (item.is_pdn === false) return 'Dibth Flnxnnm';
    return 'Sesuai';
  }

  // Determine the page title based on context filters or props
  const pageTitle = useDataContext
    ? getPageTitle(filters)
    : (selectedLocation?.name || 
      (selectedRegion?.id !== 'all' ? selectedRegion?.name : 
      (!searchQuery && !selectedRegion && !selectedLocation ? 'Kota Jakarta Selatan' : 'Semua')));
  
  // Helper function to get page title from filters
  function getPageTitle(filters) {
    // Safety check - if filters is undefined, return default
    if (!filters) {
      return 'Daftar Paket';
    }
    
    if (filters.kotaKab && filters.daerahTingkat) {
      return `${filters.daerahTingkat} ${filters.kotaKab}`;
    }
    
    if (filters.provinsi && !filters.kotaKab) {
      return filters.provinsi;
    }
    
    if (filters.searchQuery) {
      return `Pencarian: ${filters.searchQuery}`;
    }
    
    // Default
    return 'Daftar Paket';
  }

  // Generate array of page numbers to display
  const getPageNumbers = useCallback(() => {
    const pageNumbers = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else if (currentPage <= 4) {
      // Near the beginning
      for (let i = 1; i <= 5; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push('...');
      pageNumbers.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      // Near the end
      pageNumbers.push(1);
      pageNumbers.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Middle
      pageNumbers.push(1);
      pageNumbers.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push('...');
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  }, [currentPage, totalPages]);
  
  // Empty state for when there's no data
  const EmptyState = () => (
    <div className="py-8 text-center">
      <p className="text-gray-500">Tidak ada data yang ditemukan.</p>
      {filters?.searchQuery && (
        <p className="mt-2 text-sm text-gray-500">
          Coba ubah filter pencarian atau wilayah untuk melihat hasil berbeda.
        </p>
      )}
    </div>
  );
  
  // Error state
  const ErrorState = ({ message }) => (
    <div className="py-8 text-center">
      <p className="text-red-500">Terjadi kesalahan saat memuat data.</p>
      {message && <p className="mt-2 text-sm text-gray-500">{message}</p>}
    </div>
  );
  
  // Get the array of page numbers
  const pageNumbers = getPageNumbers();
  
  // Calculate the actual items shown on the current page
  const itemsShown = tableData.length;
  const displayStartIndex = startIndex + 1;
  const displayEndIndex = startIndex + itemsShown;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">
        Paket Pekerjaan {pageTitle}
      </h2>
      
      {loadingState ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-500">Memuat data...</p>
        </div>
      ) : tableError ? (
        <ErrorState message={tableError} />
      ) : tableData.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <PaketTable data={displayData} />
          
          {/* Pagination controls */}
          <div className="flex items-center justify-between mt-4 border-t pt-4">
            <div className="text-sm text-gray-500">
              Menampilkan {displayStartIndex} - {displayEndIndex} dari {totalItems.toLocaleString()} item
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              
              {/* Page numbers with ellipsis */}
              {pageNumbers.map((pageNum, index) => {
                if (pageNum === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-400">
                      ...
                    </span>
                  );
                }
                
                return (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-md ${currentPage === pageNum ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!shouldShowNextPage && currentPage === totalPages}
                className={`p-2 rounded-md ${(!shouldShowNextPage && currentPage === totalPages) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                aria-label="Next page"
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