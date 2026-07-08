"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CardPreviewStub, type CardPreviewData } from "@/components/card/card-preview-stub";

export function Step5PreviewPurchase({ data }: { data: CardPreviewData }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Preview your card</h2>
        <p className="text-sm text-muted-foreground">
          This is how your card will look. Choose a plan to publish it.
        </p>
      </div>

      <div className="mx-auto w-full max-w-sm">
        <CardPreviewStub data={data} />
      </div>

      <Button
        type="button"
        nativeButton={false}
        render={<Link href="/dashboard/plans" />}
        className="self-center"
      >
        Choose Plan
      </Button>
    </div>
  );
}
