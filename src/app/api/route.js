// app/api/[[...path]]/route.js
// Mock API implementation for development

import { NextResponse } from 'next/server';

// Mock data for development
const mockData = {
  // Mock regions data
  regions: [
    { id: 'all', name: 'Semua Wilayah', count: 500 },
    { id: 'region-jaksel', name: 'Kota Jakarta Selatan', provinsi: 'DKI Jakarta', type: 'Kota', count: 120 },
    { id: 'region-jakpus', name: 'Kota Jakarta Pusat', provinsi: 'DKI Jakarta', type: 'Kota', count: 85 },
    { id: 'region-jakbar', name: 'Kota Jakarta Barat', provinsi: 'DKI Jakarta', type: 'Kota', count: 95 },
    { id: 'region-jaktim', name: 'Kota Jakarta Timur', provinsi: 'DKI Jakarta', type: 'Kota', count: 110 },
    { id: 'region-jakut', name: 'Kota Jakarta Utara', provinsi: 'DKI Jakarta', type: 'Kota', count: 90 },
    { id: 'province-jabar', name: 'Jawa Barat', count: 250 },
    { id: 'province-jateng', name: 'Jawa Tengah', count: 200 },
    { id: 'province-jatim', name: 'Jawa Timur', count: 230 }
  ],
  
  // Mock dashboard stats
  dashboardStats: {
    totalAnggaran: "Rp 1.250.000.000.000",
    totalPaket: 500,
    tender: 150,
    dikecualikan: 100,
    epkem: 200,
    pengadaanLangsung: 50
  },
  
  // Mock chart data
  chartData: {
    pie: [
      { name: 'Tender', value: 150 },
      { name: 'Dikecualikan', value: 100 },
      { name: 'e-Purchasing', value: 200 },
      { name: 'Pengadaan Langsung', value: 50 }
    ],
    bar: [
      { name: 'Barang', value: 200 },
      { name: 'Jasa Konsultansi', value: 100 },
      { name: 'Jasa Lainnya', value: 120 },
      { name: 'Pekerjaan Konstruksi', value: 80 }
    ]
  },
  
  // Mock table data
  tableData: Array.from({ length: 50 }, (_, i) => ({
    id: `PKT-${2025}-${1000 + i}`,
    nama_paket: `Paket Pengadaan ${i + 1}`,
    pagu: Math.floor(Math.random() * 1000000000) + 10000000,
    metode: ['Tender', 'e-Purchasing', 'Pengadaan Langsung', 'Dikecualikan'][Math.floor(Math.random() * 4)],
    provinsi: 'DKI Jakarta',
    daerah_tingkat: 'Kota',
    kota_kab: 'Jakarta Selatan',
    tahun: 2025,
    status: ['Aktif', 'Selesai', 'Dibatalkan'][Math.floor(Math.random() * 3)]
  }))
};

// Basic logging
function logRequest(method, url, status, error = null) {
  console.log(`[Mock API] ${method} ${url} => ${status}${error ? ` (Error: ${error})` : ''}`);
}

/**
 * Handler untuk request GET
 */
export async function GET(request, { params }) {
  try {
    // URL path parts
    const url = new URL(request.url);
    const { pathname, search } = url;
    
    // Extract path parts after /api/
    let endpoint = '';
    if (params && params.path) {
      endpoint = params.path.join('/');
    } else {
      // Extract path from URL if params.path is not available
      const apiPrefix = '/api/';
      if (pathname.startsWith(apiPrefix)) {
        endpoint = pathname.substring(apiPrefix.length);
      }
    }
    
    // Parse query parameters
    const queryParams = Object.fromEntries(new URLSearchParams(search));
    
    // Log request
    console.log(`[Mock API] GET request for: ${endpoint}${search}`);
    
    // Handle different endpoints
    let responseData;
    
    if (endpoint === 'regions' || endpoint === 'regions/') {
      responseData = mockData.regions;
    }
    else if (endpoint === 'dashboard/stats') {
      responseData = mockData.dashboardStats;
    }
    else if (endpoint.startsWith('dashboard/chart/')) {
      const chartType = endpoint.split('/').pop();
      responseData = mockData.chartData[chartType] || [];
    }
    else if (endpoint === 'paket/filter') {
      // Handle pagination
      const page = parseInt(queryParams.page) || 1;
      const limit = parseInt(queryParams.limit) || 10;
      const skip = parseInt(queryParams.skip) || (page - 1) * limit;
      
      // Get a slice of the mock data
      const data = mockData.tableData.slice(skip, skip + limit);
      
      // Return with count if requested
      if (queryParams.include_count === 'true') {
        responseData = {
          data: data,
          totalCount: mockData.tableData.length
        };
      } else if (queryParams.count_only === 'true') {
        responseData = { totalCount: mockData.tableData.length };
      } else {
        responseData = data;
      }
    }
    else if (endpoint === 'locations/search') {
      const query = queryParams.q || '';
      const limit = parseInt(queryParams.limit) || 10;
      
      // Filter locations based on query
      responseData = mockData.regions
        .filter(region => region.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit);
    }
    else {
      // Default empty response
      responseData = [];
    }
    
    // Log success
    logRequest('GET', endpoint, 200);
    
    // Return mock data
    return NextResponse.json(responseData);
  } catch (error) {
    // Log error detail
    console.error(`[Mock API] Error in GET request:`, error);
    
    return NextResponse.json(
      { error: 'Mock API error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handler untuk request POST
 */
export async function POST(request, { params }) {
  try {
    // URL path parts
    const url = new URL(request.url);
    
    // Extract path parts after /api/
    let endpoint = '';
    if (params && params.path) {
      endpoint = params.path.join('/');
    } else {
      // Extract path from URL if params.path is not available
      const apiPrefix = '/api/';
      if (url.pathname.startsWith(apiPrefix)) {
        endpoint = url.pathname.substring(apiPrefix.length);
      }
    }
    
    // Get request body
    let body = null;
    try {
      body = await request.json();
    } catch (e) {
      console.error('[Mock API] Error parsing request body:', e);
      return NextResponse.json(
        { error: 'Invalid request body', details: e.message },
        { status: 400 }
      );
    }
    
    console.log(`[Mock API] POST request for: ${endpoint}`, body);
    
    // Mock successful response
    const responseData = {
      success: true,
      message: 'Operation completed successfully',
      id: `mock-id-${Date.now()}`
    };
    
    // Log success
    logRequest('POST', endpoint, 200);
    
    // Return mock response
    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`[Mock API] Error in POST request:`, error);
    
    return NextResponse.json(
      { error: 'Mock API error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handler untuk request PUT
 */
export async function PUT(request, { params }) {
  try {
    // URL path parts
    const url = new URL(request.url);
    
    // Extract path parts after /api/
    let endpoint = '';
    if (params && params.path) {
      endpoint = params.path.join('/');
    } else {
      // Extract path from URL if params.path is not available
      const apiPrefix = '/api/';
      if (url.pathname.startsWith(apiPrefix)) {
        endpoint = url.pathname.substring(apiPrefix.length);
      }
    }
    
    // Get request body
    let body = null;
    try {
      body = await request.json();
    } catch (e) {
      console.error('[Mock API] Error parsing request body:', e);
      return NextResponse.json(
        { error: 'Invalid request body', details: e.message },
        { status: 400 }
      );
    }
    
    console.log(`[Mock API] PUT request for: ${endpoint}`, body);
    
    // Mock successful response
    const responseData = {
      success: true,
      message: 'Update completed successfully',
      updated: true
    };
    
    // Log success
    logRequest('PUT', endpoint, 200);
    
    // Return mock response
    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`[Mock API] Error in PUT request:`, error);
    
    return NextResponse.json(
      { error: 'Mock API error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handler untuk request DELETE
 */
export async function DELETE(request, { params }) {
  try {
    // URL path parts
    const url = new URL(request.url);
    
    // Extract path parts after /api/
    let endpoint = '';
    if (params && params.path) {
      endpoint = params.path.join('/');
    } else {
      // Extract path from URL if params.path is not available
      const apiPrefix = '/api/';
      if (url.pathname.startsWith(apiPrefix)) {
        endpoint = url.pathname.substring(apiPrefix.length);
      }
    }
    
    console.log(`[Mock API] DELETE request for: ${endpoint}`);
    
    // Mock successful response
    const responseData = {
      success: true,
      message: 'Resource deleted successfully',
      deleted: true
    };
    
    // Log success
    logRequest('DELETE', endpoint, 200);
    
    // Return mock response
    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`[Mock API] Error in DELETE request:`, error);
    
    return NextResponse.json(
      { error: 'Mock API error', details: error.message },
      { status: 500 }
    );
  }
}