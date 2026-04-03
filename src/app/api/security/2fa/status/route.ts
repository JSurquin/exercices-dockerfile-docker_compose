import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForTwoFactor } from "@/lib/security/two-factor";
import { prisma } from "~/prisma/prisma";

export async function GET(request: NextRequest) {
  const result = await getCurrentUserForTwoFactor(request.headers);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const twoFactorRecord = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "twoFactor" WHERE "userId" = ${result.user.id} LIMIT 1
  `.catch(() => []);

  const dbUser = await prisma.user.findUnique({
    where: { id: result.user.id },
    select: { twoFactorEnabled: true },
  });

  return NextResponse.json({
    enabled: dbUser?.twoFactorEnabled ?? false,
    configured: twoFactorRecord.length > 0,
  });
}
