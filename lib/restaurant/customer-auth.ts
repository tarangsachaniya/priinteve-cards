import { cookies } from "next/headers";
import { decode, encode, type JWT } from "next-auth/jwt";

/**
 * Session handling for restaurant *customers* — the "log in with just your
 * mobile number" convenience, deliberately separate from both NextAuth's
 * `User` session and the staff session in lib/restaurant/auth.ts. This
 * module mints its own cookie using the same next-auth/jwt primitives as
 * those two, so there is one signing mechanism to reason about, but zero
 * shared session state.
 *
 * IMPORTANT — this is self-asserted identity, not authentication in the
 * usual sense: whoever POSTs a mobile number gets a session for that
 * number, with no OTP or other verification step behind it. That is the
 * same trust level the checkout form already has today (anyone can type any
 * number into the order form), so this module doesn't lower the bar — it
 * just persists it across requests as a convenience. It must never be
 * treated as authorizing anything beyond convenience (name/mobile prefill,
 * "your orders"-style views): it is not proof the caller owns the number.
 *
 * The token carries aud: "customer" and getCustomerSession() rejects
 * anything without it. A card user's NextAuth token or a restaurant staff
 * token is therefore useless here even though all three are signed with
 * NEXTAUTH_SECRET.
 */

const AUDIENCE = "customer";
// 30 days — longer than the staff session's 7 days. That's a "remember me"
// convenience for a repeat diner, not a security boundary: there's no OTP
// behind this session either way, so a longer-lived cookie doesn't trade
// away anything the short-lived one was protecting.
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export type CustomerSession = {
  customerId: string;
  restaurantId: string;
  mobile: string;
  name: string;
};

function isSecureCookie(): boolean {
  return process.env.NEXTAUTH_URL?.startsWith("https://") ?? !!process.env.VERCEL;
}

function cookieName(): string {
  return isSecureCookie() ? "__Secure-resto-customer-session" : "resto-customer-session";
}

function secret(): string {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("NEXTAUTH_SECRET is not set");
  return value;
}

type CustomerClaims = {
  aud: typeof AUDIENCE;
  sub: string;
  restaurantId: string;
  mobile: string;
  name: string;
};

export async function issueCustomerSession(session: CustomerSession): Promise<void> {
  const claims: CustomerClaims = {
    aud: AUDIENCE,
    sub: session.customerId,
    restaurantId: session.restaurantId,
    mobile: session.mobile,
    name: session.name,
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

export function clearCustomerSession(): void {
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

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const raw = cookies().get(cookieName())?.value;
  if (!raw) return null;

  try {
    const token = await decode({ token: raw, secret: secret() });
    if (!token || token.aud !== AUDIENCE) return null;

    const { sub, restaurantId, mobile, name } = token as Record<string, unknown>;
    if (
      typeof sub !== "string" ||
      typeof restaurantId !== "string" ||
      typeof mobile !== "string" ||
      typeof name !== "string"
    ) {
      return null;
    }

    return { customerId: sub, restaurantId, mobile, name };
  } catch {
    return null;
  }
}
