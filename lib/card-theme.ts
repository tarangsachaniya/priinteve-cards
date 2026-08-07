
import { THEME_PRESET_IDS } from "@/lib/theme-presets";

/**
 * Light/dark for the public card.
 *
 * The card owner picks one of these and it is stored on
 * `CardSettings.themeMode`. `system` follows the *visitor's* OS preference,
 * which is what the PrintEve reference files do (`prefers-color-scheme`).
 * A visitor can always override the owner's choice with the on-card toggle;
 * that override is remembered in localStorage, per card.
 */
export const CARD_MODES = ["light", "dark", "system"] as const;
export type CardMode = (typeof CARD_MODES)[number];

/** Zod-friendly tuple, mirroring how THEME_PRESET_IDS is consumed. */
export const CARD_MODE_IDS = CARD_MODES as unknown as [string, ...string[]];

export const CARD_MODE_OPTIONS: { id: CardMode; label: string; description: string }[] = [
  { id: "light", label: "Light", description: "Warm ivory. Always light for every visitor." },
  { id: "dark", label: "Dark", description: "Deep green-black. Always dark for every visitor." },
  { id: "system", label: "System", description: "Follows each visitor's device setting." },
];

export const DEFAULT_CARD_MODE: CardMode = "light";

/** The reference palette's brand green — the default accent for a new card. */
export const DEFAULT_BRAND_COLOR = "#16A34A";

/** What actually gets painted, once `system` has been resolved. */
export type ResolvedCardMode = "light" | "dark";

export function isCardMode(value: string | null | undefined): value is CardMode {
  return typeof value === "string" && (CARD_MODES as readonly string[]).includes(value);
}

export function normalizeCardMode(value: string | null | undefined): CardMode {
  return isCardMode(value) ? value : DEFAULT_CARD_MODE;
}

export function normalizeCardTheme(value: string | null | undefined): string {
  // CardSettings.themeId defaults to "default" in the schema, which predates the
  // named presets — fall back to the first preset rather than rendering nothing.
  return value && THEME_PRESET_IDS.includes(value) ? value : THEME_PRESET_IDS[0];
}

/**
 * Per-card key, so a visitor who prefers dark on one card does not force dark
 * onto every other card they open.
 */
export function cardModeStorageKey(slug: string): string {
  return `printeve-card-mode:${slug}`;
}

/**
 * Server-side resolution. `system` cannot be resolved on the server (there is
 * no visitor yet, and `/[slug]` is statically rendered), so it renders as light
 * and the pre-paint script corrects it before anything is shown.
 */
export function resolveCardModeForRender(mode: CardMode): ResolvedCardMode {
  return mode === "dark" ? "dark" : "light";
}
