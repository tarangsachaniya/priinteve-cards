"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import type { PricingResult } from "@/lib/wallet";

type CheckoutSummaryProps = {
  plan: { id: string; name: string; price: number; validityDays: number };
  pricingNoWallet: PricingResult;
  pricingWithWallet: PricingResult;
};

export function CheckoutSummary({ plan, pricingNoWallet, pricingWithWallet }: CheckoutSummaryProps) {
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

      // MOCK-ONLY: with a real gateway this confirm call comes from the
      // gateway's server-to-server webhook, not the browser. Simulated
      // here since no real gateway is wired up yet.
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

      toast.success("Payment successful! Your card is now live.");
      router.push("/dashboard");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {pricingWithWallet.walletEligible && (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={useWallet}
            onCheckedChange={(checked) => setUseWallet(checked)}
          />
          <Label className="cursor-pointer font-normal">
            Use wallet credit (₹{pricingWithWallet.walletInr} available)
          </Label>
        </label>
      )}

      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Plan price</TableCell>
            <TableCell className="text-right">₹{plan.price}</TableCell>
          </TableRow>
          {useWallet && pricing.walletInr > 0 && (
            <TableRow>
              <TableCell>Wallet discount</TableCell>
              <TableCell className="text-right">-₹{pricing.walletInr}</TableCell>
            </TableRow>
          )}
          <TableRow>
            <TableCell className="font-medium">Total due</TableCell>
            <TableCell className="text-right font-medium">₹{pricing.amountDue}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Button onClick={handlePay} disabled={isProcessing}>
        {isProcessing ? "Processing…" : "Proceed to Pay"}
      </Button>
    </div>
  );
}
