import { cardModeStorageKey, normalizeCardMode, normalizeCardTheme } from "@/lib/card-theme";

/**
 * Applies the theme and the visitor's remembered mode to <html> before the card
 * markup below it is parsed, so a card whose owner defaults to light never
 * flashes light for a visitor who chose dark.
 *
 * Must be rendered as the FIRST child of the public card page: inline scripts
 * block parsing and run synchronously, so nothing has painted yet when it runs.
 * It must not reference anything from the bundle — /[slug] is statically
 * rendered and this executes long before hydration.
 *
 * Precedence mirrors resolveCardMode in lib/card-theme.ts:
 *   visitor override (localStorage, per card) > owner default > system query
 */
export function CardModeScript({
  slug,
  themeId,
  ownerMode,
}: {
  slug: string;
  themeId: string;
  ownerMode: string;
}) {
  const mode = normalizeCardMode(ownerMode);
  const theme = normalizeCardTheme(themeId);
  const key = cardModeStorageKey(slug);

  const script = [
    "(function(){try{",
    "var r=document.documentElement;",
    `r.setAttribute("data-card-theme",${JSON.stringify(theme)});`,
    `var s=localStorage.getItem(${JSON.stringify(key)});`,
    'var m=(s==="light"||s==="dark")?s:',
    `(${JSON.stringify(mode)}==="system"`,
    '?(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")',
    `:${JSON.stringify(mode === "dark" ? "dark" : "light")});`,
    'r.setAttribute("data-card-mode",m);',
    "}catch(e){}})();",
  ].join("");

  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: script }} />;
}
