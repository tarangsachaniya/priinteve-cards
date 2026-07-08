import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QrSection({ slug }: { slug: string }) {
  return (
    <Card className="mt-6 max-w-md">
      <CardHeader>
        <CardTitle>Your QR code</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/qr/${slug}/png`}
          alt="Card QR code"
          width={200}
          height={200}
          className="rounded-lg border"
        />
        <div className="flex gap-2">
          <Button variant="outline" render={<a href={`/api/qr/${slug}/png`} download={`${slug}-qr.png`} />}>
            Download PNG
          </Button>
          <Button variant="outline" render={<a href={`/api/qr/${slug}/pdf`} download={`${slug}-qr.pdf`} />}>
            Download PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
