import { NextRequest, NextResponse } from 'next/server';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminUpdateNotificationsSchema } from '@/lib/validation/schemas/admin-bodies';

// Redirected to PATCH /api/admin/settings
export async function POST(request: NextRequest) {
  const raw = await request.json();
  const parsed = safeParseJson(raw, adminUpdateNotificationsSchema);
  if (!parsed.ok) {
    return parsed.response;
  }
  return fetch(new URL('/api/admin/settings', request.url), {
    method: 'PATCH',
    headers: request.headers,
    body: JSON.stringify({ notifications: parsed.data }),
  }).then(async (res) => new NextResponse(await res.text(), { status: res.status, headers: { 'Content-Type': 'application/json' } }));
}
