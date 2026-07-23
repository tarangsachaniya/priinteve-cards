import { headers } from "next/headers";

import type { DisplayCurrency } from "@/lib/currency-format";

export type { DisplayCurrency };

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  IN: "INR",
  US: "USD",
  GB: "GBP",
  CA: "USD",
  AU: "USD",
  // Eurozone
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  IE: "EUR",
  PT: "EUR",
  BE: "EUR",
  AT: "EUR",
  FI: "EUR",
  GR: "EUR",
};

const FALLBACK_RATES: Record<string, number> = {
  USD: 0.012,
  GBP: 0.0095,
  EUR: 0.011,
};

function currencyForCountry(country: string | null): string {
  if (!country) return "INR";
  return COUNTRY_TO_CURRENCY[country.toUpperCase()] ?? "USD";
}

/**
 * Resolves the visitor's display currency from Vercel's automatic geo header
 * (free, no API key). Falls back to plain INR whenever the country can't be
 * detected (e.g. local dev) or the live rate can't be fetched — actual
 * charges always stay in INR, this only affects what's rendered on screen.
 * Server-only (reads request headers) — client components should import
 * `formatLocalPrice`/`DisplayCurrency` from `lib/currency-format` instead.
 */
export async function getDisplayCurrency(): Promise<DisplayCurrency> {
  const country = headers().get("x-vercel-ip-country");
  const code = currencyForCountry(country);

  if (code === "INR") {
    return { code: "INR", rate: 1 };
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/INR", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error("rate fetch failed");
    const data = await res.json();
    const rate = data?.rates?.[code];
    if (typeof rate !== "number") throw new Error("rate missing");
    return { code, rate };
  } catch {
    const fallbackRate = FALLBACK_RATES[code];
    if (!fallbackRate) return { code: "INR", rate: 1 };
    return { code, rate: fallbackRate };
  }
}
