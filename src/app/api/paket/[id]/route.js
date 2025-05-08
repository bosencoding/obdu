import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const backendUrl = `http://localhost:8000/data-sirup/${id}`;

    console.log(`[Proxy API] Forwarding GET request to: ${backendUrl}`);

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
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[Proxy API] Error in GET request:`, error);
    return NextResponse.json(
      { error: 'Proxy API error', details: error.message },
      { status: 500 }
    );
  }
}