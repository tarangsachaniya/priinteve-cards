import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";

import { db } from "@/lib/db";
import { generateQrPngBuffer } from "@/lib/qr";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { getTableOrderUrl } from "@/lib/restaurant/qr";

export const runtime = "nodejs";

/**
 * A print-ready A4 sheet of every active table's QR code, four per page —
 * cut them out and stand one on each table. Same pdfkit approach as
 * app/api/qr/[slug]/pdf/route.ts.
 */
export async function GET() {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const restaurant = await db.restaurant.findUnique({
    where: { id: auth.session.restaurantId },
    select: { name: true, slug: true },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const tables = await db.restaurantTable.findMany({
    where: { restaurantId: auth.session.restaurantId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (tables.length === 0) {
    return NextResponse.json({ error: "No active tables to print" }, { status: 400 });
  }

  const doc = new PDFDocument({ size: "A4", margin: 36 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 36;
  const cellWidth = (pageWidth - margin * 2) / 2;
  const cellHeight = (pageHeight - margin * 2) / 2;
  const qrSize = 170;

  for (let index = 0; index < tables.length; index += 1) {
    const table = tables[index];
    const positionOnPage = index % 4;

    if (index > 0 && positionOnPage === 0) {
      doc.addPage();
    }

    const column = positionOnPage % 2;
    const row = Math.floor(positionOnPage / 2);
    const cellX = margin + column * cellWidth;
    const cellY = margin + row * cellHeight;

    const url = getTableOrderUrl(restaurant.slug, table.code);
    const qrBuffer = await generateQrPngBuffer(url);

    doc
      .roundedRect(cellX + 8, cellY + 8, cellWidth - 16, cellHeight - 16, 12)
      .lineWidth(1)
      .strokeColor("#DDDDDD")
      .stroke();

    doc
      .fillColor("#111111")
      .fontSize(16)
      .text(restaurant.name, cellX + 16, cellY + 28, {
        width: cellWidth - 32,
        align: "center",
      });

    doc
      .fillColor("#666666")
      .fontSize(10)
      .text("Scan to view the menu and order", cellX + 16, cellY + 50, {
        width: cellWidth - 32,
        align: "center",
      });

    doc.image(qrBuffer, cellX + (cellWidth - qrSize) / 2, cellY + 72, {
      width: qrSize,
      height: qrSize,
    });

    doc
      .fillColor("#111111")
      .fontSize(20)
      .text(table.label, cellX + 16, cellY + 72 + qrSize + 12, {
        width: cellWidth - 32,
        align: "center",
      });

    doc
      .fillColor("#999999")
      .fontSize(8)
      .text(url, cellX + 16, cellY + 72 + qrSize + 38, {
        width: cellWidth - 32,
        align: "center",
      });
  }

  doc.end();
  const pdfBuffer = await done;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${restaurant.slug}-table-qr-codes.pdf"`,
    },
  });
}
