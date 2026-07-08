import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { isPastGracePeriod } from "@/lib/card-expiry";
import { generateVcf } from "@/lib/vcf";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const user = await db.user.findUnique({
    where: { slug: params.slug },
    include: {
      cardFields: { where: { isVisible: true } },
      cardSettings: true,
    },
  });

  if (!user || !user.cardPublished) {
    return new NextResponse(null, { status: 404 });
  }

  if (isPastGracePeriod(user.planExpiresAt)) {
    return new NextResponse(null, { status: 404 });
  }

  const photoField = user.cardFields.find((f) => f.fieldType === "photo");
  const includePhoto = user.cardSettings?.vcfIncludePhoto !== false;

  let photoBase64: string | null = null;
  let photoMimeType: string | null = null;

  if (includePhoto && photoField?.value) {
    try {
      const res = await fetch(photoField.value);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        photoBase64 = Buffer.from(buf).toString("base64");
        const contentType = res.headers.get("content-type") ?? "image/jpeg";
        photoMimeType = contentType.split("/")[1]?.toUpperCase() ?? "JPEG";
      }
    } catch {
      // Photo fetch failed — VCF still generates without it.
    }
  }

  const vcf = generateVcf({
    name: user.name ?? params.slug,
    fields: user.cardFields
      .filter((f) => f.fieldType !== "photo")
      .map((f) => ({ fieldType: f.fieldType, value: f.value })),
    photoBase64,
    photoMimeType,
  });

  return new NextResponse(vcf, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${params.slug}.vcf"`,
    },
  });
}
