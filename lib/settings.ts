import { db } from "@/lib/db";

const DEFAULTS = {
  wallet_conversion_rate: 100,
  wallet_min_redeem_points: 500,
  referral_points_per_referral: 100,
} as const;

type SettingKey = keyof typeof DEFAULTS;

export async function getSetting(key: SettingKey): Promise<number> {
  const row = await db.settings.findUnique({ where: { key } });
  const raw = row?.value ?? String(DEFAULTS[key]);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : DEFAULTS[key];
}

export async function getWalletSettings() {
  const [conversionRate, minRedeemPoints] = await Promise.all([
    getSetting("wallet_conversion_rate"),
    getSetting("wallet_min_redeem_points"),
  ]);
  return { conversionRate, minRedeemPoints };
}

export async function getReferralSettings() {
  const pointsPerReferral = await getSetting("referral_points_per_referral");
  return { pointsPerReferral };
}

export async function getReferralConfig() {
  const [pointsPerReferral, conversionRate, minimumRedemption] = await Promise.all([
    getSetting("referral_points_per_referral"),
    getSetting("wallet_conversion_rate"),
    getSetting("wallet_min_redeem_points"),
  ]);
  return { pointsPerReferral, conversionRate, minimumRedemption };
}
