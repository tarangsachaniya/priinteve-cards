"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function SaveContactButton({ slug }: { slug: string }) {
  async function handleClick() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const vcfUrl = `/api/vcf/${slug}`;

    if (!isIOS) {
      window.location.href = vcfUrl;
      return;
    }

    try {
      const res = await fetch(vcfUrl);
      if (!res.ok) throw new Error("Failed to fetch VCF");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${slug}.vcf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("Couldn't save contact. Please try again.");
    }
  }

  return (
    <Button onClick={handleClick} style={{ backgroundColor: "var(--brand)" }}>
      <Download className="size-4" />
      Save to Contact
    </Button>
  );
}
