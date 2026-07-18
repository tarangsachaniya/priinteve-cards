"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ThemePreset } from "@/lib/theme-presets";

export function ThemePresetCard({
  preset,
  isSelected,
  onSelect,
}: {
  preset: ThemePreset;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50",
        isSelected && "border-primary ring-2 ring-primary"
      )}
    >
      {isSelected && (
        <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-ink">
          <Check className="size-3" />
        </span>
      )}
      <div
        className={cn(
          "flex w-full flex-col rounded-lg bg-muted/50 p-3",
          preset.fontFamily,
          preset.layout === "centered" && "items-center text-center",
          preset.layout === "split" && "items-start text-left",
          preset.layout === "banner" && "items-start text-left",
          preset.layout === "minimal" && "items-center text-center",
          preset.spacing === "compact" && "gap-1",
          preset.spacing === "cozy" && "gap-1.5",
          preset.spacing === "spacious" && "gap-2.5"
        )}
      >
        <div className="size-8 rounded-full bg-foreground/20" />
        <div className="h-2 w-16 rounded bg-foreground/30" />
        <div className="h-1.5 w-10 rounded bg-foreground/15" />
      </div>
      <span className="text-sm font-medium">{preset.name}</span>
    </button>
  );
}
