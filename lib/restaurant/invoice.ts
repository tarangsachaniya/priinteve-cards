import PDFDocument from "pdfkit";

import { describeGstinState, splitTax } from "@/lib/restaurant/gst";

/**
 * The downloadable bill, as a PDF.
 *
 * One builder, two callers: the guest downloading their own copy and the
 * restaurant reprinting one from the orders board. Sharing it is the point —
 * a customer's copy that differed from the restaurant's would be worthless in
 * the only situation either is ever used, which is a disagreement about what
 * was charged.
 *
 * The header changes with the restaurant's own details, not with a setting.
 * With a GSTIN it is a "Tax Invoice" and shows the CGST/SGST split; without
 * one it is a "Bill" and shows tax as a single line. A restaurant that isn't
 * registered must not hand out something that looks like a tax invoice, and
 * one that is shouldn't have to tick a box to get a valid one.
 *
 * Amounts are whole rupees everywhere in this module, so nothing here parses
 * or formats decimals except the totals column, which prints them for the sake
 * of looking like a bill.
 *
 * Known limitation: this uses pdfkit's built-in Helvetica, which can only
 * render WinAnsi (roughly Latin-1). A restaurant whose name, address or dish
 * names are written in Devanagari, Tamil or any non-Latin script will get
 * mangled glyphs on the PDF while every other screen shows them correctly.
 * Fixing that means embedding a Unicode TTF — see the note on RUPEE below,
 * which is the same problem in miniature.
 */

/**
 * "Rs." and not "₹", which is a deliberate exception to how money is written
 * everywhere else in this codebase.
 *
 * pdfkit's built-in Helvetica is a standard PDF font using WinAnsi encoding,
 * and WinAnsi has no rupee sign — U+20B9 was added to Unicode long after that
 * character set was fixed. Passing ₹ does not fail loudly; it silently prints
 * a superscript one, so every amount on every bill reads "¹525.00".
 *
 * The alternative is embedding a TTF that carries the glyph, which means
 * shipping a font binary in the repo for one character. A system font is not
 * an option: it would resolve on a developer's machine and vanish on the
 * Linux runtime this deploys to, which is the worst of the three outcomes.
 *
 * "Rs." is what most printed Indian bills use anyway.
 */
const RUPEE = "Rs.";

export type InvoiceRestaurant = {
  name: string;
  legalName: string | null;
  branch: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  fssaiLicence: string | null;
  taxPercent: number;
};

export type InvoiceOrder = {
  orderNumber: number;
  placedAt: Date;
  type: string;
  tableLabel: string | null;
  customerName: string;
  customerMobile: string;
  status: string;
  paymentStatus: string;
  paymentMode: string | null;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  total: number;
  items: {
    name: string;
    variantName: string | null;
    addOns: string[];
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
};

const ORDER_TYPE_LABEL: Record<string, string> = {
  DINE_IN: "Dine-in",
  TAKE_AWAY: "Take-away",
  DELIVERY: "Delivery",
};

const PAYMENT_MODE_LABEL: Record<string, string> = {
  ONLINE: "Online (card / UPI / netbanking)",
  COUNTER: "Cash at counter",
  UPI_QR: "UPI QR",
};

function money(amount: number): string {
  return `${RUPEE} ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "9 Aug 2026, 7:42 pm" in the restaurant's own timezone. */
function formatStamp(at: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(at);
}

/** The filename both routes hand back, so a guest and the counter agree. */
export function invoiceFilename(slug: string, orderNumber: number): string {
  return `${slug}-order-${orderNumber}.pdf`;
}

export async function buildInvoicePdf({
  restaurant,
  order,
  timezone,
}: {
  restaurant: InvoiceRestaurant;
  order: InvoiceOrder;
  timezone: string;
}): Promise<Buffer> {
  // A GSTIN is what makes this a tax document rather than a receipt. Nothing
  // else in the restaurant's settings changes that, and no toggle should.
  const isTaxInvoice = Boolean(restaurant.gstin);

  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const left = 48;
  const right = doc.page.width - 48;
  const width = right - left;

  // ─── Header: who is billing ───────────────────────────────────────────────
  doc
    .fillColor("#111111")
    .fontSize(18)
    .text(restaurant.legalName?.trim() || restaurant.name, left, 48, { width });

  // The trading name is repeated only when it differs, so the guest can tie
  // the registered entity on the bill back to the sign above the door.
  if (restaurant.legalName?.trim() && restaurant.legalName.trim() !== restaurant.name) {
    doc.fillColor("#666666").fontSize(10).text(`trading as ${restaurant.name}`, { width });
  }
  if (restaurant.branch) {
    doc.fillColor("#666666").fontSize(10).text(restaurant.branch, { width });
  }

  doc.moveDown(0.4);
  doc.fillColor("#444444").fontSize(9);

  if (restaurant.address) {
    doc.text(restaurant.address, { width: width * 0.62 });
  }

  const contact = [restaurant.phone, restaurant.email].filter(Boolean).join("  ·  ");
  if (contact) doc.text(contact, { width: width * 0.62 });

  if (restaurant.gstin) {
    const state = describeGstinState(restaurant.gstin);
    doc.text(`GSTIN: ${restaurant.gstin}`, { width: width * 0.62 });
    if (state) doc.text(`State: ${state}`, { width: width * 0.62 });
  }
  if (restaurant.fssaiLicence) {
    doc.text(`FSSAI Lic. No: ${restaurant.fssaiLicence}`, { width: width * 0.62 });
  }

  // ─── Title block, top-right ───────────────────────────────────────────────
  doc
    .fillColor("#111111")
    .fontSize(14)
    .text(isTaxInvoice ? "TAX INVOICE" : "BILL", left, 52, { width, align: "right" });

  doc
    .fillColor("#444444")
    .fontSize(9)
    .text(`Bill No: ${order.orderNumber}`, left, 74, { width, align: "right" })
    .text(formatStamp(order.placedAt, timezone), { width, align: "right" });

  const context = [
    ORDER_TYPE_LABEL[order.type] ?? order.type,
    order.tableLabel,
  ].filter(Boolean).join(" · ");
  doc.text(context, { width, align: "right" });

  // ─── Who is being billed ──────────────────────────────────────────────────
  const detailsY = Math.max(doc.y, 150) + 12;
  doc
    .moveTo(left, detailsY)
    .lineTo(right, detailsY)
    .lineWidth(0.5)
    .strokeColor("#DDDDDD")
    .stroke();

  doc.fillColor("#666666").fontSize(8).text("BILLED TO", left, detailsY + 10, { width });
  doc
    .fillColor("#111111")
    .fontSize(10)
    .text(order.customerName, left, doc.y + 2, { width })
    .fillColor("#444444")
    .fontSize(9)
    .text(order.customerMobile, { width });

  // ─── Items ────────────────────────────────────────────────────────────────
  const tableTop = doc.y + 16;
  const columns = {
    item: left,
    qty: left + width * 0.6,
    rate: left + width * 0.72,
    amount: left + width * 0.86,
  };
  const numberWidth = width * 0.14;

  doc.fillColor("#666666").fontSize(8);
  doc.text("ITEM", columns.item, tableTop, { width: width * 0.58 });
  doc.text("QTY", columns.qty, tableTop, { width: width * 0.1, align: "right" });
  doc.text("RATE", columns.rate, tableTop, { width: numberWidth, align: "right" });
  doc.text("AMOUNT", columns.amount, tableTop, { width: numberWidth, align: "right" });

  doc
    .moveTo(left, tableTop + 14)
    .lineTo(right, tableTop + 14)
    .lineWidth(0.5)
    .strokeColor("#DDDDDD")
    .stroke();

  let y = tableTop + 22;

  for (const item of order.items) {
    // A new page mid-table would otherwise write rows over the footer.
    if (y > doc.page.height - 200) {
      doc.addPage();
      y = 60;
    }

    doc.fillColor("#111111").fontSize(10).text(item.name, columns.item, y, { width: width * 0.56 });

    // The chosen size and extras sit under the dish rather than beside it:
    // they are what the guest picked, and a disputed bill is usually a dispute
    // about exactly these.
    const options = [item.variantName, ...item.addOns].filter(Boolean).join(", ");
    if (options) {
      doc
        .fillColor("#777777")
        .fontSize(8)
        .text(options, columns.item, doc.y, { width: width * 0.56 });
    }

    doc.fillColor("#444444").fontSize(10);
    doc.text(String(item.quantity), columns.qty, y, { width: width * 0.1, align: "right" });
    doc.text(money(item.unitPrice), columns.rate, y, { width: numberWidth, align: "right" });
    doc
      .fillColor("#111111")
      .text(money(item.lineTotal), columns.amount, y, { width: numberWidth, align: "right" });

    y = Math.max(doc.y, y + 14) + 8;
  }

  // ─── Totals ───────────────────────────────────────────────────────────────
  doc.moveTo(left, y).lineTo(right, y).lineWidth(0.5).strokeColor("#DDDDDD").stroke();
  y += 12;

  const labelX = left + width * 0.55;
  const labelWidth = width * 0.28;

  function totalRow(label: string, amount: number, emphasis = false) {
    doc
      .fillColor(emphasis ? "#111111" : "#444444")
      .fontSize(emphasis ? 12 : 10)
      .text(label, labelX, y, { width: labelWidth, align: "right" })
      .text(money(amount), columns.amount, y, { width: numberWidth, align: "right" });
    y += emphasis ? 20 : 16;
  }

  totalRow("Subtotal", order.subtotal);

  if (order.deliveryFee > 0) totalRow("Delivery fee", order.deliveryFee);

  if (order.taxAmount > 0) {
    if (isTaxInvoice) {
      // Split in half, always: a restaurant serves where it stands, so this is
      // an intra-state supply and never IGST. See splitTax().
      const { cgst, sgst, halfRatePercent } = splitTax(order.taxAmount, restaurant.taxPercent);
      totalRow(`CGST @ ${halfRatePercent}%`, cgst);
      totalRow(`SGST @ ${halfRatePercent}%`, sgst);
    } else {
      totalRow(`Tax @ ${restaurant.taxPercent}%`, order.taxAmount);
    }
  }

  doc.moveTo(labelX, y).lineTo(right, y).lineWidth(0.5).strokeColor("#DDDDDD").stroke();
  y += 10;
  totalRow("Total", order.total, true);

  // ─── Payment status ───────────────────────────────────────────────────────
  const paid = order.paymentStatus === "PAID";
  const mode = order.paymentMode ? PAYMENT_MODE_LABEL[order.paymentMode] : null;

  doc
    .fillColor(paid ? "#15803D" : "#B45309")
    .fontSize(10)
    .text(
      paid
        ? `Paid${mode ? ` · ${mode}` : ""}`
        : order.paymentStatus === "REFUNDED"
          ? "Refunded"
          : "Not paid",
      left,
      y,
      { width }
    );

  if (order.status === "CANCELLED") {
    doc.fillColor("#B91C1C").fontSize(10).text("This order was cancelled.", left, doc.y, { width });
  }

  // ─── Footer ───────────────────────────────────────────────────────────────
  doc
    .fillColor("#999999")
    .fontSize(8)
    .text(
      isTaxInvoice
        ? "This is a computer-generated tax invoice and needs no signature."
        : "This is a computer-generated bill and needs no signature.",
      left,
      doc.page.height - 72,
      { width, align: "center" }
    );

  doc.end();
  return done;
}
