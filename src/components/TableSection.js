"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useData } from '@/app/context/DataContext';
import PaketTable from './PaketTable';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import apiService from '@/app/apiService'; // Import apiService


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
    error
  } = useData();
  
  // Refs to prevent unnecessary API calls
  const initialLoadDoneRef = useRef(false);
  const isUpdatingRef = useRef(false);
  
  // Local state for filter selections
  const [metodeFilter, setMetodeFilter] = useState('');
  const [jadwalFilter, setJadwalFilter] = useState('');
  const [keteranganFilter, setKeteranganFilter] = useState('');

  // Local state for non-context mode (backward compatibility)
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Determine which data source to use
  const tableData = useDataContext ? contextTableData : allData;
  const loadingState = useDataContext ? (loading.dashboard || loading.table) : isLoading;
  const tableError = useDataContext ? (error?.dashboard || error?.table) : errorMessage;
  
  // State for unique filter options derived from data
  const [jenisPengadaanOptions, setJenisPengadaanOptions] = useState([]);

  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Generate month/year options for Jadwal filter
  const jadwalMonthYearOptions = useMemo(() => {
    const year = filters?.year; // Get year from context filters
    if (!year) return [];

    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months.map(month => `${month} ${year}`);
  }, [filters?.year]); // Regenerate when year filter changes

  // Use context total items
  const totalItems = useDataContext
    ? (contextTotalItems || 0)
    : allData.length;
  
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Force show next page button if we have a full page of items
  const shouldShowNextPage = tableData.length >= itemsPerPage;
  
  // Single effect for initial data loading and page synchronization
  useEffect(() => {
    // Skip if we're in the middle of an update to prevent loops
    if (isUpdatingRef.current) return;
    
    if (useDataContext && filters) {
      // Sync current page with filters
      if (filters.page && filters.page !== currentPage) {
        setCurrentPage(filters.page);
      }
      
      // Only fetch data on initial load or when filters change significantly
      if (!initialLoadDoneRef.current && !loadingState) {
        initialLoadDoneRef.current = true;
        
        if (typeof fetchTableData === 'function') {
          fetchTableData(filters.page || 1, itemsPerPage);
        }
      }
    }
  }, [useDataContext, filters, currentPage, loadingState, fetchTableData, itemsPerPage]);
  
  // Effect to extract unique Jenis Pengadaan filter options from tableData
  useEffect(() => {
    if (tableData && tableData.length > 0) {
      // Extract unique Jenis Pengadaan
      const uniqueJenisPengadaan = [...new Set(tableData.map(item => item.keterangan).filter(Boolean))]; // Use item.keterangan as source
      setJenisPengadaanOptions(uniqueJenisPengadaan);
    } else {
      // Reset options if no data
      setJenisPengadaanOptions([]);
    }
  }, [tableData]); // Re-run when tableData changes

  // Optimized handler for pagination changes
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && (newPage <= totalPages || (newPage === currentPage + 1 && shouldShowNextPage))) {
      // Set local state immediately for better UX
      setCurrentPage(newPage);
      
      if (useDataContext && typeof updateFilters === 'function') {
        // Prevent update loops
        isUpdatingRef.current = true;
        
        // Update filters with new page - this will trigger data fetch in DataContext
        updateFilters({ page: newPage });
        
        // Reset updating flag after a short delay
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }
    }
  }, [useDataContext, updateFilters, totalPages, currentPage, shouldShowNextPage]);
  
  // Handle AIDA change
  const handleAidaChange = useCallback(async (item, aidaValue) => {
    if (!item || !item.id) {
      console.error("Item or Item ID is missing for AIDA update.");
      return;
    }

    const idSirup = item.id; // Assuming item.id is the id_sirup
    const value = parseInt(aidaValue, 10);

    try {
      // Call the API to update AIDA
      await apiService.updatePackageAida(idSirup, value);
      console.log(`Successfully updated AIDA for ${idSirup} to ${value}`);

      // Optionally, update the local state immediately for faster feedback
      // This requires managing tableData state locally or having a context function
      // For now, we'll rely on re-fetching the data after successful update

      // Re-fetch the current page data to reflect the change
      if (useDataContext && typeof fetchTableData === 'function') {
        // Prevent update loops
        isUpdatingRef.current = true;
        await fetchTableData(currentPage, itemsPerPage);
         setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }

    } catch (error) {
      console.error(`Error updating AIDA for ${idSirup}:`, error);
      // TODO: Show user-friendly error message (e.g., toast notification)
    }
  }, [useDataContext, fetchTableData, currentPage, itemsPerPage]); // Added dependencies


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
        wilayah: item.wilayah || item.lokasi || formatWilayah(item),
        pagu: item.pagu || '-' // Corrected pagu field name
      }));
  
  // Helper functions for non-context mode
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
      pageNumbers.push('...');
      pageNumbers.push(totalPages);
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
      
      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-end gap-4 mb-6"> {/* Use items-end to align labels */}
        {/* Metode Filter */}
        <div className="flex-grow min-w-[150px]"> {/* Added flex-grow and min-width */}
          <label htmlFor="metode-filter" className="block text-sm font-medium text-gray-700 mb-1">Metode</label> {/* Added mb-1 */}
          <select
            id="metode-filter"
            name="metode-filter"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={metodeFilter}
            onChange={(e) => {
              setMetodeFilter(e.target.value);
              updateFilters({ metode: e.target.value });
            }}
          >
            <option value="">Semua Metode</option>
            {/* Add actual options here based on available data */}
            <option value="Tender">Tender</option>
            <option value="E-Purchasing">E-Purchasing</option>
             {/* Add other methods if known */}
          </select>
        </div>

        {/* Jadwal Filter */}
        <div className="flex-grow min-w-[150px]"> {/* Added flex-grow and min-width */}
          <label htmlFor="jadwal-filter" className="block text-sm font-medium text-gray-700 mb-1">Jadwal</label> {/* Added mb-1 */}
          <select
            id="jadwal-filter"
            name="jadwal-filter"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={jadwalFilter}
            onChange={(e) => {
              setJadwalFilter(e.target.value);
              updateFilters({ jadwal: e.target.value });
            }}
          >
            <option value="">Semua Jadwal</option>
            {/* Options populated from generated month/year */}
            {jadwalMonthYearOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Jenis Pengadaan Filter */}
        <div className="flex-grow min-w-[150px]"> {/* Added flex-grow and min-width */}
          <label htmlFor="jenis-pengadaan-filter" className="block text-sm font-medium text-gray-700 mb-1">Jenis Pengadaan</label> {/* Added mb-1 */}
          <select
            id="jenis-pengadaan-filter"
            name="jenis-pengadaan-filter"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={keteranganFilter} // Still using keteranganFilter state for now
            onChange={(e) => {
              setKeteranganFilter(e.target.value); // Still updating keteranganFilter state
              updateFilters({ jenisPengadaan: e.target.value }); // Update filter with jenisPengadaan
            }}
          >
            <option value="">Semua Jenis Pengadaan</option>
            {/* Options populated from unique data */}
            {jenisPengadaanOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

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
          <PaketTable data={displayData} onAidaChange={handleAidaChange} /> {/* Pass the handler */}

          {/* Pagination controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 border-t pt-4"> {/* Added flex-col for small screens */}
            <div className="text-sm text-gray-500 mb-2 sm:mb-0"> {/* Added margin-bottom for small screens */}
              Menampilkan {displayStartIndex} - {displayEndIndex} dari {totalItems > 0 ? totalItems.toLocaleString() : '0'} item
            </div>
            <div className="flex items-center space-x-1"> {/* Reduced space-x */}
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
                    <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-400"> {/* Adjusted padding */}
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-md text-sm ${currentPage === pageNum ? 'bg-blue-600 text-white font-medium' : 'text-gray-700 hover:bg-gray-200'}`}
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