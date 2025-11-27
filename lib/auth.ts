import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "~/prisma/prisma";
import { emailService } from "../src/lib/email";

export const auth = betterAuth({
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
    requireEmailVerification: false,
    sendResetPassword: async ({user, url, token}, request) => {
      await emailService.sendPasswordResetEmail(user.email, token, user.name || user.email);
    },
    onPasswordReset: async ({ user }: { user: { email: string; name: string | null } }) => {
      await emailService.sendPasswordSuccessResetEmail(user.email, user.name || user.email);
    },

    
   },
   session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // 1 jour
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
      totalVolumeCents: {
        type: "number",
        defaultValue: 0,
      },
      kycStatus: {
        type: "string",
        defaultValue: "PENDING", // PENDING, VERIFIED, REJECTED
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
  ],
});

export type AuthUser = typeof auth.$Infer.Session.user & {
  role: string;
};

export type Session = Omit<typeof auth.$Infer.Session, "user"> & {
  user: AuthUser;
};
