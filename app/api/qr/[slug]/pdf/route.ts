import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";

import { db } from "@/lib/db";
import { generateQrPngBuffer, getCardUrl } from "@/lib/qr";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const user = await db.user.findUnique({
    where: { slug: params.slug },
    select: { slug: true, name: true, cardPublished: true },
  });

  if (!user || !user.cardPublished) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cardUrl = getCardUrl(user.slug);
  const qrBuffer = await generateQrPngBuffer(cardUrl);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#ffffff");

  const qrSize = 260;
  const qrX = (doc.page.width - qrSize) / 2;
  const qrY = 150;
  doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

  doc
    .fillColor("#000000")
    .fontSize(20)
    .text(user.name ?? user.slug, 0, qrY + qrSize + 30, { align: "center" });

  doc
    .fillColor("#555555")
    .fontSize(12)
    .text(cardUrl, 0, qrY + qrSize + 60, { align: "center" });

  doc.end();

  const pdfBuffer = await done;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${user.slug}-qr.pdf"`,
    },
  });
}
