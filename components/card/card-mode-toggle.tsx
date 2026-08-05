"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { cardModeStorageKey, type ResolvedCardMode } from "@/lib/card-theme";

/**
 * Lets a visitor override the owner's light/dark default. The choice is
 * remembered per card, so preferring dark on one card does not force dark onto
 * every other card the visitor opens.
 *
 * Switching flips the attribute on <html> directly — every token is a CSS
 * custom property keyed off that attribute, so the whole card repaints
 * instantly with no re-render and no reload.
 */
export function CardModeToggle({ slug, ownerMode }: { slug: string; ownerMode: string }) {
  // Rendered only after mount: the true mode lives in <html> (set pre-paint by
  // CardModeScript), which the server cannot know, so rendering an icon during
  // SSR would guarantee a hydration mismatch and a wrong icon on first paint.
  const [mode, setMode] = useState<ResolvedCardMode | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-card-mode");
    setMode(current === "dark" ? "dark" : "light");
  }, []);

  // With the owner on "system" and no stored override, keep following the OS.
  useEffect(() => {
    if (ownerMode !== "system") return;
    if (typeof window.matchMedia !== "function") return;
    if (localStorage.getItem(cardModeStorageKey(slug))) return;

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => {
      const next: ResolvedCardMode = event.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-card-mode", next);
      setMode(next);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [ownerMode, slug]);

  if (mode === null) return null;

  const next: ResolvedCardMode = mode === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="pe-mode-toggle"
      aria-label={`Switch to ${next} mode`}
      aria-pressed={mode === "dark"}
      onClick={() => {
        document.documentElement.setAttribute("data-card-mode", next);
        try {
          localStorage.setItem(cardModeStorageKey(slug), next);
        } catch {
          // Private mode / storage disabled — the switch still applies for this
          // page view, it just won't be remembered.
        }
        setMode(next);
      }}
    >
      {mode === "dark" ? <Moon aria-hidden /> : <Sun aria-hidden />}
    </button>
  );
}
