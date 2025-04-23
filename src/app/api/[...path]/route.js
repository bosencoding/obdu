// app/api/[[...path]]/route.js
// Dengan implementasi cache

import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Backend API URL
const API_URL = process.env.API_URL || 'http://localhost:8000';

// Setup Redis client for caching
// Note: Requires @upstash/redis package and Upstash Redis account
// npm install @upstash/redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Cache TTL in seconds
const DEFAULT_CACHE_TTL = 5 * 60; // 5 minutes
const DASHBOARD_CACHE_TTL = 3 * 60; // 3 minutes for dashboard data

/**
 * Get cache key for request
 * @param {string} url - Request URL
 * @param {string} method - HTTP Method
 * @returns {string} - Cache key
 */
function getCacheKey(url, method) {
  return `api:${method}:${url}`;
}

/**
 * Check if response should be cached
 * @param {URL} url - Request URL object
 * @returns {boolean} - Whether to cache the response
 */
function shouldCacheResponse(url) {
  const path = url.pathname;
  
  // Don't cache dynamic paths that change frequently
  if (path.includes('/real-time/')) return false;
  
  // Always cache certain endpoints
  if (
    path.includes('/regions') || 
    path.includes('/locations/search') ||
    path.includes('/dashboard/stats') ||
    path.includes('/dashboard/chart/') ||
    path.includes('/dashboard/all')
  ) {
    return true;
  }
  
  return false;
}

/**
 * Get cache TTL based on path
 * @param {URL} url - Request URL object
 * @returns {number} - Cache TTL in seconds
 */
function getCacheTTL(url) {
  const path = url.pathname;
  
  if (path.includes('/dashboard/')) {
    return DASHBOARD_CACHE_TTL;
  }
  
  if (path.includes('/regions') || path.includes('/locations/search')) {
    return 60 * 60; // 1 hour for region data that rarely changes
  }
  
  return DEFAULT_CACHE_TTL;
}

export async function GET(request, { params }) {
  try {
    // URL path parts
    const url = new URL(request.url);
    const { pathname, search } = url;
    const cacheKey = getCacheKey(url.toString(), 'GET');
    
    // Try to get data from cache first
    if (shouldCacheResponse(url)) {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          console.log(`Cache hit for: ${url.toString()}`);
          return NextResponse.json(cachedData);
        }
      } catch (cacheError) {
        console.warn(`Cache error: ${cacheError.message}`);
        // Continue with API request if cache fails
      }
    }
    
    // Extract path parts after /api/
    let backendPath = '';
    if (params.path) {
      backendPath = params.path.join('/');
    }
    
    console.log(`Proxying GET request to: ${API_URL}/${backendPath}${search}`);
    
    // Forward the request to the backend API
    const response = await fetch(`${API_URL}/${backendPath}${search}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`Backend returned status: ${response.status}`);
      return NextResponse.json(
        { error: `Backend API returned status ${response.status}` },
        { status: response.status }
      );
    }
    
    // Get data from response
    const data = await response.json();
    
    // Cache the response if it should be cached
    if (shouldCacheResponse(url)) {
      try {
        const ttl = getCacheTTL(url);
        await redis.set(cacheKey, data, { ex: ttl });
        console.log(`Cached data for: ${url.toString()} with TTL: ${ttl}s`);
      } catch (cacheError) {
        console.warn(`Failed to cache data: ${cacheError.message}`);
      }
    }
    
    // Return response from backend
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error proxying GET request: ${error.message}`);
    return NextResponse.json(
      { error: 'Failed to fetch data from backend API', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    // URL path parts
    const url = new URL(request.url);
    const { pathname } = url;
    
    // Extract path parts after /api/
    let backendPath = '';
    if (params.path) {
      backendPath = params.path.join('/');
    }
    
    // Get request body
    const body = await request.json();
    
    console.log(`Proxying POST request to: ${API_URL}/${backendPath}`);
    
    // Forward the request to the backend API
    const response = await fetch(`${API_URL}/${backendPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // Get data from response
    const data = await response.json();
    
    // Invalidate relevant cache entries when mutating data
    try {
      // Create a pattern to match cached keys that might need invalidation
      const cachePattern = `api:GET:${url.origin}/api/${backendPath}*`;
      const keys = await redis.keys(cachePattern);
      
      if (keys.length > 0) {
        console.log(`Invalidating ${keys.length} cache entries matching: ${cachePattern}`);
        for (const key of keys) {
          await redis.del(key);
        }
      }
    } catch (cacheError) {
      console.warn(`Cache invalidation error: ${cacheError.message}`);
    }
    
    // Return response from backend
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Error proxying POST request: ${error.message}`);
    return NextResponse.json(
      { error: 'Failed to send data to backend API', details: error.message },
      { status: 500 }
    );
  }
}

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
    const body = await request.json();
    
    console.log(`Proxying PUT request to: ${API_URL}/${backendPath}`);
    
    // Forward the request to the backend API
    const response = await fetch(`${API_URL}/${backendPath}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // Get data from response
    const data = await response.json();
    
    // Invalidate relevant cache entries when mutating data
    try {
      // Create a pattern to match cached keys that might need invalidation
      const cachePattern = `api:GET:${url.origin}/api/${backendPath}*`;
      const keys = await redis.keys(cachePattern);
      
      if (keys.length > 0) {
        console.log(`Invalidating ${keys.length} cache entries matching: ${cachePattern}`);
        for (const key of keys) {
          await redis.del(key);
        }
      }
    } catch (cacheError) {
      console.warn(`Cache invalidation error: ${cacheError.message}`);
    }
    
    // Return response from backend
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Error proxying PUT request: ${error.message}`);
    return NextResponse.json(
      { error: 'Failed to update data in backend API', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // URL path parts
    const url = new URL(request.url);
    
    // Extract path parts after /api/
    let backendPath = '';
    if (params.path) {
      backendPath = params.path.join('/');
    }
    
    console.log(`Proxying DELETE request to: ${API_URL}/${backendPath}`);
    
    // Forward the request to the backend API
    const response = await fetch(`${API_URL}/${backendPath}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Get data from response (if any)
    let data;
    try {
      data = await response.json();
    } catch {
      data = { message: 'Resource deleted successfully' };
    }
    
    // Invalidate relevant cache entries when mutating data
    try {
      // Create a pattern to match cached keys that might need invalidation
      const cachePattern = `api:GET:${url.origin}/api/${backendPath}*`;
      const keys = await redis.keys(cachePattern);
      
      if (keys.length > 0) {
        console.log(`Invalidating ${keys.length} cache entries matching: ${cachePattern}`);
        for (const key of keys) {
          await redis.del(key);
        }
      }
    } catch (cacheError) {
      console.warn(`Cache invalidation error: ${cacheError.message}`);
    }
    
    // Return response from backend
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Error proxying DELETE request: ${error.message}`);
    return NextResponse.json(
      { error: 'Failed to delete data in backend API', details: error.message },
      { status: 500 }
    );
  }
}