"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Smartphone, Sun } from "lucide-react";

import { ThemeCard, type ThemeCardData } from "@/components/card/theme-card";
import { cn } from "@/lib/utils";
import { normalizeCardMode, resolveCardModeForRender, type ResolvedCardMode } from "@/lib/card-theme";

type Device = "mobile" | "desktop";

/**
 * Live card preview with device and light/dark toggles. Shared by the dashboard
 * Preview page and the setup wizard so both always show the same rendering of a
 * card.
 *
 * The light/dark toggle previews only — it never writes the owner's setting.
 * It does follow the saved default, so switching "Default appearance" in the
 * editor flips the preview with it.
 */
export function CardPreviewPanel({
  data,
  className,
  defaultDevice = "mobile",
}: {
  data: ThemeCardData;
  className?: string;
  defaultDevice?: Device;
}) {
  const [device, setDevice] = useState<Device>(defaultDevice);
  const savedMode = resolveCardModeForRender(normalizeCardMode(data.settings.themeMode));
  const [previewMode, setPreviewMode] = useState<ResolvedCardMode>(savedMode);

  useEffect(() => {
    setPreviewMode(savedMode);
  }, [savedMode]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div
          role="radiogroup"
          aria-label="Preview device"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background p-1"
        >
          {(
            [
              { value: "mobile", label: "Mobile", icon: Smartphone },
              { value: "desktop", label: "Desktop", icon: Monitor },
            ] as const
          ).map((option) => {
            const isSelected = device === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setDevice(option.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  isSelected ? "bg-primary text-ink shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <option.icon className="size-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>

        <div
          role="radiogroup"
          aria-label="Preview appearance"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background p-1"
        >
          {(
            [
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
            ] as const
          ).map((option) => {
            const isSelected = previewMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setPreviewMode(option.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  isSelected ? "bg-primary text-ink shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <option.icon className="size-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/*
        The themes reflow on a *container* query at 900px, so the desktop
        preview must give the card at least that much width — the panel itself
        is narrower than that. Desktop therefore renders at a fixed 1100px and
        is zoomed down to fit, which shows the true desktop layout instead of a
        stretched mobile one. `zoom` rather than `transform: scale` because zoom
        affects layout, so the wrapper collapses to the scaled height instead of
        reserving the full 1100px-wide card's height as empty space.
      */}
      <div className={cn("mx-auto w-full", device === "mobile" && "max-w-[380px]")}>
        {device === "mobile" ? (
          <ThemeCard data={data} modeOverride={previewMode} />
        ) : (
          <div className="w-[1100px] [zoom:0.36] sm:[zoom:0.5] lg:[zoom:0.62]">
            <ThemeCard data={data} modeOverride={previewMode} />
          </div>
        )}
      </div>
    </div>
  );
}
