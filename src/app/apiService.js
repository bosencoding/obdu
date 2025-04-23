// apiService.js
// This file contains all API-related functions for the application

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Base API request handler with error handling
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - The parsed response data
 */
async function apiRequest(url, options = {}) {
  try {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    console.log(`Making API request to: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP error! Status: ${response.status}`,
      }));
      
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${error.message}`);
    throw error;
  }
}

/**
 * Get a list of regions for the RegionDropdown component
 * @returns {Promise<Array>} - List of regions with counts
 */
export async function getRegionsList() {
  // Make sure the endpoint path matches what's defined in your FastAPI app
  return apiRequest('/api/regions');
}

/**
 * Search for locations based on a query string
 * @param {string} query - The search query
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Array>} - List of matching locations
 */
export async function searchLocations(query, limit = 10) {
  const params = new URLSearchParams({
    q: query,
    limit,
  });
  
  return apiRequest(`/api/locations/search?${params.toString()}`);
}

/**
 * Get data for the table based on filters
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} - Filtered data for the table
 */
export async function getFilteredPackages(filters = {}) {
    const {
      search,
      year,
      regionId,
      provinsi,
      daerahTingkat,
      kotaKab,
      minPagu,
      maxPagu,
      metode,
      jenisPengadaan,
      skip = 0,
      limit = 10, // Default to 10 items per page
    } = filters;
    
    const params = new URLSearchParams();
    
    if (search) params.append('search', search);
    if (year) params.append('year', year);
    if (regionId) params.append('region_id', regionId);
    if (provinsi) params.append('provinsi', provinsi);
    if (daerahTingkat) params.append('daerah_tingkat', daerahTingkat);
    if (kotaKab) params.append('kota_kab', kotaKab);
    if (minPagu !== undefined) params.append('min_pagu', minPagu);
    if (maxPagu !== undefined) params.append('max_pagu', maxPagu);
    if (metode) params.append('metode', metode);
    if (jenisPengadaan) params.append('jenis_pengadaan', jenisPengadaan);
    
    // Always include pagination parameters to ensure consistent API calls
    params.append('skip', skip);
    params.append('limit', limit);
    
    try {
      // Attempt to get data from API
      return await apiRequest(`/api/paket/filter?${params.toString()}`);
    } catch (error) {
      console.error("Error fetching filtered packages:", error);
      
      // If API fails, return mock data based on page
      const pageNumber = Math.floor(skip / limit) + 1;
      const mockDataSize = Math.min(limit, 10); // Generate up to 10 mock items
      
      // Generate mock data with different values for different pages
      const mockData = Array.from({ length: mockDataSize }, (_, index) => {
        const itemNumber = skip + index + 1;
        return {
          id: itemNumber,
          paket: `Paket ${itemNumber}: ${search || 'Whatsapp'} ${pageNumber}`,
          pagu: 1000000 * itemNumber,
          satuan_kerja: `Dinas Kominfo Page ${pageNumber}`,
          is_pdn: itemNumber % 2 === 0,
          is_umk: itemNumber % 3 === 0,
          metode: itemNumber % 4 === 0 ? 'Tender' : 'E-Purchasing',
          jenis_pengadaan: itemNumber % 3 === 0 ? 'Barang' : 'Jasa',
          pemilihan: `April ${year || '2025'}`,
          pemilihan_datetime: new Date(),
          lokasi: `Kota Sample ${pageNumber}, Provinsi Demo`,
          provinsi: 'Provinsi Demo',
          daerah_tingkat: 'Kota',
          kota_kab: `Sample ${pageNumber}`
        };
      });
      
      return mockData;
    }
  }
/**
 * Get dashboard statistics
 * @param {Object} filters - Filter criteria for the statistics
 * @returns {Promise<Object>} - Dashboard statistics data
 */
export async function getDashboardStats(filters = {}) {
  const {
    year,
    regionId,
    provinsi,
    daerahTingkat,
    kotaKab,
  } = filters;
  
  const params = new URLSearchParams();
  
  if (year) params.append('year', year);
  if (regionId) params.append('region_id', regionId);
  if (provinsi) params.append('provinsi', provinsi);
  if (daerahTingkat) params.append('daerah_tingkat', daerahTingkat);
  if (kotaKab) params.append('kota_kab', kotaKab);
  
  try {
    return await apiRequest(`/api/dashboard/stats?${params.toString()}`);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    // Return default data if API call fails
    return {
      totalAnggaran: 'Rp 5,240,000,000',
      totalPaket: 42,
      tender: 15,
      dikecualikan: 7,
      epkem: 12,
      pengadaanLangsung: 8
    };
  }
}

/**
 * Get chart data for the dashboard
 * @param {string} chartType - Type of chart (pie, bar, etc.)
 * @param {Object} filters - Filter criteria for the chart data
 * @returns {Promise<Array>} - Data for the specified chart
 */
export async function getChartData(chartType, filters = {}) {
  const {
    year,
    regionId,
    provinsi,
    daerahTingkat,
    kotaKab,
  } = filters;
  
  const params = new URLSearchParams();
  
  if (year) params.append('year', year);
  if (regionId) params.append('region_id', regionId);
  if (provinsi) params.append('provinsi', provinsi);
  if (daerahTingkat) params.append('daerah_tingkat', daerahTingkat);
  if (kotaKab) params.append('kota_kab', kotaKab);
  
  try {
    return await apiRequest(`/api/dashboard/chart/${chartType}?${params.toString()}`);
  } catch (error) {
    console.error(`Error fetching ${chartType} chart data:`, error);
    // Return default data based on chart type
    if (chartType === 'pie') {
      return [
        { name: 'Event Budaya', value: 46.1 },
        { name: 'Kesehatan', value: 28.4 },
        { name: 'WhatsApp Bisnis', value: 15.2 },
        { name: 'Event Seni', value: 10.3 }
      ];
    } else if (chartType === 'bar') {
      return [
        { name: 'Event Budaya', value: 30 },
        { name: 'Kampanye Kesehatan', value: 24 },
        { name: 'WhatsApp Bisnis', value: 18 },
        { name: 'Event Seni Bisnis', value: 15 },
        { name: 'Event Budaya 2', value: 12 },
        { name: 'WhatsApp Bisnis 2', value: 8 },
        { name: 'Lainnya', value: 5 }
      ];
    }
    return [];
  }
}

/**
 * Get list of wilayah (province and region combinations)
 * @returns {Promise<Array>} - List of wilayah with counts
 */
export async function getWilayahList() {
  return apiRequest('/api/wilayah/');
}

// Export all functions
export default {
  getRegionsList,
  searchLocations,
  getFilteredPackages,
  getDashboardStats,
  getChartData,
  getWilayahList,
};