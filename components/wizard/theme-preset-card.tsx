"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ThemePreset } from "@/lib/theme-presets";
import type { ResolvedCardMode } from "@/lib/card-theme";

/**
 * Theme picker swatch. The mini preview is rendered inside a real
 * `data-card-theme`/`data-card-mode` scope, so it paints from the same tokens
 * as the live card — the swatch cannot drift from the theme it advertises.
 */
export function ThemePresetCard({
  preset,
  mode,
  brandColor,
  isSelected,
  onSelect,
}: {
  preset: ThemePreset;
  mode: ResolvedCardMode;
  brandColor?: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={cn(
        "relative flex flex-col items-stretch gap-2 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50",
        isSelected && "border-primary ring-2 ring-primary"
      )}
    >
      {isSelected && (
        <span className="absolute right-2 top-2 z-10 flex size-5 items-center justify-center rounded-full bg-primary text-ink">
          <Check className="size-3" />
        </span>
      )}

      <span
        data-card-theme={preset.id}
        data-card-mode={mode}
        style={{ "--brand": brandColor } as React.CSSProperties}
        className="flex h-24 w-full flex-col gap-1.5 overflow-hidden rounded-lg p-2.5"
      >
        {preset.id === "original" && (
          <>
            <span className="h-6 w-full rounded" style={{ background: "var(--card-banner)" }} />
            <span className="-mt-4 ml-1 size-6 rounded-full border-2" style={{ borderColor: "var(--card-surface)", background: "var(--card-ph-to)" }} />
            <span className="h-1.5 w-2/3 rounded" style={{ background: "var(--card-text)" }} />
            <span className="mt-auto flex gap-1.5">
              <span className="h-5 flex-1 rounded" style={{ background: "var(--card-surface-muted)" }} />
              <span className="h-5 flex-1 rounded" style={{ background: "var(--card-surface-muted)" }} />
            </span>
          </>
        )}

        {preset.id === "bento" && (
          <>
            <span className="h-8 w-full rounded-md" style={{ background: "var(--card-ph-to)" }} />
            <span className="grid flex-1 grid-cols-2 gap-1.5">
              <span className="rounded-md" style={{ background: "var(--card-surface)", boxShadow: "var(--card-shadow-tile)" }} />
              <span className="rounded-md" style={{ background: "var(--card-primary)" }} />
              <span className="rounded-md" style={{ background: "var(--card-surface)", boxShadow: "var(--card-shadow-tile)" }} />
              <span className="rounded-md" style={{ background: "var(--card-surface)", boxShadow: "var(--card-shadow-tile)" }} />
            </span>
          </>
        )}

        {preset.id === "editorial" && (
          <>
            <span className="mx-auto size-8 rounded-full" style={{ background: "var(--card-ph-to)", boxShadow: `0 0 14px var(--card-glow)` }} />
            <span className="mx-auto h-2 w-1/2 rounded" style={{ background: "var(--card-text)" }} />
            <span className="mx-auto h-1 w-1/3 rounded" style={{ background: "var(--card-text-muted)" }} />
            <span className="mt-auto flex items-center gap-1.5">
              <span className="h-1 w-3 rounded" style={{ background: "var(--card-primary)" }} />
              <span className="h-4 flex-1 rounded" style={{ background: "var(--card-surface-muted)" }} />
            </span>
          </>
        )}
      </span>

      <span className="text-sm font-medium">{preset.name}</span>
    </button>
  );
}
