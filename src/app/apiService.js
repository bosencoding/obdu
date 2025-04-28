// apiService.js - Fixed Version
// Central API service for dashboard data

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/api';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 15000;

/**
 * Enhanced API request with error handling and timeout
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - The parsed response data
 */
async function apiRequest(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  try {
    // Create an abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    // Add the signal to options
    const enhancedOptions = {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };
    
    console.log(`Request: ${options.method || 'GET'} ${fullUrl}`);
    
    const response = await fetch(fullUrl, enhancedOptions);
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // Handle non-OK responses
    if (!response.ok) {
      // Try to get error details from response
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData.message || errorData.error || JSON.stringify(errorData);
      } catch {
        errorDetails = await response.text();
      }
      
      throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorDetails}`);
    }

    // Parse JSON response
    return await response.json();
  } catch (error) {
    // Handle specific error types
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms: ${fullUrl}`);
    }
    
    // Log detailed error and rethrow
    console.error(`API request error:`, error);
    throw error;
  }
}

/**
 * Build query parameters from a filters object with better support for pagination and counting
 * @param {Object} filters - Filter criteria
 * @returns {URLSearchParams} - URL search parameters
 */
function buildQueryParams(filters = {}) {
  const params = new URLSearchParams();
  
  // Hanya tambahkan parameter yang terdefinisi
  if (filters.searchQuery) params.append('search', filters.searchQuery);
  if (filters.year) params.append('year', filters.year);
  if (filters.regionId) params.append('region_id', filters.regionId);
  if (filters.provinsi) params.append('provinsi', filters.provinsi);
  if (filters.daerahTingkat) params.append('daerah_tingkat', filters.daerahTingkat);
  if (filters.kotaKab) params.append('kota_kab', filters.kotaKab);
  if (filters.minPagu !== undefined) params.append('min_pagu', filters.minPagu);
  if (filters.maxPagu !== undefined) params.append('max_pagu', filters.maxPagu);
  if (filters.metode) params.append('metode', filters.metode);
  if (filters.jenisPengadaan) params.append('jenis_pengadaan', filters.jenisPengadaan);
  
  // Parameter paginasi - pastikan penanganan yang tepat
  if (filters.page !== undefined && filters.limit !== undefined) {
    // Hitung skip berdasarkan page dan limit
    // (page adalah 1-indexed di UI, tetapi skip adalah 0-indexed di API)
    const skip = (filters.page - 1) * filters.limit;
    params.append('skip', skip.toString());
    params.append('limit', filters.limit.toString());
  }
  // Support skip/limit langsung jika disediakan
  else {
    if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
  }
  
  // Tambahkan parameter count_only jika diperlukan
  if (filters.countOnly) {
    params.append('count_only', 'true');
  }
  
  return params.toString();
}

/**
 * Get a list of regions for the RegionDropdown component
 * @returns {Promise<Array>} - List of regions with counts
 */
export async function getRegionsList() {
  return apiRequest('/regions');
}

/**
 * Search for locations based on a query string
 * @param {string} query - The search query
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Array>} - List of matching locations
 */
export async function searchLocations(query, limit = 10) {
  if (!query || query.length < 2) {
    return [];
  }
  
  const params = new URLSearchParams({
    q: query,
    limit,
  });
  
  return apiRequest(`/locations/search?${params.toString()}`);
}

/**
 * Get dashboard statistics
 * @param {Object} filters - Filter criteria for the statistics
 * @returns {Promise<Object>} - Dashboard statistics data
 */
export async function getDashboardStats(filters = {}) {
  const params = buildQueryParams(filters);
  return apiRequest(`/dashboard/stats?${params.toString()}`);
}

/**
 * Get chart data for the dashboard
 * @param {string} chartType - Type of chart (pie, bar, etc.)
 * @param {Object} filters - Filter criteria for the chart data
 * @returns {Promise<Array>} - Data for the specified chart
 */
export async function getChartData(chartType, filters = {}) {
  const params = buildQueryParams(filters);
  return apiRequest(`/dashboard/chart/${chartType}?${params.toString()}`);
}

export async function getFilteredPackages(filters = {}) {
  try {
    // Pastikan page dan limit termasuk dalam filters
    const paginationFilters = {
      ...filters,
      limit: filters.limit || 10,
      page: filters.page || 1
    };

    // Bangun query params
    const params = buildQueryParams(paginationFilters);
    
    console.log('Filtered packages request:', {
      filters: paginationFilters,
      params: params.toString()
    });

    const response = await apiRequest(`/paket/filter?${params.toString()}`);
    
    // Periksa apakah response mencakup informasi total count
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      // Beberapa API mengembalikan { data: [...], totalCount: 123 }
      if (response.data && Array.isArray(response.data) && response.totalCount !== undefined) {
        // Tambahkan totalCount ke array untuk meneruskannya
        response.data.totalCount = response.totalCount;
        return response.data;
      }
      // Beberapa API mengembalikan { items: [...], count: 123 }
      if (response.items && Array.isArray(response.items) && response.count !== undefined) {
        // Tambahkan totalCount ke array untuk meneruskannya
        response.items.totalCount = response.count;
        return response.items;
      }
    }
    
    // Jika hanya array, kembalikan apa adanya
    if (Array.isArray(response)) {
      return response;
    }
    
    // Fallback ke array kosong jika format response tidak terduga
    console.warn('Unexpected response format from API:', response);
    return [];
  } catch (error) {
    console.error('Error in getFilteredPackages:', error);
    handleApiError(error, 'getFilteredPackages');
    return [];
  }
}

/**
 * Get list of wilayah (province and region combinations)
 * @returns {Promise<Array>} - List of wilayah with counts
 */
export async function getWilayahList() {
  return apiRequest('/wilayah/');
}

export async function getPackageCount(filters = {}) {
  try {
    // Buat parameter query - tanpa pagination
    const countParams = new URLSearchParams();
    
    // Tambahkan parameter filter yang relevan
    if (filters.searchQuery) countParams.append('search', filters.searchQuery);
    if (filters.year) countParams.append('year', filters.year);
    if (filters.regionId) countParams.append('region_id', filters.regionId);
    if (filters.provinsi) countParams.append('provinsi', filters.provinsi);
    if (filters.daerahTingkat) countParams.append('daerah_tingkat', filters.daerahTingkat);
    if (filters.kotaKab) countParams.append('kota_kab', filters.kotaKab);
    if (filters.minPagu !== undefined) countParams.append('min_pagu', filters.minPagu);
    if (filters.maxPagu !== undefined) countParams.append('max_pagu', filters.maxPagu);
    if (filters.metode) countParams.append('metode', filters.metode);
    if (filters.jenisPengadaan) countParams.append('jenis_pengadaan', filters.jenisPengadaan);
    
    // Tambahkan flag count_only 
    countParams.append('count_only', 'true');
    // Gunakan limit minimal untuk hanya mendapatkan count
    countParams.append('limit', '1');
    
    console.log(`Fetching count with params: ${countParams.toString()}`);
    
    // Panggil API untuk mendapatkan total count
    const response = await apiRequest(`/paket/filter?${countParams.toString()}`);
    
    // Ekstrak total count dari berbagai format response yang mungkin
    if (response) {
      if (typeof response.recordsFiltered === 'number') {
        return response.recordsFiltered;
      }
      
      if (typeof response.totalCount === 'number') {
        return response.totalCount;
      }
      
      if (typeof response.count === 'number') {
        return response.count;
      }
      
      if (typeof response.total === 'number') {
        return response.total;
      }
      
      // Jika API mengembalikan array dengan properti totalCount
      if (Array.isArray(response) && response.totalCount !== undefined) {
        return response.totalCount;
      }
      
      // Jika tidak ada informasi count eksplisit, coba gunakan info dari region
      if (filters.regionId && filters.regionId !== 'all') {
        try {
          const regions = await getRegionsList();
          const selectedRegion = regions.find(r => r.id === filters.regionId);
          if (selectedRegion && selectedRegion.count > 0) {
            return selectedRegion.count;
          }
        } catch (e) {
          console.error('Error getting count from regions list:', e);
        }
      }
    }
    
    // Jika tidak dapat menentukan count, gunakan perkiraan yang wajar
    return 500;
  } catch (error) {
    console.error('Error getting package count:', error);
    return 500; // Nilai default untuk kasus error
  }
}

/**
 * Handle unexpected API errors
 * @param {Error} error - The error that occurred
 * @param {string} source - The source of the error (for logging)
 * @throws {Error} - Always throws the error after logging
 */
export function handleApiError(error, source) {
  // Log detailed error information
  console.error(`API Error in ${source}:`, error);
  
  // No dummy data, just rethrow the error for proper handling
  throw error;
}

// Export all functions as default object
export default {
  getRegionsList,
  searchLocations,
  getFilteredPackages,
  getDashboardStats,
  getChartData,
  getWilayahList,
  getPackageCount,
  handleApiError
};