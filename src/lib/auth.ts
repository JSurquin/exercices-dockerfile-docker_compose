import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: {
    adapter: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
  },
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    },
  },
  // Configuration de base pour CashTrade
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // 1 jour
  },
  user: {
    additionalFields: {
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
      totalVolume: {
        type: "number",
        defaultValue: 0,
      },
      kycStatus: {
        type: "string",
        defaultValue: "pending", // pending, verified, rejected
      },
      acceptedTermsAt: {
        type: "date",
        required: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;