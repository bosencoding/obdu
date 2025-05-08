import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Construct the URL for the FastAPI backend
    const backendUrl = `http://localhost:8000/api/paket/filter?${searchParams.toString()}`;

    console.log(`[Proxy API] Forwarding GET request to: ${backendUrl}`);

    // Fetch data from the FastAPI backend
    const response = await fetch(backendUrl);

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error(`[Proxy API] Backend request failed: ${response.status} ${response.statusText}. ${errorDetails}`);
      return NextResponse.json(
        { error: 'Backend API request failed', details: errorDetails },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the data received from the backend
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[Proxy API] Error in GET request:`, error);

    return NextResponse.json(
      { error: 'Proxy API error', details: error.message },
      { status: 500 }
    );
  }
}