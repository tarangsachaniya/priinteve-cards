"use client";

import { useState } from "react";
import { Laptop, Smartphone } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PublicCard, type PublicCardData } from "@/components/card/public-card";

export function LivePreviewPane({ data }: { data: PublicCardData }) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">Live preview</p>
        <div className="flex rounded-full border border-border p-0.5">
          <Button
            type="button"
            size="icon-sm"
            variant={device === "mobile" ? "secondary" : "ghost"}
            onClick={() => setDevice("mobile")}
            aria-label="Mobile preview"
          >
            <Smartphone />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant={device === "desktop" ? "secondary" : "ghost"}
            onClick={() => setDevice("desktop")}
            aria-label="Desktop preview"
          >
            <Laptop />
          </Button>
        </div>
      </div>

      <div className="max-h-[calc(100vh-11rem)] overflow-y-auto rounded-2xl border border-border bg-muted/30 p-4 shadow-inner">
        <div className={cn("mx-auto rounded-2xl bg-background", device === "mobile" ? "max-w-[380px]" : "max-w-full")}>
          <PublicCard data={data} />
        </div>
      </div>
    </div>
  );
}
