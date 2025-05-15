import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

export async function POST(request, { params }) {
  console.log('[Proxy API] POST handler for /api/sales/[id] triggered'); // Added log
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Missing ID in path' }, { status: 400 });
  }

  try {
    const requestBody = await request.json();
    const backendUrl = `${BACKEND_API_URL}/sales/${id}`;
    const stringifiedBody = JSON.stringify(requestBody);

    console.log(`[Proxy API] Forwarding POST request to: ${backendUrl}`);
    console.log('[Proxy API] Request Body (stringified):', stringifiedBody);
    console.log('[Proxy API] Request Headers:', {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    });

    // Forward most headers from the incoming request
    const forwardedHeaders = new Headers(request.headers);
    // Remove hop-by-hop headers that are not allowed to be forwarded
    const hopByHopHeaders = [
      'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
      'te', 'trailer', 'transfer-encoding', 'upgrade'
    ];
    hopByHopHeaders.forEach(header => forwardedHeaders.delete(header));

    // Ensure Content-Type and Accept are set correctly for the backend
    forwardedHeaders.set('Content-Type', 'application/json');
    forwardedHeaders.set('accept', 'application/json');

    console.log('[Proxy API] Forwarded Headers:', Object.fromEntries(forwardedHeaders.entries()));

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: forwardedHeaders,
      body: stringifiedBody,
    });

    if (!backendResponse.ok) {
      const errorDetails = await backendResponse.text();
      console.error(`[Proxy API] Backend POST request failed: ${backendResponse.status} ${backendResponse.statusText}. ${errorDetails}`);
      return NextResponse.json({ error: 'Backend request failed', details: errorDetails }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    console.log(`[Proxy API] Backend POST request successful for ${id}`);
    return NextResponse.json(data, { status: backendResponse.status });

  } catch (error) {
    console.error('[Proxy API] Error in POST request:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// Add other HTTP methods if needed (e.g., GET, PUT, DELETE)
// export async function GET(request, { params }) { ... }