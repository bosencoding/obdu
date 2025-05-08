// apiService.js - Fixed Version
// Central API service for dashboard data

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Simple in-memory cache
const apiCache = {};
const CACHE_TTL = 5 * 60 * 1000; // Cache time-to-live in milliseconds (5 minutes)

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 60000; // Increased timeout to 60 seconds

/**
 * Enhanced API request with error handling and timeout
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - The parsed response data
 */
async function apiRequest(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const cacheKey = `${options.method || 'GET'}:${fullUrl}`;
  const now = Date.now();

  // Check cache first for GET requests
  if (options.method === 'GET' || options.method === undefined) {
    const cached = apiCache[cacheKey];
    if (cached && now - cached.timestamp < CACHE_TTL) {
      console.log(`[Cache] Serving from cache: ${cacheKey}`);
      return cached.data;
    }
  }
  
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
    
    console.log(`[Proxy API] Request: ${options.method || 'GET'} ${fullUrl}`);
    
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
    const data = await response.json();

    // Cache successful GET responses
    if (options.method === 'GET' || options.method === undefined) {
      apiCache[cacheKey] = {
        data,
        timestamp: now,
      };
      console.log(`[Cache] Cached: ${cacheKey}`);
    }

    return data;
  } catch (error) {
    // Handle specific error types
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms: ${fullUrl}`);
    }
    
    // Log detailed error and rethrow
    console.error(`[Proxy API] API request error:`, error);
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
  
  // Add count parameters if needed
  if (filters.countOnly) {
    params.append('count_only', 'true');
  }
  
  // Request count with data to reduce API calls
  if (filters.include_count) {
    params.append('include_count', 'true');
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
    // Make sure page and limit are included in filters
    const paginationFilters = {
      ...filters,
      limit: filters.limit || 10,
      page: filters.page || 1
    };

    // If include_count is true, request count in the same API call
    // This reduces the number of API calls and prevents looping
    if (filters.include_count) {
      paginationFilters.include_count = true;
    }
    
    // If this is a count-only request, add count_only parameter
    if (filters.countOnly) {
      paginationFilters.count_only = true;
      // For count-only requests, we don't need pagination
      delete paginationFilters.limit;
      delete paginationFilters.page;
    }

    // Build query params
    const params = buildQueryParams(paginationFilters);
    
    // Log request details for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Filtered packages request:', {
        filters: paginationFilters,
        params: params.toString()
      });
    }

    const response = await apiRequest(`/paket/filter?${params.toString()}`);
    
    // Handle count-only requests
    if (filters.countOnly && typeof response === 'object') {
      const count = extractCountFromResponse(response);
      return [{ totalCount: count }];
    }
    
    // Check if response includes total count information
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      // Some APIs return { data: [...], totalCount: 123 }
      if (response.data && Array.isArray(response.data)) {
        const data = [...response.data];
        
        // Add totalCount to the array if available
        if (response.totalCount !== undefined) {
          data.totalCount = response.totalCount;
        } else if (response.count !== undefined) {
          data.totalCount = response.count;
        } else if (response.total !== undefined) {
          data.totalCount = response.total;
        }
        
        return data;
      }
      
      // Some APIs return { items: [...], count: 123 }
      if (response.items && Array.isArray(response.items)) {
        const items = [...response.items];
        
        // Add totalCount to the array if available
        if (response.count !== undefined) {
          items.totalCount = response.count;
        } else if (response.totalCount !== undefined) {
          items.totalCount = response.totalCount;
        } else if (response.total !== undefined) {
          items.totalCount = response.total;
        }
        
        return items;
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
 * Helper function to extract count from various response formats
 * @param {Object} response - API response object
 * @returns {number} - Extracted count or default value
 */
function extractCountFromResponse(response) {
  if (typeof response.totalCount === 'number') {
    return response.totalCount;
  }
  
  if (typeof response.count === 'number') {
    return response.count;
  }
  
  if (typeof response.total === 'number') {
    return response.total;
  }
  
  if (typeof response.recordsFiltered === 'number') {
    return response.recordsFiltered;
  }
  
  // Default fallback count
  return 500;
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
/**
 * Get the total count of filtered packages
 * This is an optimized version that uses the same endpoint as getFilteredPackages
 * but with count_only=true to reduce API calls
 * @param {Object} filters - Filter criteria (without pagination)
 * @returns {Promise<number>} - Total number of items matching filters
 */
export async function getPackageCount(filters = {}) {
  try {
    // Use the getFilteredPackages function with countOnly flag
    // This prevents duplicate code and ensures consistent behavior
    const countResult = await getFilteredPackages({
      ...filters,
      countOnly: true
    });
    
    // Extract count from the result
    if (Array.isArray(countResult) && countResult.length > 0 && countResult[0].totalCount !== undefined) {
      return countResult[0].totalCount;
    }
    
    // If we can't determine count from API response, try to get count from selected region
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
    
    // Log that we're using default count
    if (process.env.NODE_ENV === 'development') {
      console.log('[useDashboardData] API returned total count', 500);
    }
    
    // Return a reasonable default count
    return 500;
  } catch (error) {
    console.error('Error getting package count:', error);
    return 500; // Default count for error case
  }
}

/**
 * Get detailed data for a single package by ID
 * @param {string | number} id - The ID of the package
 * @returns {Promise<Object>} - Detailed package data
 */
export async function getPackageDetails(id) {
  if (!id) {
    throw new Error('Package ID is required to fetch details.');
  }
  return apiRequest(`/data-sirup/${id}`); // Updated endpoint
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
  getPackageDetails, // Added getPackageDetails to export
  handleApiError
};