"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ShareButton({
  variant = "default",
  className,
  label = "Share",
}: {
  /** `unstyled` renders a bare button so a card theme can supply its own class. */
  variant?: "default" | "dock" | "unstyled";
  className?: string;
  label?: string;
}) {
  async function handleClick() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Couldn't copy link. Please try again.");
    }
  }

  if (variant === "unstyled") {
    return (
      <button type="button" onClick={handleClick} className={className}>
        <Share2 aria-hidden />
        {label}
      </button>
    );
  }

  if (variant === "dock") {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="outline" size="icon" onClick={handleClick} aria-label="Share">
              <Share2 className="size-4" />
            </Button>
          }
        />
        <TooltipContent>Share</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button variant="outline" onClick={handleClick}>
      <Share2 className="size-4" />
      Share
    </Button>
  );
}
