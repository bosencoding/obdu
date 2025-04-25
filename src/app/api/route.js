// app/api/[[...path]]/route.js
// Simplified API Route Handler with robust error handling

import { NextResponse } from 'next/server';

// Backend API URL - pastikan URL ini benar dan dapat diakses
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Basic logging
function logRequest(method, url, status, error = null) {
  console.log(`[API Proxy] ${method} ${url} => ${status}${error ? ` (Error: ${error})` : ''}`);
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
    let backendPath = '';
    if (params.path) {
      backendPath = params.path.join('/');
    }
    
    // Log request
    const targetUrl = `${API_URL}/${backendPath}${search}`;
    console.log(`[API Proxy] Forwarding GET: ${targetUrl}`);
    
    // Buat timeout untuk request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
    
    // Buat request ke backend
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Jika response bukan 2xx, log detail error
    if (!response.ok) {
      const errorText = await response.text();
      logRequest('GET', targetUrl, response.status, errorText);
      
      return NextResponse.json(
        { error: `Backend API returned status ${response.status}`, details: errorText },
        { status: response.status }
      );
    }
    
    // Ambil data dari response
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      logRequest('GET', targetUrl, response.status);
    } else {
      data = { message: 'Non-JSON response received' };
      const text = await response.text();
      logRequest('GET', targetUrl, response.status, `Non-JSON response: ${text.substring(0, 100)}...`);
    }
    
    // Return response
    return NextResponse.json(data);
  } catch (error) {
    // Log error detail
    console.error(`[API Proxy] Error dalam request GET:`, error);
    
    // Handle AbortError (timeout) secara khusus
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout', details: 'The request took too long to complete' },
        { status: 504 } // Gateway Timeout
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch data from backend API', details: error.message },
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
    let backendPath = '';
    if (params.path) {
      backendPath = params.path.join('/');
    }
    
    // Get request body
    let body = null;
    try {
      body = await request.json();
    } catch (e) {
      console.error('[API Proxy] Error parsing request body:', e);
      return NextResponse.json(
        { error: 'Invalid request body', details: e.message },
        { status: 400 }
      );
    }
    
    const targetUrl = `${API_URL}/${backendPath}`;
    console.log(`[API Proxy] Forwarding POST: ${targetUrl}`);
    
    // Timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
    
    // Forward the request to the backend API
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Handle error response
    if (!response.ok) {
      const errorText = await response.text();
      logRequest('POST', targetUrl, response.status, errorText);
      
      return NextResponse.json(
        { error: `Backend API returned status ${response.status}`, details: errorText },
        { status: response.status }
      );
    }
    
    // Get data from response
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      logRequest('POST', targetUrl, response.status);
    } else {
      data = { message: 'Operation completed successfully' };
      logRequest('POST', targetUrl, response.status, 'Non-JSON response received');
    }
    
    // Return response from backend
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[API Proxy] Error dalam request POST:`, error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout', details: 'The request took too long to complete' },
        { status: 504 } // Gateway Timeout
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to send data to backend API', details: error.message },
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
    let backendPath = '';
    if (params.path) {
      backendPath = params.path.join('/');
    }
    
    // Get request body
    let body = null;
    try {
      body = await request.json();
    } catch (e) {
      console.error('[API Proxy] Error parsing request body:', e);
      return NextResponse.json(
        { error: 'Invalid request body', details: e.message },
        { status: 400 }
      );
    }
    
    const targetUrl = `${API_URL}/${backendPath}`;
    console.log(`[API Proxy] Forwarding PUT: ${targetUrl}`);
    
    // Timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
    
    // Forward the request to the backend API
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Handle error response
    if (!response.ok) {
      const errorText = await response.text();
      logRequest('PUT', targetUrl, response.status, errorText);
      
      return NextResponse.json(
        { error: `Backend API returned status ${response.status}`, details: errorText },
        { status: response.status }
      );
    }
    
    // Get data from response
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      logRequest('PUT', targetUrl, response.status);
    } else {
      data = { message: 'Operation completed successfully' };
      logRequest('PUT', targetUrl, response.status, 'Non-JSON response received');
    }
    
    // Return response from backend
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[API Proxy] Error dalam request PUT:`, error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout', details: 'The request took too long to complete' },
        { status: 504 } // Gateway Timeout
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update data in backend API', details: error.message },
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
    let backendPath = '';
    if (params.path) {
      backendPath = params.path.join('/');
    }
    
    const targetUrl = `${API_URL}/${backendPath}`;
    console.log(`[API Proxy] Forwarding DELETE: ${targetUrl}`);
    
    // Timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
    
    // Forward the request to the backend API
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Get data from response (if any)
    let data;
    try {
      if (response.headers.get('content-type')?.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: 'Resource deleted successfully' };
      }
      logRequest('DELETE', targetUrl, response.status);
    } catch {
      data = { message: 'Resource deleted successfully' };
      logRequest('DELETE', targetUrl, response.status, 'Could not parse response');
    }
    
    // Return response from backend
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[API Proxy] Error dalam request DELETE:`, error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout', details: 'The request took too long to complete' },
        { status: 504 } // Gateway Timeout
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete data in backend API', details: error.message },
      { status: 500 }
    );
  }
}