"use client";

import { useState } from "react";
import Link from "next/link";
import { Monitor, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardPreviewStub, type CardPreviewData } from "@/components/card/card-preview-stub";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { cn } from "@/lib/utils";

export function Step5PreviewPurchase({ data }: { data: CardPreviewData }) {
  const isMobile = useIsMobile();
  const [view, setView] = useState<"mobile" | "web">("mobile");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Preview your card</h2>
          <p className="text-sm text-muted-foreground">
            This is how your card will look. Choose a plan to publish it.
          </p>
        </div>

        {!isMobile && (
          <Tabs value={view} onValueChange={(v) => v && setView(v as "mobile" | "web")}>
            <TabsList>
              <TabsTrigger value="mobile">
                <Smartphone data-icon="inline-start" />
                Mobile
              </TabsTrigger>
              <TabsTrigger value="web">
                <Monitor data-icon="inline-start" />
                Web
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      <div className={cn("mx-auto w-full transition-all", isMobile || view === "mobile" ? "max-w-sm" : "max-w-2xl")}>
        <CardPreviewStub data={data} />
      </div>

      <Button type="button" render={<Link href="/plans" />} className="self-center">
        Choose plan
      </Button>
    </div>
  );
}
