import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';

function readNextBuildId(): string | null {
  try {
    const buildIdPath = join(process.cwd(), '.next', 'BUILD_ID');
    if (!existsSync(buildIdPath)) return null;
    const id = readFileSync(buildIdPath, 'utf8').trim();
    return id || null;
  } catch {
    return null;
  }
}

/**
 * Liveness probe for Dokploy / Traefik / Cloudflare tunnel.
 * Must stay fast — no DB calls (migrations may still be running).
 * `commit` is the Next build id (git SHA when generateBuildId succeeds).
 */
export async function GET() {
  const commit =
    readNextBuildId() ||
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
    { status: 200 },
  );
}
