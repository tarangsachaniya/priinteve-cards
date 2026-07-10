import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BusinessHoursValue } from "@/lib/validations/card-field";

const DAY_LABELS: { key: keyof BusinessHoursValue; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

export function BusinessHoursCard({
  hours,
  label,
  flat,
}: {
  hours: BusinessHoursValue;
  label: string;
  flat?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg px-3.5 py-3 text-sm",
        flat ? "bg-muted/50" : "bg-card/60 shadow-sm ring-1 ring-foreground/10 backdrop-blur-md"
      )}
    >
      <span className="flex items-center gap-2 font-medium">
        <Clock className="size-4 shrink-0" style={{ color: "var(--brand)" }} />
        {label}
      </span>
      <div className="flex flex-col gap-1">
        {DAY_LABELS.map((day) => {
          const value = hours[day.key];
          return (
            <div key={day.key} className="flex items-center justify-between text-xs">
              <span className="text-foreground/80">{day.label}</span>
              <span className={value.closed ? "text-muted-foreground" : "font-medium text-foreground/90"}>
                {value.closed ? "Closed" : `${value.open} – ${value.close}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
