"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { CARD_MODE_OPTIONS, type CardMode } from "@/lib/card-theme";

const MODE_ICON = { light: Sun, dark: Moon, system: Monitor } as const;

/**
 * The owner's light/dark default for their public card. Visitors can still
 * override it per card with the on-card toggle — this sets what they see first.
 */
export function CardModePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: CardMode) => void;
}) {
  const active = CARD_MODE_OPTIONS.find((option) => option.id === value) ?? CARD_MODE_OPTIONS[0];

  return (
    <div className="flex flex-col gap-2">
      <div role="radiogroup" aria-label="Default appearance" className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-background p-1">
        {CARD_MODE_OPTIONS.map((option) => {
          const Icon = MODE_ICON[option.id];
          const isSelected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isSelected ? "bg-primary text-ink shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{active.description}</p>
    </div>
  );
}
