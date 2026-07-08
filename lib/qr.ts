import QRCode from "qrcode";

const QR_OPTIONS = {
  margin: 2,
  width: 512,
};

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, QR_OPTIONS);
}

export async function generateQrPngBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, QR_OPTIONS);
}

export function getCardUrl(slug: string): string {
  return `${process.env.NEXTAUTH_URL}/${slug}`;
}
