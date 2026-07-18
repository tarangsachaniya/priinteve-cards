"use client";

import { cn } from "@/lib/utils";

const LAYOUTS: { id: string; name: string }[] = [
  { id: "grid", name: "Grid" },
  { id: "carousel", name: "Carousel" },
  { id: "masonry", name: "Masonry" },
  { id: "lightbox", name: "Lightbox" },
];

function LayoutPreview({ id }: { id: string }) {
  if (id === "carousel") {
    return (
      <div className="flex gap-1 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-8 w-8 shrink-0 animate-pulse rounded bg-foreground/20"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    );
  }
  if (id === "masonry") {
    return (
      <div className="grid grid-cols-2 gap-1">
        <div className="h-10 animate-pulse rounded bg-foreground/20" />
        <div className="h-6 animate-pulse rounded bg-foreground/20" style={{ animationDelay: "150ms" }} />
        <div className="h-6 animate-pulse rounded bg-foreground/20" style={{ animationDelay: "300ms" }} />
        <div className="h-10 animate-pulse rounded bg-foreground/20" style={{ animationDelay: "450ms" }} />
      </div>
    );
  }
  if (id === "lightbox") {
    return (
      <div className="flex flex-col gap-1">
        <div className="h-8 animate-pulse rounded bg-foreground/25" />
        <div className="grid grid-cols-3 gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 animate-pulse rounded bg-foreground/15" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-foreground/20"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

export function GalleryLayoutPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {LAYOUTS.map((layout) => (
        <button
          key={layout.id}
          type="button"
          onClick={() => onChange(layout.id)}
          className={cn(
            "flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-primary/50",
            value === layout.id && "border-primary ring-2 ring-primary"
          )}
        >
          <div className="rounded-lg bg-muted/50 p-2">
            <LayoutPreview id={layout.id} />
          </div>
          <span className="text-sm font-medium">{layout.name}</span>
        </button>
      ))}
    </div>
  );
}
