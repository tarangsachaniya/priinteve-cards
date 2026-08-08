"use client";

import { formatCurrency } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DishSalesRow = {
  name: string;
  quantity: number;
  revenue: number;
  /** Order *lines*, not distinct orders — see the column note below. */
  timesOrdered: number;
};

/**
 * What actually sold in the selected range, dish by dish.
 *
 * The order list answers "what happened to #42"; this answers "how many of
 * these did we sell", which is the question that changes a menu.
 */
export function DishSalesTable({ rows, rangeLabel }: { rows: DishSalesRow[]; rangeLabel: string }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold">Dish sales</h2>
        <p className="text-xs text-muted-foreground">
          {rangeLabel} · cancelled orders excluded, since a cancelled dish was never sold.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          No dishes sold in this range.
        </p>
      ) : (
        <div className="max-h-[32rem] overflow-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dish</TableHead>
                <TableHead className="text-right">Qty sold</TableHead>
                {/* Lines, not orders: one order taking the same dish in two
                    sizes is two lines. */}
                <TableHead className="text-right">Times ordered</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="break-words font-medium">{row.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {row.timesOrdered}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(row.revenue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
