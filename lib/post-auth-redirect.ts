import type { Role } from "@prisma/client";

/**
 * Every successful auth event (login, signup, Google OAuth) lands regular
 * users on the Home Page; the dashboard is reachable only via the navbar's
 * profile icon from there. Admins keep going straight to the admin panel.
 */
export function getPostAuthRedirectPath(user: { role: Role }): string {
  return user.role === "ADMIN" ? "/admin" : "/";
}
