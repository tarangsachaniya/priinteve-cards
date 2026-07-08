"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyReferralLinkButton({ link }: { link: string }) {
  async function handleClick() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Referral link copied to clipboard!");
    } catch {
      toast.error("Couldn't copy link. Please try again.");
    }
  }

  return (
    <Button variant="outline" onClick={handleClick}>
      <Copy className="size-4" />
      Copy link
    </Button>
  );
}
