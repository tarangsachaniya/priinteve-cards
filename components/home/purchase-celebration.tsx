"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PartyPopper } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PurchaseCelebration() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("purchased") === "1") {
      setOpen(true);
      router.replace("/", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader className="items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-ink">
            <PartyPopper className="size-6" />
          </span>
          <DialogTitle className="text-lg">Congratulations!</DialogTitle>
          <DialogDescription>Your digital business profile is ready.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button className="w-full" render={<Link href="/dashboard" />}>
            Go to dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
