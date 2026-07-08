import { SmartphoneIcon } from "lucide-react";

import { ProductHero } from "@/components/marketing/product-hero";

export const revalidate = 3600;

export default function NfcCardPage() {
  return (
    <ProductHero
      icon={SmartphoneIcon}
      eyebrow="Physical card"
      title="NFC Card"
      description="A premium physical card with a built-in NFC chip. Tap it against any modern smartphone to instantly share your digital business card — no app, no typing."
      bullets={[
        "Works with iPhone and Android out of the box",
        "Durable, professionally printed card",
        "Update your card anytime — the tap always shows the latest version",
      ]}
    />
  );
}
