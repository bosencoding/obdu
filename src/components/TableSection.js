"use client"

import { useState, useEffect } from 'react';
import PaketTable from './PaketTable';
import { getFilteredPackages, getMockData } from '@/app/apiService';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TableSection({ 
  searchQuery, 
  filterYear,
  selectedRegion,
  selectedLocation
}) {
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10; // Number of items per page
  
  // Fetch data based on filters and pagination
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Prepare filter parameters for API call
        const filters = {
          skip: (currentPage - 1) * itemsPerPage,
          limit: itemsPerPage
        };
        
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
        
        // Fetch data using the API service
        const data = await getFilteredPackages(filters);
        
        // TODO: In a real implementation, the API should return total count for pagination
        // For now, we'll set a fixed total or estimate from the data we have
        setTotalItems(data.length > 0 ? data.length + (currentPage - 1) * itemsPerPage : 0);
        setTotalPages(Math.ceil(totalItems / itemsPerPage) || 1);
        
        // Format data for the table
        const formattedData = data.map((item, index) => ({
          no: (currentPage - 1) * itemsPerPage + index + 1,
          nama: item.paket,
          satuan: item.satuan_kerja,
          krema: item.metode,
          jadwal: item.pemilihan || 'Belum ditentukan',
          status: determineStatus(item),
          keterangan: item.jenis_pengadaan || 'dil.'
        }));
        
        setTableData(formattedData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        
        // Use sample data as fallback
        const sampleData = [
          { 
            no: (currentPage - 1) * itemsPerPage + 1, 
            nama: 'Pengadaan NIA', 
            satuan: 'Dinas KOM', 
            krema: 'E-Purchasing',
            jadwal: 'April 2025',
            status: 'Sesuai',
            keterangan: 'dil.'
          },
          { 
            no: (currentPage - 1) * itemsPerPage + 2, 
            nama: 'Kampanye Kesehatan', 
            satuan: 'Dinas Pnchrlnn', 
            krema: 'E-Purchasing',
            jadwal: 'Mei 2025',
            status: 'Dibth Flnxnnm',
            keterangan: 'dil.'
          },
          { 
            no: (currentPage - 1) * itemsPerPage + 3, 
            nama: 'WhatsApp Bisnis', 
            satuan: 'Tender', 
            krema: 'Tender',
            jadwal: 'Juni 2025',
            status: 'Hrge Esak Btorch',
            keterangan: 'dil.'
          }
        ];
        
        setTableData(sampleData);
        setTotalItems(30); // Arbitrary number for example
        setTotalPages(Math.ceil(30 / itemsPerPage));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [searchQuery, filterYear, selectedRegion, selectedLocation, currentPage]);
  
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
  
  // Handle pagination
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">
        Paket Pekerjaan {selectedLocation?.name || (selectedRegion?.id !== 'all' ? selectedRegion?.name : 'Sesuai')}
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