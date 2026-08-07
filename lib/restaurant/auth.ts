import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decode, encode, type JWT } from "next-auth/jwt";

/**
 * Session handling for the restaurant ordering module.
 *
 * Deliberately separate from NextAuth: restaurants live in RestaurantUser,
 * not User, and have no Role in the card product's enum. This module mints
 * its own cookie using the same next-auth/jwt primitives the card product
 * uses in issueSessionCookie() (lib/auth.ts), so there is one signing
 * mechanism to reason about — but zero shared session state.
 *
 * The token carries aud: "restaurant" and readRestaurantToken() rejects
 * anything without it. A card user's NextAuth token is therefore useless
 * here even though both are signed with NEXTAUTH_SECRET.
 */

const AUDIENCE = "restaurant";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type RestaurantSession = {
  userId: string;
  restaurantId: string;
  email: string;
  name: string;
  role: "OWNER" | "STAFF";
};

function isSecureCookie(): boolean {
  return process.env.NEXTAUTH_URL?.startsWith("https://") ?? !!process.env.VERCEL;
}

function cookieName(): string {
  return isSecureCookie() ? "__Secure-resto-session" : "resto-session";
}

function secret(): string {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("NEXTAUTH_SECRET is not set");
  return value;
}

type RestaurantClaims = {
  aud: typeof AUDIENCE;
  sub: string;
  restaurantId: string;
  email: string;
  name: string;
  // Named restaurantRole, not role: the card product augments NextAuth's JWT
  // interface with `role: Role`, and reusing that key would mean widening a
  // shared type this module must not touch.
  restaurantRole: "OWNER" | "STAFF";
};

export async function issueRestaurantSession(session: RestaurantSession): Promise<void> {
  const claims: RestaurantClaims = {
    aud: AUDIENCE,
    sub: session.userId,
    restaurantId: session.restaurantId,
    email: session.email,
    name: session.name,
    restaurantRole: session.role,
  };

  const token = await encode({
    // encode() is typed against the card product's augmented JWT interface
    // (id / role / cardPublished). Our token is a different shape by design,
    // so we assert at this one boundary rather than widening that interface.
    token: claims as unknown as JWT,
    secret: secret(),
    maxAge: SESSION_MAX_AGE,
  });

  cookies().set({
    name: cookieName(),
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isSecureCookie(),
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearRestaurantSession(): void {
  cookies().set({
    name: cookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isSecureCookie(),
    maxAge: 0,
  });
}

export async function getRestaurantSession(): Promise<RestaurantSession | null> {
  const raw = cookies().get(cookieName())?.value;
  if (!raw) return null;

  try {
    const token = await decode({ token: raw, secret: secret() });
    if (!token || token.aud !== AUDIENCE) return null;

    const { sub, restaurantId, email, name, restaurantRole } = token as Record<string, unknown>;
    if (
      typeof sub !== "string" ||
      typeof restaurantId !== "string" ||
      typeof email !== "string" ||
      typeof name !== "string" ||
      (restaurantRole !== "OWNER" && restaurantRole !== "STAFF")
    ) {
      return null;
    }

    return { userId: sub, restaurantId, email, name, role: restaurantRole };
  } catch {
    return null;
  }
}

/**
 * Guard for restaurant API routes. Same result shape as requireAdminSession
 * in lib/admin-guard.ts, so handlers read the same way across the codebase.
 *
 * Callers MUST scope every query by session.restaurantId and must never
 * accept a restaurantId from the request body.
 */
export async function requireRestaurantSession(): Promise<
  { ok: true; session: RestaurantSession } | { ok: false; response: NextResponse }
> {
  const session = await getRestaurantSession();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, session };
}
