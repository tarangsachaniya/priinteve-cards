import { getWalletSettings } from "@/lib/settings";

export type PricingInput = {
  planPrice: number;
  walletPoints: number;
  useWallet: boolean;
};

export type PricingResult = {
  walletEligible: boolean;
  walletInr: number;
  walletPointsUsed: number;
  amountDue: number;
  conversionRate: number;
  minRedeemPoints: number;
};

export async function computePricing(input: PricingInput): Promise<PricingResult> {
  const { conversionRate, minRedeemPoints } = await getWalletSettings();
  const walletEligible = input.walletPoints >= minRedeemPoints;
  const applyWallet = input.useWallet && walletEligible;

  const rawWalletInr = applyWallet ? Math.floor(input.walletPoints / conversionRate) : 0;
  const walletInr = Math.min(rawWalletInr, input.planPrice);
  const amountDue = Math.max(input.planPrice - walletInr, 0);
  const walletPointsUsed = applyWallet ? Math.min(input.walletPoints, walletInr * conversionRate) : 0;

  return {
    walletEligible,
    walletInr,
    walletPointsUsed,
    amountDue,
    conversionRate,
    minRedeemPoints,
  };
}
