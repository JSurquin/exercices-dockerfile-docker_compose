import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth";
import {
  getCurrentUserForTwoFactor,
  resolveTwoFactorPassword,
  buildInternalHeaders,
} from "@/lib/security/two-factor";
import { safeParseJson } from "@/lib/validation/helpers";
import { twoFactorPasswordBodySchema } from "@/lib/validation/schemas/payout-security";

export async function POST(request: NextRequest) {
  const result = await getCurrentUserForTwoFactor(request.headers);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = safeParseJson(raw, twoFactorPasswordBodySchema);
  if (!parsed.ok) {
    return parsed.response;
  }
  const pwd = parsed.data.password;
  const password = resolveTwoFactorPassword(
    result.user.steamId,
    pwd === null || pwd === undefined ? undefined : String(pwd),
  );

  const internalRequest = new Request(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/two-factor/enable`,
    {
      method: "POST",
      headers: buildInternalHeaders(request.headers),
      body: JSON.stringify({ password, issuer: "MoonSkin" }),
    },
  );

  const internalResponse = await auth.handler(internalRequest);
  const payload = await internalResponse.json().catch(() => ({}));

  const response = NextResponse.json(payload, { status: internalResponse.status });

  // Propager les éventuels nouveaux cookies de session posés par Better Auth
  for (const cookie of internalResponse.headers.getSetCookie?.() ?? []) {
    response.headers.append("set-cookie", cookie);
  }

  return response;
}
