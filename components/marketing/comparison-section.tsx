import { CheckIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ComparisonRow = {
  label: string;
  paper: boolean | string;
  digital: boolean | string;
};

const ROWS: ComparisonRow[] = [
  { label: "Cost after the first order", paper: "Reprint every time", digital: "₹0 — unlimited updates" },
  { label: "Update your details anytime", paper: false, digital: true },
  { label: "Built-in analytics", paper: false, digital: true },
  { label: "Multiple links & socials", paper: false, digital: true },
  { label: "Works with any smartphone", paper: false, digital: true },
  { label: "Never runs out", paper: false, digital: true },
  { label: "Eco-friendly", paper: false, digital: true },
];

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium text-foreground/80">{value}</span>;
  }
  return value ? (
    <span className="flex size-6 items-center justify-center rounded-full text-primary">
      <CheckIcon className="size-3.5" />
    </span>
  ) : (
    <span className="flex size-6 items-center justify-center rounded-full bg-muted/70 text-muted-foreground/50">
      <XIcon className="size-3.5" />
    </span>
  );
}

export function ComparisonSection() {
  return (
    <section className="border-y border-border/60 bg-section-alt py-24 md:py-28">
      <div className="mx-auto max-w-4xl px-6">
      <div className="reveal-on-scroll mx-auto max-w-2xl text-center">
        <Badge variant="secondary" className="h-auto rounded-full px-3 py-1 shadow-xs-token">
          Why switch
        </Badge>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Paper card vs. digital card
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
          The math stops making sense after your first reprint.
        </p>
      </div>

      <div className="shadow-card-sm reveal-on-scroll mt-14 overflow-hidden rounded-2xl border border-border/60 bg-card ring-1 ring-primary/8">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-12 bg-muted/30 text-sm font-semibold text-foreground">
                &nbsp;
              </TableHead>
              <TableHead className="h-12 bg-muted/30 text-center text-sm font-semibold text-muted-foreground">
                Paper card
              </TableHead>
              <TableHead className="h-12 bg-primary/6 text-center text-sm font-semibold text-primary">
                Digital card
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="py-4 text-[15px] font-medium text-foreground whitespace-normal">
                  {row.label}
                </TableCell>
                <TableCell className={cn("py-4 text-center", typeof row.paper === "string" && "whitespace-normal")}>
                  <div className="flex justify-center">
                    <Cell value={row.paper} />
                  </div>
                </TableCell>
                <TableCell className={cn("bg-primary/6 py-4 text-center", typeof row.digital === "string" && "whitespace-normal")}>
                  <div className="flex justify-center">
                    <Cell value={row.digital} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </div>
    </section>
  );
}
