"use client";

import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";

import { ThemeCard, type ThemeCardData } from "@/components/card/theme-card";
import { cn } from "@/lib/utils";

type Device = "mobile" | "desktop";

/**
 * Live card preview with a device toggle. Shared by the dashboard Preview page
 * and the setup wizard so both always show the same rendering of a card.
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

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex justify-center">
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
      </div>

      <div
        className={cn(
          "mx-auto w-full transition-all duration-300",
          device === "mobile" ? "max-w-[380px]" : "max-w-2xl"
        )}
      >
        <ThemeCard data={data} />
      </div>
    </div>
  );
}
