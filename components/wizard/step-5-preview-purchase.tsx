"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export function Step5PreviewPurchase() {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div>
        <h2 className="text-lg font-semibold">Your card is ready</h2>
        <p className="text-sm text-muted-foreground">
          Check the live preview alongside this page, then choose a plan to publish it.
        </p>
      </div>

      <Button type="button" render={<Link href="/plans" />}>
        Choose plan
      </Button>
    </div>
  );
}
