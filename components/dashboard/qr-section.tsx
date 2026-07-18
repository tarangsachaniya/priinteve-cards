import { Download, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QrSection({ slug }: { slug: string }) {
  return (
    <Card className="mt-6 max-w-md border-border/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCode className="size-4" />
          Your QR code
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/qr/${slug}/png`}
          alt="Card QR code"
          width={180}
          height={180}
          className="rounded-2xl border border-border p-2"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<a href={`/api/qr/${slug}/png`} download={`${slug}-qr.png`} />}
          >
            <Download data-icon="inline-start" />
            PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<a href={`/api/qr/${slug}/pdf`} download={`${slug}-qr.pdf`} />}
          >
            <Download data-icon="inline-start" />
            PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
