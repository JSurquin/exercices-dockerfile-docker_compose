import { NextResponse } from 'next/server';

/**
 * Liveness probe for Dokploy / Traefik / Cloudflare tunnel.
 * Must stay fast — no DB calls (migrations may still be running).
 */
export async function GET() {
  return NextResponse.json(
    { ok: true, service: 'moonskin', timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
