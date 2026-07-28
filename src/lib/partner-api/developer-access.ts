import { prisma } from '~/prisma/prisma';

export async function canUserManageApiKeys(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      developerProgramEnabled: true,
      _count: { select: { apiClients: true } },
    },
  });

  if (!user) return false;
  return user.developerProgramEnabled || user._count.apiClients > 0;
}
