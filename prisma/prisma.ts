import { PrismaClient } from "@prisma/client";
import { encrypt, decrypt } from "../src/lib/encryption";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Chiffre les champs sensibles du modèle TwoFactor (secret TOTP + backup codes)
 * avant écriture et les déchiffre après lecture via un Prisma middleware.
 * Si ENCRYPTION_KEY est absente, les données sont stockées en clair (dev sans env).
 */
function applyEncryptionMiddleware(client: PrismaClient) {
  const canEncrypt = !!process.env.ENCRYPTION_KEY;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client.$use(async (params: any, next: any) => {
    // Chiffrement en écriture
    if (params.model === "TwoFactor" && canEncrypt) {
      const writeActions = ["create", "update", "upsert", "createMany", "updateMany"];
      if (writeActions.includes(params.action)) {
        const data = params.args?.data;
        if (data) {
          if (typeof data.secret === "string") data.secret = encrypt(data.secret);
          if (typeof data.backupCodes === "string") data.backupCodes = encrypt(data.backupCodes);
        }
      }
    }

    const result = await next(params);

    // Déchiffrement en lecture
    if (params.model === "TwoFactor" && canEncrypt && result) {
      const decryptField = (obj: Record<string, unknown>) => {
        if (typeof obj.secret === "string") {
          try { obj.secret = decrypt(obj.secret); } catch { /* déjà en clair (migration) */ }
        }
        if (typeof obj.backupCodes === "string") {
          try { obj.backupCodes = decrypt(obj.backupCodes); } catch { /* déjà en clair */ }
        }
      };
      if (Array.isArray(result)) result.forEach(decryptField);
      else decryptField(result as Record<string, unknown>);
    }

    return result;
  });
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  applyEncryptionMiddleware(client);
  client.$connect().catch((err) => {
    console.error("[Prisma] Failed to connect on startup:", err);
  });
  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Always persist the singleton to avoid "Engine is not yet connected" in production
globalForPrisma.prisma = prisma;
