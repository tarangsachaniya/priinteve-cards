import type { Role } from "@prisma/client";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { createPendingReferralIfPresent } from "@/lib/referral";
import { generateUniqueReferralCode, generateUniqueSlug } from "@/lib/slug";

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          cardPublished: user.cardPublished,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = user.email;
      if (!email) {
        return false;
      }

      let dbUser = await db.user.findFirst({
        where: {
          OR: [{ googleId: account.providerAccountId }, { email }],
        },
      });

      if (!dbUser) {
        const slug = await generateUniqueSlug(user.name ?? email.split("@")[0]);
        const referralCode = await generateUniqueReferralCode();
        dbUser = await db.user.create({
          data: {
            name: user.name ?? undefined,
            email,
            googleId: account.providerAccountId,
            role: "USER",
            slug,
            referralCode,
            cardPublished: false,
          },
        });
        await createPendingReferralIfPresent(dbUser.id);
      } else if (!dbUser.googleId) {
        dbUser = await db.user.update({
          where: { id: dbUser.id },
          data: { googleId: account.providerAccountId },
        });
      }

      user.id = dbUser.id;
      user.role = dbUser.role;
      user.cardPublished = dbUser.cardPublished;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.cardPublished = user.cardPublished;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.cardPublished = token.cardPublished;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

type SessionUser = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  cardPublished: boolean;
};

/**
 * Mints a NextAuth-compatible session JWT and sets it as the session cookie
 * on the current response. Lets routes like signup log a user in directly
 * instead of requiring a second client-side signIn() round trip.
 */
export async function issueSessionCookie(user: SessionUser) {
  const secureCookie = process.env.NEXTAUTH_URL?.startsWith("https://") ?? !!process.env.VERCEL;

  const token = await encode({
    token: {
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      cardPublished: user.cardPublished,
    },
    secret: process.env.NEXTAUTH_SECRET as string,
    maxAge: SESSION_MAX_AGE,
  });

  cookies().set({
    name: secureCookie ? "__Secure-next-auth.session-token" : "next-auth.session-token",
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: secureCookie,
    maxAge: SESSION_MAX_AGE,
  });
}
