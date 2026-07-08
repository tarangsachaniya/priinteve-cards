import { LayersIcon } from "lucide-react";

import { ProductHero } from "@/components/marketing/product-hero";

export const revalidate = 3600;

export default function NfcAndQrPage() {
  return (
    <ProductHero
      icon={LayersIcon}
      eyebrow="Best value"
      title="NFC + QR Combo"
      description="Get the best of both worlds: a tappable NFC card for quick in-person exchanges, plus a QR code for sharing your profile anywhere a tap isn't possible."
      bullets={[
        "One card, two ways to share",
        "Backup QR code if NFC isn't supported on a device",
        "Best value for professionals who network often",
      ]}
    />
  );
}
