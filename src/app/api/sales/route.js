import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[Proxy API] GET handler for /api/sales triggered');
  return NextResponse.json({ message: 'Sales API route is working' });
}

// Add other HTTP methods if needed
// export async function POST(request) { ... }