import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth";
import {
  getCurrentUserForTwoFactor,
  buildInternalHeaders,
} from "@/lib/security/two-factor";
import { safeParseJson } from "@/lib/validation/helpers";
import { verifyTotpBodySchema } from "@/lib/validation/schemas/payout-security";

export async function POST(request: NextRequest) {
  const result = await getCurrentUserForTwoFactor(request.headers);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  let raw: unknown = {};
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = safeParseJson(raw, verifyTotpBodySchema);
  if (!parsed.ok) {
    return parsed.response;
  }
  const body = parsed.data;

  const internalRequest = new Request(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/two-factor/verify-totp`,
    {
      method: "POST",
      headers: buildInternalHeaders(request.headers),
      body: JSON.stringify({
        code: body?.code,
        trustDevice: Boolean(body?.trustDevice),
      }),
    },
  );

  const response = await auth.handler(internalRequest);
  const payload = await response.json().catch(() => ({}));

  return NextResponse.json(payload, { status: response.status });
}
