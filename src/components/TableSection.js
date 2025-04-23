"use client"

import { useState, useEffect } from 'react';
import PaketTable from './PaketTable';
import { getFilteredPackages } from '@/app/apiService';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TableSection({ 
  searchQuery, 
  filterYear,
  selectedRegion,
  selectedLocation
}) {
  // Store all data fetched from API
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Calculate pagination values
  const totalItems = allData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Calculate current page data slice
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = allData.slice(startIndex, endIndex);
  
  // Format data for display in the table
  const tableData = currentPageData.map((item, index) => ({
    no: startIndex + index + 1,
    nama: item.paket,
    satuan: item.satuan_kerja,
    krema: item.metode,
    jadwal: item.pemilihan || 'Belum ditentukan',
    status: determineStatus(item),
    keterangan: item.jenis_pengadaan || 'dil.',
    wilayah: item.lokasi || item.provinsi || '-'
  }));
  
  // Initial load - get Jakarta Selatan data
  useEffect(() => {
    async function fetchInitialData() {
      // Only run on initial load if no filters are set
      if (!searchQuery && !selectedRegion && !selectedLocation) {
        setIsLoading(true);
        
        try {
          // Default filters for Jakarta Selatan
          const defaultFilters = {
            provinsi: 'DKI Jakarta',
            daerahTingkat: 'Kota',
            kotaKab: 'Jakarta Selatan',
            limit: 1000
          };
          
          if (filterYear) {
            defaultFilters.year = parseInt(filterYear);
          }
          
          // Fetch data using the API service
          const data = await getFilteredPackages(defaultFilters);
          
          // Store all fetched data
          setAllData(data);
        } catch (err) {
          console.error('Error fetching initial data:', err);
          setError(err.message);
          // Use fallback data if API fails
          setAllData(getJakartaSelatanFallbackData());
        } finally {
          setIsLoading(false);
        }
      }
    }
    
    fetchInitialData();
  }, []); // Only run once on component mount
  
  // Fetch data based on user-selected filters
  useEffect(() => {
    async function fetchAllData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Prepare filter parameters for API call
        // Note: We're not using skip/limit anymore since we want ALL data
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
        
        // If no specific region/location is selected and we have data, keep using initial Jakarta Selatan data
        if (!searchQuery && !selectedRegion && !selectedLocation && allData.length > 0) {
          return; // Keep existing data
        }
        
        // Set a higher limit to fetch more data at once (adjust as needed)
        filters.limit = 1000; 
        
        // Fetch data using the API service
        const data = await getFilteredPackages(filters);
        
        // Store all fetched data
        setAllData(data);
        
        // Reset to first page when filters change
        setCurrentPage(1);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        
        if (searchQuery || selectedRegion || selectedLocation) {
          // Use sample data as fallback for user-selected filters
          setAllData([
            { 
              paket: 'Pengadaan NIA', 
              satuan_kerja: 'Dinas KOM', 
              metode: 'E-Purchasing',
              pemilihan: 'April 2025',
              jenis_pengadaan: 'Barang'
            },
            { 
              paket: 'Kampanye Kesehatan', 
              satuan_kerja: 'Dinas Pnchrlnn', 
              metode: 'E-Purchasing',
              pemilihan: 'Mei 2025',
              jenis_pengadaan: 'Jasa'
            },
            { 
              paket: 'WhatsApp Bisnis', 
              satuan_kerja: 'Tender', 
              metode: 'Tender',
              pemilihan: 'Juni 2025',
              jenis_pengadaan: 'Konsultansi'
            }
          ]);
        } else {
          // Use Jakarta Selatan fallback data for initial view
          setAllData(getJakartaSelatanFallbackData());
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    // Only fetch new data if we have user-initiated filter changes
    if (searchQuery || selectedRegion || selectedLocation || (filterYear && allData.length === 0)) {
      fetchAllData();
    }
  }, [searchQuery, filterYear, selectedRegion, selectedLocation, allData.length]);
  
  // Helper function to determine status
  function determineStatus(item) {
    // Logic to determine status based on the data
    // This is a placeholder - adjust according to your actual data structure
    const currentDate = new Date();
    const itemDate = item.pemilihan_datetime ? new Date(item.pemilihan_datetime) : null;
    
    if (!itemDate) return 'Sesuai';
    
    if (itemDate < currentDate) return 'Hrge Esak Btorch';
    if (item.is_pdn === false) return 'Dibth Flnxnnm';
    return 'Sesuai';
  }
  
  // Function to get Jakarta Selatan fallback data
  function getJakartaSelatanFallbackData() {
    return [
      { 
        paket: 'Pengadaan WhatsApp Business API untuk UMKM Jakarta Selatan', 
        satuan_kerja: 'Dinas KUMKM Jakarta Selatan', 
        metode: 'E-Purchasing',
        pemilihan: 'Mei 2025',
        jenis_pengadaan: 'Jasa',
        lokasi: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        paket: 'Workshop Pelatihan Penggunaan WhatsApp Business', 
        satuan_kerja: 'Bidang Ekonomi Digital', 
        metode: 'Tender',
        pemilihan: 'Juni 2025',
        jenis_pengadaan: 'Jasa Konsultansi',
        lokasi: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        paket: 'Pembuatan Konten Digital WhatsApp Marketing', 
        satuan_kerja: 'Dinas Kominfo Jakarta Selatan', 
        metode: 'Pengadaan Langsung',
        pemilihan: 'April 2025',
        jenis_pengadaan: 'Jasa Lainnya',
        lokasi: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        paket: 'Pengembangan Chatbot WhatsApp untuk Layanan Publik', 
        satuan_kerja: 'Dinas Kominfo Jakarta Selatan', 
        metode: 'Tender',
        pemilihan: 'Juli 2025',
        jenis_pengadaan: 'Jasa',
        lokasi: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        paket: 'Sistem Notifikasi WhatsApp untuk Pelayanan Kesehatan', 
        satuan_kerja: 'Dinas Kesehatan Jakarta Selatan', 
        metode: 'E-Purchasing',
        pemilihan: 'Mei 2025',
        jenis_pengadaan: 'Jasa',
        lokasi: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        paket: 'Implementasi WhatsApp API untuk Pusat Pelayanan Terpadu', 
        satuan_kerja: 'Kantor Walikota Jakarta Selatan', 
        metode: 'Seleksi Langsung',
        pemilihan: 'Juni 2025',
        jenis_pengadaan: 'Jasa Konsultansi',
        lokasi: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        paket: 'Sewa Perangkat untuk Pengelolaan WhatsApp Business',
        satuan_kerja: 'Dinas KUMKM Jakarta Selatan', 
        metode: 'E-Purchasing',
        pemilihan: 'April 2025',
        jenis_pengadaan: 'Barang',
        lokasi: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        paket: 'Integrasi WhatsApp ke Sistem Informasi Kecamatan',
        satuan_kerja: 'Kecamatan Pancoran', 
        metode: 'Pengadaan Langsung',
        pemilihan: 'Mei 2025',
        jenis_pengadaan: 'Jasa',
        lokasi: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        paket: 'Perawatan Sistem WhatsApp Business Tahunan', 
        satuan_kerja: 'Dinas Kominfo Jakarta Selatan', 
        metode: 'Pengadaan Langsung',
        pemilihan: 'Juni 2025',
        jenis_pengadaan: 'Jasa',
        lokasi: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        paket: 'Pengadaan Server untuk WhatsApp Business API', 
        satuan_kerja: 'Dinas Kominfo Jakarta Selatan', 
        metode: 'Tender',
        pemilihan: 'Juli 2025',
        jenis_pengadaan: 'Barang',
        lokasi: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        paket: 'Pelatihan Admin WhatsApp Business', 
        satuan_kerja: 'Dinas KUMKM Jakarta Selatan', 
        metode: 'Pengadaan Langsung',
        pemilihan: 'Mei 2025',
        jenis_pengadaan: 'Jasa Konsultansi',
        lokasi: 'Kota Jakarta Selatan, DKI Jakarta'
      },
      { 
        paket: 'Pembuatan Materi Pelatihan WhatsApp Marketing', 
        satuan_kerja: 'Bidang Ekonomi Digital', 
        metode: 'Pengadaan Langsung',
        pemilihan: 'April 2025',
        jenis_pengadaan: 'Jasa Lainnya',
        lokasi: 'Kota Jakarta Selatan, DKI Jakarta'
      }
    ];
  }

  // Handle pagination
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Determine the page title based on filters
  const pageTitle = selectedLocation?.name || 
    (selectedRegion?.id !== 'all' ? selectedRegion?.name : 
    (!searchQuery && !selectedRegion && !selectedLocation ? 'Kota Jakarta Selatan' : 'Sesuai'));
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">
        Paket Pekerjaan {pageTitle}
      </h2>
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-500">Memuat data...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <p>Terjadi kesalahan: {error}</p>
          <p className="mt-2 text-sm">Menampilkan data contoh.</p>
        </div>
      ) : (
        <>
          <PaketTable data={tableData} />
          
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
                disabled={currentPage === totalPages || totalPages === 0}
                className={`p-2 rounded-md ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
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