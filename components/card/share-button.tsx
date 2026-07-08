"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ShareButton() {
  async function handleClick() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Couldn't copy link. Please try again.");
    }
  }

  return (
    <Button variant="outline" onClick={handleClick}>
      <Share2 className="size-4" />
      Share
    </Button>
  );
}
