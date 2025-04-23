// app/api/[[...path]]/route.js
// Perhatikan sintaks [[...path]] dengan double bracket untuk menangani root path juga

import { NextResponse } from 'next/server';

// Backend API URL
const API_URL = process.env.API_URL || 'http://localhost:8000';

export async function GET(request, { params }) {
  try {
    // URL path parts
    const { pathname, search } = new URL(request.url);
    
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
    const { pathname } = new URL(request.url);
    
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