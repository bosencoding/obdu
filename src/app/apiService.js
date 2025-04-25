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
 * Build query parameters from a filters object
 * @param {Object} filters - Filter criteria
 * @returns {URLSearchParams} - URL search parameters
 */
function buildQueryParams(filters = {}) {
  const params = new URLSearchParams();
  
  // Only add parameters that are defined
  if (filters.searchQuery) params.append('search', filters.searchQuery);
  if (filters.year) params.append('year', filters.year);
  if (filters.regionId) params.append('region_id', filters.regionId);
  if (filters.provinsi) params.append('provinsi', filters.provinsi);
  if (filters.daerahTingkat) params.append('daerah_tingkat', filters.daerahTingkat);
  if (filters.kotaKab) params.append('kota_kab', filters.kotaKab);
  if (filters.minPagu !== undefined && filters.minPagu !== null) params.append('min_pagu', filters.minPagu);
  if (filters.maxPagu !== undefined && filters.maxPagu !== null) params.append('max_pagu', filters.maxPagu);
  if (filters.metode) params.append('metode', filters.metode);
  if (filters.jenisPengadaan) params.append('jenis_pengadaan', filters.jenisPengadaan);
  
  // Pagination parameters
  if (filters.skip !== undefined) params.append('skip', filters.skip);
  if (filters.limit !== undefined) params.append('limit', filters.limit);
  if (filters.page !== undefined && filters.limit !== undefined) {
    params.append('skip', (filters.page - 1) * filters.limit);
  }
  
  return params;
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

/**
 * Get data for the table based on filters
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} - Filtered data for the table
 */
export async function getFilteredPackages(filters = {}) {
  const params = buildQueryParams(filters);
  return apiRequest(`/paket/filter?${params.toString()}`);
}

/**
 * Get list of wilayah (province and region combinations)
 * @returns {Promise<Array>} - List of wilayah with counts
 */
export async function getWilayahList() {
  return apiRequest('/wilayah/');
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
  handleApiError
};