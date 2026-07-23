"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatLocalPrice, type DisplayCurrency } from "@/lib/currency-format";
import type { PricingResult } from "@/lib/wallet";

type CheckoutSummaryProps = {
  plan: { id: string; name: string; price: number; validityDays: number };
  pricingNoWallet: PricingResult;
  pricingWithWallet: PricingResult;
  currency: DisplayCurrency;
};

export function CheckoutSummary({ plan, pricingNoWallet, pricingWithWallet, currency }: CheckoutSummaryProps) {
  const router = useRouter();
  const [useWallet, setUseWallet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const pricing = useWallet ? pricingWithWallet : pricingNoWallet;

  async function handlePay() {
    setIsProcessing(true);
    try {
      const initiateRes = await fetch("/api/purchase/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, useWallet }),
      });
      const initiateData = await initiateRes.json().catch(() => ({}));
      if (!initiateRes.ok) {
        toast.error(typeof initiateData.error === "string" ? initiateData.error : "Could not start payment");
        return;
      }

      const confirmRes = await fetch("/api/purchase/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gatewayOrderId: initiateData.gatewayOrderId }),
      });
      const confirmData = await confirmRes.json().catch(() => ({}));
      if (!confirmRes.ok) {
        toast.error(typeof confirmData.error === "string" ? confirmData.error : "Payment failed");
        return;
      }

      // The purchase confirm route can't safely refresh the browser's
      // session (it's written to also accept real gateway webhooks, which
      // aren't the customer's browser) so the client refreshes it here.
      await fetch("/api/auth/refresh-session", { method: "POST" });

      toast.success("Payment successful! Your card is now live.");
      router.push("/?purchased=1");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Card className="mt-6 border-border/80">
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="font-semibold">{plan.name}</p>
          </div>
          <p className="text-sm text-muted-foreground">{plan.validityDays} days</p>
        </div>

        {pricingWithWallet.walletEligible && (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-3.5 py-3">
            <Checkbox checked={useWallet} onCheckedChange={(checked) => setUseWallet(checked)} />
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-ink">
              <Wallet className="size-4" />
            </span>
            <Label className="flex-1 cursor-pointer font-normal">
              Use wallet credit
              <span className="block text-xs text-muted-foreground">
                {formatLocalPrice(pricingWithWallet.walletInr, currency)} available
              </span>
            </Label>
          </label>
        )}

        <div className="flex flex-col gap-2.5 border-t border-border/70 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Plan price</span>
            <span>{formatLocalPrice(plan.price, currency)}</span>
          </div>
          {useWallet && pricing.walletInr > 0 && (
            <div className="flex items-center justify-between text-ink">
              <span>Wallet discount</span>
              <span>-{formatLocalPrice(pricing.walletInr, currency)}</span>
            </div>
          )}
          <div className="mt-1 flex items-center justify-between rounded-xl bg-primary/10 px-3.5 py-3">
            <span className="font-semibold">Total due</span>
            <span className="text-xl font-bold">{formatLocalPrice(pricing.amountDue, currency)}</span>
          </div>
        </div>

        <Button size="lg" onClick={handlePay} disabled={isProcessing} className="w-full">
          {isProcessing ? "Processing…" : "Proceed to pay"}
        </Button>
      </CardContent>
    </Card>
  );
}
