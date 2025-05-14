import { useCallback } from 'react';

/**
 * Calculate total items for pagination based on API response and current state.
 * @param {Array|Object} data - The data received from the API.
 * @param {number} page - The current page number (1-based).
 * @param {number} limit - The number of items per page.
 * @param {number} currentTotal - The current total items count from state.
 * @returns {number} - The calculated total number of items.
 */
export const calculateTotalItems = (data, page, limit, currentTotal) => {
  // If the API directly provides a total count
  // If the API directly provides a total count with the label 'total'
  if (data && typeof data === 'object' && data.total !== undefined) {
    return data.total;
  }
  // Also check for 'totalCount' for backward compatibility if needed, or remove if 'total' is the standard
  if (data && typeof data === 'object' && data.totalCount !== undefined) {
    return data.totalCount;
  }

  // Calculate based on the data we have
  if (!Array.isArray(data)) {
    return currentTotal || 0;
  }

  // Case 1: If this is the first page and we got fewer items than the limit,
  // then this is the exact total
  if (page === 1 && data.length < limit) {
    return data.length;
  }

  // Case 2: If we have a full page of data, we know there are at least
  // this many items (current page * limit), possibly more
  if (data.length >= limit) {
    // Ensure our total count is at least the items we've seen plus one more page
    return Math.max(currentTotal || 0, page * limit + 1);
  }

  // Case 3: If we have a partial page (not the first page), we can calculate exactly
  if (data.length < limit && page > 1) {
    return (page - 1) * limit + data.length;
  }

  // Default: Keep the current total if higher, or calculate based on what we know
  return Math.max(currentTotal || 0, page * limit);
};

/**
 * Format wilayah from item data.
 * @param {Object} item - The data item.
 * @returns {string} - Formatted wilayah string.
 */
export const formatWilayah = (item) => {
  if (item.lokasi) return item.lokasi;

  if (item.provinsi) {
    let result = '';
    if (item.daerah_tingkat) result += `${item.daerah_tingkat} `;
    if (item.kota_kab) result += item.kota_kab;
    if (result) result += `, ${item.provinsi}`;
    else result = item.provinsi;
    return result;
  }

  return '';
};

/**
 * Determine status based on item data.
 * @param {Object} item - The data item.
 * @returns {string} - Determined status string.
 */
export const determineStatus = (item) => {
  const currentDate = new Date();
  const itemDate = item.pemilihan_datetime ? new Date(item.pemilihan_datetime) : null;

  if (!itemDate) return 'Sesuai';

  if (itemDate < currentDate) return 'Hrge Esak Btorch'; // This seems like obfuscated text, keeping it as is
  if (item.is_pdn === false) return 'Dibth Flnxnnm'; // This seems like obfuscated text, keeping it as is
  return 'Sesuai';
};