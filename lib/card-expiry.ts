const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

export function isCardExpired(planExpiresAt: Date | null): boolean {
  return !!planExpiresAt && planExpiresAt.getTime() < Date.now();
}

export function isPastGracePeriod(planExpiresAt: Date | null): boolean {
  return !!planExpiresAt && planExpiresAt.getTime() + GRACE_PERIOD_MS < Date.now();
}
