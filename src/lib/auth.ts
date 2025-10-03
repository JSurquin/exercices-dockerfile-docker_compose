import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../../prisma/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    // selectUserFields: {
    //   id: true,
    //   email: true, 
    //   name: true,
    //   emailVerified: true,
    //   image: true,
    //   createdAt: true,
    //   updatedAt: true,
    //   role: true, // 👈 indispensable pour récupérer après login
    // },
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
   },
  // Configuration de base pour CashTrade
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // 1 jour
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER", // USER, ADMIN
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER", // USER, ADMIN
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
    },
  },
  // Configuration simplifiée sans champs additionnels pour le moment
  trustedOrigins: [process.env.NEXT_PUBLIC_BASE_URL!],

  selectUserFields: {
    id: true,
    email: true, 
    name: true,
    emailVerified: true,
    image: true,
    createdAt: true,
    updatedAt: true,
    role: true, // 👈 indispensable pour récupérer après login
     },

  // Configuration explicite du secret
  secret: process.env.BETTER_AUTH_SECRET!,

  plugins: [nextCookies()],
});

export type AuthUser = typeof auth.$Infer.Session.user & {
  role: string;
};

export type Session = Omit<typeof auth.$Infer.Session, "user"> & {
  user: AuthUser;
};
// export type AuthUser = typeof auth.$Infer.Session.user;