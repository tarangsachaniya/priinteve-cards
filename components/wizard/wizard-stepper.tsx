"use client";

import { cn } from "@/lib/utils";

const STEPS = ["Profile", "Theme", "Gallery", "Contact", "Preview"];

export function WizardStepper({ currentStep }: { currentStep: number }) {
  return (
    <ol className="flex w-full items-center gap-2">
      {STEPS.map((label, i) => {
        const stepNumber = i + 1;
        const isActive = stepNumber === currentStep;
        const isDone = stepNumber < currentStep;
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-medium ring-1 ring-border",
                isActive && "bg-primary text-ink",
                isDone && "bg-primary/20 text-ink",
                !isActive && !isDone && "bg-muted text-muted-foreground"
              )}
            >
              {stepNumber}
            </div>
            <span
              className={cn(
                "text-xs",
                isActive ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
