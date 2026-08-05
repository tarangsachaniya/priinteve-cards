"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INSERTABLE_SECTION_TYPES, getFieldTypeMeta } from "@/lib/field-types";

/**
 * Inline expandable panel rather than a floating popover — a popover anchored
 * to this button (which sits at the bottom of a long, scrollable tab) has to
 * flip above its trigger whenever there isn't room below the viewport, which
 * reads as the menu unpredictably "jumping" open. Rendering inline in normal
 * document flow instead means it only ever pushes content down, never flips.
 */
export function InsertSectionMenu({
  onInsert,
  excludeTypes,
}: {
  onInsert: (fieldType: string) => void;
  excludeTypes?: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const types = (
    excludeTypes ? INSERTABLE_SECTION_TYPES.filter((type) => !excludeTypes.includes(type)) : INSERTABLE_SECTION_TYPES
  ).filter((type) => getFieldTypeMeta(type).label.toLowerCase().includes(search.toLowerCase()));

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add section
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Add a section</p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            setOpen(false);
            setSearch("");
          }}
          aria-label="Close"
        >
          <X />
        </Button>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search section types…"
        autoFocus
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {types.length === 0 && (
          <p className="col-span-full py-4 text-center text-sm text-muted-foreground">No matching section type.</p>
        )}
        {types.map((type) => {
          const meta = getFieldTypeMeta(type);
          const Icon = meta.icon;
          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                onInsert(type);
                setOpen(false);
                setSearch("");
              }}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background p-3 text-center text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
            >
              <Icon className="size-4 text-muted-foreground" />
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
