"use client";

import { useState } from "react";
import { Laptop, Moon, Smartphone, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PublicCard, type PublicCardData } from "@/components/card/public-card";

export function LivePreviewPane({ data }: { data: PublicCardData }) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [scheme, setScheme] = useState<"light" | "dark">("light");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">Live preview</p>
        <div className="flex items-center gap-1">
          <div className="flex rounded-lg border p-0.5">
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
          <div className="flex rounded-lg border p-0.5">
            <Button
              type="button"
              size="icon-sm"
              variant={scheme === "light" ? "secondary" : "ghost"}
              onClick={() => setScheme("light")}
              aria-label="Light preview"
            >
              <Sun />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant={scheme === "dark" ? "secondary" : "ghost"}
              onClick={() => setScheme("dark")}
              aria-label="Dark preview"
            >
              <Moon />
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "overflow-y-auto rounded-2xl border bg-muted/30 p-4 shadow-inner transition-all",
          device === "mobile" ? "max-h-[calc(100vh-11rem)]" : "max-h-[calc(100vh-11rem)]"
        )}
      >
        <div
          className={cn(
            scheme === "dark" && "dark",
            "mx-auto rounded-xl bg-background transition-all",
            device === "mobile" ? "max-w-[380px]" : "max-w-full"
          )}
        >
          <PublicCard data={data} />
        </div>
      </div>
    </div>
  );
}
