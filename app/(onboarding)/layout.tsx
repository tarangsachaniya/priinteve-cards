import Link from "next/link";
import { Nfc } from "lucide-react";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-center border-b border-border px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-ink">
            <Nfc className="size-4" strokeWidth={2.5} />
          </span>
          Tapcard
        </Link>
      </header>
      {children}
    </div>
  );
}
