import { QrCodeIcon } from "lucide-react";

import { ProductHero } from "@/components/marketing/product-hero";

export const revalidate = 3600;

export default function QrCodePage() {
  return (
    <ProductHero
      icon={QrCodeIcon}
      eyebrow="Print anywhere"
      title="QR Code"
      description="A unique QR code linked to your digital card. Print it on a card, sticker, or slide — anyone with a phone camera can scan it to view your profile instantly."
      bullets={[
        "Downloadable as PNG or print-ready PDF",
        "No physical card required",
        "Works anywhere you can display an image",
      ]}
    />
  );
}
