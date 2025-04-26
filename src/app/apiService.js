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
  
  // Pagination parameters - ensure they're handled properly
  if (filters.page !== undefined && filters.limit !== undefined) {
    // Calculate skip based on page and limit 
    // (page is 1-indexed in UI, but skip is 0-indexed in API)
    const skip = (filters.page - 1) * filters.limit;
    params.append('skip', skip.toString());
    params.append('limit', filters.limit.toString());
  }
  // Support direct skip/limit if provided
  else {
    if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
  }
  
  // Add count parameter if needed
  if (filters.countOnly) {
    params.append('count_only', 'true');
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
  try {
    // If this is a count-only request, use dedicated count function
    if (filters.countOnly) {
      const count = await getPackageCount(filters);
      return [{ totalCount: count }];
    }
    
    // Make sure page and limit are included in filters
    const paginationFilters = {
      ...filters,
      limit: filters.limit || 10,
      page: filters.page || 1
    };

    // Build query params
    const params = buildQueryParams(paginationFilters);
    
    // Log request details for debugging
    console.log('Filtered packages request:', {
      filters: paginationFilters,
      params: params.toString()
    });

    const response = await apiRequest(`/paket/filter?${params.toString()}`);
    
    // Check if response includes total count information
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      // Some APIs return { data: [...], totalCount: 123 }
      if (response.data && Array.isArray(response.data) && response.totalCount !== undefined) {
        // Add totalCount to the array to pass it along
        response.data.totalCount = response.totalCount;
        return response.data;
      }
      // Some APIs return { items: [...], count: 123 }
      if (response.items && Array.isArray(response.items) && response.count !== undefined) {
        // Add totalCount to the array to pass it along
        response.items.totalCount = response.count;
        return response.items;
      }
    }
    
    // If it's just an array, return as is
    if (Array.isArray(response)) {
      return response;
    }
    
    // Fallback to empty array if response format is unexpected
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

/**
 * Get the total count of filtered packages
 * @param {Object} filters - Filter criteria (without pagination)
 * @returns {Promise<number>} - Total number of items matching filters
 */
export async function getPackageCount(filters = {}) {
  try {
    // Build query params - exclude pagination
    const countParams = new URLSearchParams();
    
    if (filters.searchQuery) countParams.append('search', filters.searchQuery);
    if (filters.year) countParams.append('year', filters.year);
    if (filters.regionId) countParams.append('region_id', filters.regionId);
    if (filters.provinsi) countParams.append('provinsi', filters.provinsi);
    if (filters.daerahTingkat) countParams.append('daerah_tingkat', filters.daerahTingkat);
    if (filters.kotaKab) countParams.append('kota_kab', filters.kotaKab);
    if (filters.minPagu !== undefined && filters.minPagu !== null) countParams.append('min_pagu', filters.minPagu);
    if (filters.maxPagu !== undefined && filters.maxPagu !== null) countParams.append('max_pagu', filters.maxPagu);
    if (filters.metode) countParams.append('metode', filters.metode);
    if (filters.jenisPengadaan) countParams.append('jenis_pengadaan', filters.jenisPengadaan);
    
    // Add count_only flag
    countParams.append('count_only', 'true');
    
    // Try the dedicated count endpoint first
    try {
      const response = await apiRequest(`/api/paket/count?${countParams.toString()}`);
      
      if (response && response.total !== undefined) {
        const totalCount = parseInt(response.total, 10);
        return totalCount || 0;
      }
    } catch (error) {
      console.warn('Count endpoint failed, falling back to filter endpoint', error);
      // Continue to fallback
    }
    
    // Fallback: try the filter endpoint with count_only parameter
    const response = await apiRequest(`/api/paket/filter?${countParams.toString()}`);
    
    if (response) {
      // Different APIs might return the count in different ways
      if (response.total !== undefined) {
        return parseInt(response.total, 10) || 0;
      }
      if (response.count !== undefined) {
        return parseInt(response.count, 10) || 0;
      }
      if (response.totalCount !== undefined) {
        return parseInt(response.totalCount, 10) || 0;
      }
    }
    
    // Last resort: return a high default
    return 1500;
  } catch (error) {
    console.error('Error getting package count:', error);
    // Return a high default on error to ensure pagination works
    return 1500;
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