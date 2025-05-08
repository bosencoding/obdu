import { useState, useEffect, useCallback } from 'react';
import { useData } from '@/app/context/DataContext';
import PaketTable from './PaketTable';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TableSection({ 
  searchQuery, 
  filterYear,
  selectedRegion,
  selectedLocation,
  useDataContext = true
}) {
  // Dapatkan data dari context
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
  
  // State lokal untuk mode non-context (kompatibilitas mundur)
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Tentukan sumber data mana yang akan digunakan
  const tableData = useDataContext ? contextTableData : allData;
  const loadingState = useDataContext ? (loading.dashboard || loading.table) : isLoading;
  const tableError = useDataContext ? (error?.dashboard || error?.table) : errorMessage;
  
  // Paginasi sisi klien
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Dapatkan total items count saat pertama kali dimuat dan saat filter berubah
  useEffect(() => {
    if (useDataContext && typeof fetchTotalItemCount === 'function' && !loadingState) {
      fetchTotalItemCount();
    }
  }, [useDataContext, fetchTotalItemCount, filters, loadingState]);
  
  // Gunakan total items dari context - dapatkan jumlah yang tepat dari API
  const totalItems = useDataContext 
    ? (contextTotalItems || 0)
    : allData.length;
  
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Tampilkan tombol halaman berikutnya jika kita memiliki halaman penuh data
  const shouldShowNextPage = tableData.length >= itemsPerPage;
  
  // Sinkronkan dengan filter saat ini saat komponen di-mount dan saat filter berubah
  useEffect(() => {
    if (useDataContext && filters) {
      // Sinkronkan dengan filter saat ini
      setCurrentPage(filters.page || 1);
      
      // Jika tableData kosong tetapi seharusnya ada data, coba ambil
      if (tableData.length === 0 && !loadingState && !tableError) {
        if (typeof fetchTableData === 'function') {
          fetchTableData(filters.page || 1, itemsPerPage);
        }
      }
    }
  }, [filters, useDataContext, tableData, loadingState, tableError, fetchTableData, itemsPerPage]);
  
  // Handler yang lebih andal untuk perubahan halaman
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && (newPage <= totalPages || (newPage === currentPage + 1 && shouldShowNextPage))) {
      setCurrentPage(newPage);
      
      if (useDataContext && typeof updateFilters === 'function') {
        // Perbarui filter dengan halaman baru
        updateFilters({ page: newPage });
        
        // Untuk paginasi yang lebih andal, ambil data tabel langsung dengan halaman baru
        if (typeof fetchTableData === 'function') {
          fetchTableData(newPage, itemsPerPage);
        }
      }
    }
  }, [useDataContext, updateFilters, fetchTableData, totalPages, itemsPerPage, currentPage, shouldShowNextPage]);
  
<<<<<<< Updated upstream
  // Sinkronkan halaman lokal dengan halaman context saat filter berubah
  useEffect(() => {
    if (useDataContext && filters?.page && filters.page !== currentPage) {
      setCurrentPage(filters.page);
    }
  }, [filters, currentPage, useDataContext]);
=======
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
>>>>>>> Stashed changes
  
  // Generate array nomor halaman untuk ditampilkan
  const getPageNumbers = useCallback(() => {
    const pageNumbers = [];
    
    if (totalPages <= 7) {
      // Tampilkan semua halaman jika 7 atau kurang
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else if (currentPage <= 4) {
      // Dekat dengan awal
      for (let i = 1; i <= 5; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push('...');
      pageNumbers.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      // Dekat dengan akhir
      pageNumbers.push(1);
      pageNumbers.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Tengah
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
  
  // Dapatkan array nomor halaman
  const pageNumbers = getPageNumbers();
  
  // Hitung items yang ditampilkan pada halaman saat ini
  const startIndex = (currentPage - 1) * itemsPerPage;
  const itemsShown = tableData.length;
  const displayStartIndex = startIndex + 1;
  const displayEndIndex = startIndex + itemsShown;
  
  // Ambil data untuk ditampilkan (untuk mode non-context)
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

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">
        Paket Pekerjaan {getPageTitle(filters, selectedLocation, selectedRegion, searchQuery)}
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
              Menampilkan {displayStartIndex} - {displayEndIndex} dari {totalItems > 0 ? totalItems.toLocaleString() : '0'} item
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

// Komponen untuk state kosong
const EmptyState = () => (
  <div className="py-8 text-center">
    <p className="text-gray-500">Tidak ada data yang ditemukan.</p>
    <p className="mt-2 text-sm text-gray-500">
      Coba ubah filter pencarian atau wilayah untuk melihat hasil berbeda.
    </p>
  </div>
);

// Komponen untuk state error
const ErrorState = ({ message }) => (
  <div className="py-8 text-center">
    <p className="text-red-500">Terjadi kesalahan saat memuat data.</p>
    {message && <p className="mt-2 text-sm text-gray-500">{message}</p>}
  </div>
);

// Helper function untuk mendapatkan judul halaman dari filter
function getPageTitle(filters, selectedLocation, selectedRegion, searchQuery) {
  // Safety check - jika filters tidak terdefinisi, kembalikan default
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
  
  // Fallback untuk kompatibilitas mundur
  if (selectedLocation?.name) {
    return selectedLocation.name;
  }
  
  if (selectedRegion?.id !== 'all' && selectedRegion?.name) {
    return selectedRegion.name;
  }
  
  if (searchQuery) {
    return `Pencarian: ${searchQuery}`;
  }
  
  // Default
  return 'Daftar Paket';
}