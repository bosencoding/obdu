// src/app/directApiAdapter.js
// Adapter langsung ke backend API tanpa proxy
// Gunakan file ini sebagai fallback jika API proxy tidak berfungsi

// URL backend langsung
const BACKEND_API_URL = 'http://localhost:8000';

/**
 * Request API langsung tanpa melalui proxy
 * @param {string} endpoint - Endpoint API (tanpa leading slash)
 * @param {Object} options - Opsi fetch
 * @returns {Promise<any>} - Data dari response
 */
async function directApiRequest(endpoint, options = {}) {
  try {
    const url = `${BACKEND_API_URL}/${endpoint}`;
    console.log(`[Direct API] Request ke: ${url}`);
    
    // Tambahkan header default
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };
    
    // Buat request
    const response = await fetch(url, {
      ...options,
      headers,
      // Tambahkan mode cors untuk mengizinkan request cross-origin
      mode: 'cors'
    });
    
    // Jika response bukan 2xx
    if (!response.ok) {
      console.error(`[Direct API] Error ${response.status}: ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[Direct API] Error details: ${errorText}`);
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    
    // Parse dan kembalikan JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[Direct API] Request failed:`, error);
    throw error;
  }
}

// Fungsi untuk endpoints yang digunakan aplikasi
export async function getRegionsList() {
  return directApiRequest('regions');
}

export async function searchLocations(query, limit = 10) {
  if (!query || query.length < 2) {
    return [];
  }
  
  const params = new URLSearchParams({
    q: query,
    limit
  }).toString();
  
  return directApiRequest(`locations/search?${params}`);
}

export async function getDashboardStats(filters = {}) {
  const params = buildQueryParams(filters);
  return directApiRequest(`dashboard/stats?${params}`);
}

export async function getChartData(chartType, filters = {}) {
  const params = buildQueryParams(filters);
  return directApiRequest(`dashboard/chart/${chartType}?${params}`);
}

export async function getFilteredPackages(filters = {}) {
  const params = buildQueryParams(filters);
  return directApiRequest(`paket/filter?${params}`);
}

export async function getWilayahList() {
  return directApiRequest('wilayah/');
}

/**
 * Build query parameters from a filters object
 * @param {Object} filters - Filter criteria
 * @returns {string} - URL search parameters as string
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
  
  return params.toString();
}

export default {
  getRegionsList,
  searchLocations,
  getFilteredPackages,
  getDashboardStats,
  getChartData,
  getWilayahList
};