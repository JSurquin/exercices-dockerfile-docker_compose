import { NextRequest, NextResponse } from 'next/server';

// Redirected to PATCH /api/admin/settings
export async function POST(request: NextRequest) {
  const body = await request.json();
  return fetch(new URL('/api/admin/settings', request.url), {
    method: 'PATCH',
    headers: request.headers,
    body: JSON.stringify({ notifications: body }),
  }).then(async (res) => new NextResponse(await res.text(), { status: res.status, headers: { 'Content-Type': 'application/json' } }));
}
