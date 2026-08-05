"use client";

import { DEFAULT_BRAND_COLOR, normalizeCardTheme, type ResolvedCardMode } from "@/lib/card-theme";

/** Root class per theme — see app/card-layouts.css. */
const THEME_ROOT_CLASS: Record<string, string> = {
  original: "pe-og",
  bento: "pe-bn",
  editorial: "pe-ed",
};

export function cardThemeRootClass(themeId: string): string {
  return THEME_ROOT_CLASS[normalizeCardTheme(themeId)] ?? THEME_ROOT_CLASS.original;
}

/**
 * Establishes the theme scope every card token resolves against.
 *
 * Sets `data-card-theme` / `data-card-mode` (which app/card-theme.css keys all
 * six palettes off) and injects the owner's brand colour as `--brand`, from
 * which the whole accent ramp is derived in CSS.
 *
 * On the public /[slug] route (`asPage`) the mode attribute is deliberately
 * NOT set here. <CardModeScript> sets it on <html> before this markup is even
 * parsed, and the tokens inherit down — that is what makes mode switching
 * flash-free on a statically rendered page, and it also means portalled UI
 * (the gallery lightbox renders into document.body, outside this element)
 * still resolves the card palette. In previews there is no <html> attribute to
 * inherit from, so the element carries the mode itself.
 */
export function CardThemeScope({
  themeId,
  mode,
  brandColor,
  asPage = false,
  className,
  children,
}: {
  themeId: string;
  mode: ResolvedCardMode;
  brandColor?: string | null;
  asPage?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const theme = normalizeCardTheme(themeId);

  return (
    <div
      data-card-theme={theme}
      data-card-mode={asPage ? undefined : mode}
      data-card-scope={asPage ? "page" : "preview"}
      style={{ "--brand": brandColor || DEFAULT_BRAND_COLOR } as React.CSSProperties}
      className={className}
    >
      {/*
        The size-container element must NOT be the same element the
        @container rules style: every theme's base rule sets max-width
        unconditionally (e.g. .pe-og { max-width: 422px }), and the 640px/900px
        tiers conditionally override that SAME property on that SAME element.
        A size container querying its own inline-size while a rule inside the
        query also sets that element's inline-size is a self-reference the
        container-queries spec has browsers resolve inconsistently — observed
        in practice as the 900px desktop tier losing to the 640px tablet tier
        even in a 1440px viewport. Splitting them — [data-card-theme] carries
        container-type, the .pe-* class lives one level down — makes every
        `@container card (...) { .pe-og { ... } }` rule target a genuine
        descendant of the container, removing the ambiguity entirely.
      */}
      <div className={cardThemeRootClass(theme)}>{children}</div>
    </div>
  );
}
