import { betterAuth } from "better-auth";
import type { BetterAuthPlugin } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor, admin } from "better-auth/plugins";
import { prisma } from "~/prisma/prisma";
import { emailService } from "../src/lib/email";

// Better Auth 1.2.12 a un bug de typage sur viewBackupCodes (GET avec body dans un GET endpoint).
// Le cast est sans impact runtime — le plugin fonctionne normalement.
const twoFactorPlugin = twoFactor({
  issuer: "MoonSkin",
  otpOptions: {
    async sendOTP({ user, otp }: { user: { email: string }; otp: string }) {
      await emailService.sendEmail({
        to: user.email,
        subject: "MoonSkin - Code de verification 2FA",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f172a;border-radius:12px;">
            <h2 style="color:#f97316;margin:0 0 8px">MoonSkin — Verification 2FA</h2>
            <p style="color:#94a3b8;margin:0 0 24px">Utilisez ce code pour confirmer votre connexion.</p>
            <div style="background:#1e293b;border-radius:8px;padding:20px;text-align:center;">
              <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#fff;">${otp}</span>
            </div>
            <p style="color:#64748b;font-size:13px;margin:16px 0 0">Ce code expire dans quelques minutes. Ne le partagez jamais.</p>
          </div>
        `,
        text: `Votre code de verification MoonSkin est : ${otp}`,
      });
    },
  },
}) as unknown as BetterAuthPlugin;

export const auth = betterAuth({
  appName: "MoonSkin",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      const account = await prisma.account.findFirst({
        where: { userId: user.id, providerId: "credential" },
      });

      const isNewAccount = !account || !account.password;

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { affiliateStats: true },
      });

      if (isNewAccount && fullUser?.role === "AFFILIATE" && fullUser.affiliateStats) {
        await emailService.sendAffiliateWelcomeEmail(
          user.email,
          token,
          fullUser.affiliateStats.code,
          user.name || user.email,
          fullUser.affiliateStats.commissionRate,
        );
      } else if (isNewAccount) {
        await emailService.sendWelcomeEmailWithPasswordReset(
          user.email,
          token,
          user.name || user.email,
          true,
        );
      } else {
        await emailService.sendPasswordResetEmail(
          user.email,
          token,
          user.name || user.email,
        );
      }
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER",
      },
      steamId: {
        type: "string",
        required: false,
      },
      steamUsername: {
        type: "string",
        required: false,
      },
      steamAvatar: {
        type: "string",
        required: false,
      },
      level: {
        type: "number",
        defaultValue: 1,
      },
      xp: {
        type: "number",
        defaultValue: 0,
      },
      tickets: {
        type: "number",
        defaultValue: 0,
      },
      fragments: {
        type: "number",
        defaultValue: 0,
      },
      totalVolumeCents: {
        type: "number",
        defaultValue: 0,
      },
      kycStatus: {
        type: "string",
        defaultValue: "PENDING",
      },
      acceptedTermsAt: {
        type: "date",
        required: false,
      },
      isFirstLogin: {
        type: "boolean",
        defaultValue: true,
      },
    },
    modelName: "user",
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_BASE_URL!],
  secret: process.env.BETTER_AUTH_SECRET!,

  plugins: [
    nextCookies(),
    twoFactorPlugin,
    admin({
      defaultRole: "USER",
      adminRoles: ["ADMIN"],
    }),
  ],
});

export type AuthUser = typeof auth.$Infer.Session.user & {
  role: string;
  steamId?: string;
  steamUsername?: string;
  steamAvatar?: string;
  level?: number;
  xp?: number;
  tickets?: number;
  totalVolumeCents?: number;
  kycStatus?: string;
  acceptedTermsAt?: Date;
  isFirstLogin?: boolean;
  twoFactorEnabled?: boolean;
};

export type Session = Omit<typeof auth.$Infer.Session, "user"> & {
  user: AuthUser;
};
