"use client"

import { useState, useEffect } from 'react';
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
  
  // Update page in context when page changes
  useEffect(() => {
    if (useDataContext && typeof updateFilters === 'function' && filters && currentPage !== filters.page) {
      updateFilters({ page: currentPage });
    }
  }, [currentPage, filters, updateFilters, useDataContext]);
  
  // Sync local page with context page
  useEffect(() => {
    if (useDataContext && filters && filters.page && filters.page !== currentPage) {
      setCurrentPage(filters.page);
    }
  }, [filters, currentPage, useDataContext]);
  
  // Calculate pagination values
  const totalItems = useDataContext ? contextTotalItems : allData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
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

  // Handle pagination
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
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
              Menampilkan {totalItems > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, totalItems)} dari {totalItems} item
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                aria-label="Previous page"
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
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button 
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`p-2 rounded-md ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
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