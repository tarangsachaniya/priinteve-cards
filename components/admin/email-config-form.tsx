"use client";

import { useState } from "react";
import { toast } from "sonner";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Rule = { daysBeforeExpiry: number };

export function EmailConfigForm({ initialRules }: { initialRules: Rule[] }) {
  const [rules, setRules] = useState<Rule[]>(initialRules.length > 0 ? initialRules : [{ daysBeforeExpiry: 7 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateRule(index: number, daysBeforeExpiry: number) {
    setRules((prev) => prev.map((r, i) => (i === index ? { daysBeforeExpiry } : r)));
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  function addRule() {
    setRules((prev) => [...prev, { daysBeforeExpiry: 1 }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/email-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiryReminders: rules }),
      });

      if (!res.ok) {
        toast.error("Could not save email config");
        return;
      }

      toast.success("Email config saved");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-lg border-border/80">
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Reminder schedule
          </Label>

          <div className="flex flex-col gap-2.5">
            {rules.map((rule, index) => (
              <div key={index} className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 py-2 pr-2 pl-3.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-ink">
                  {index + 1}
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    id={`rule-${index}`}
                    type="number"
                    min={1}
                    value={rule.daysBeforeExpiry}
                    onChange={(e) => updateRule(index, Number(e.target.value))}
                    className="h-9 max-w-24 bg-card"
                  />
                  <span className="text-sm text-muted-foreground">days before expiry</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeRule(index)}
                  aria-label="Remove rule"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <XIcon />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 border-t border-border/70 pt-4">
            <Button type="button" variant="outline" size="sm" onClick={addRule} className="w-fit">
              Add reminder
            </Button>
            <Button type="submit" disabled={isSubmitting} size="sm" className="w-fit">
              {isSubmitting ? "Saving…" : "Save reminders"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
