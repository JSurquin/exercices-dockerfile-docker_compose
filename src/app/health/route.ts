import { NextResponse } from 'next/server';

/**
 * Liveness probe for Dokploy / Traefik / Cloudflare tunnel.
 * Must stay fast — no DB calls (migrations may still be running).
 * `commit` is baked at image build (nixpacks) so we can confirm which Git SHA is live.
 */
export async function GET() {
  const commit =
    process.env.GIT_SHA ||
    process.env.SOURCE_COMMIT ||
    process.env.NEXT_PUBLIC_GIT_SHA ||
    null;

  return NextResponse.json(
    {
      ok: true,
      service: 'moonskin',
      timestamp: new Date().toISOString(),
      ...(commit ? { commit: commit.slice(0, 12) } : {}),
    },
    { status: 200 }
  );
}
