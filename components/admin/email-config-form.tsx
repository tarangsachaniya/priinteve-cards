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
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {rules.map((rule, index) => (
            <div key={index} className="flex items-end gap-2 rounded-2xl border border-border bg-muted/30 p-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-ink">
                {index + 1}
              </span>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor={`rule-${index}`}>Days before expiry</Label>
                <Input
                  id={`rule-${index}`}
                  type="number"
                  min={1}
                  value={rule.daysBeforeExpiry}
                  onChange={(e) => updateRule(index, Number(e.target.value))}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRule(index)}
                aria-label="Remove rule"
              >
                <XIcon />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addRule} className="w-fit">
            Add reminder
          </Button>

          <Button type="submit" disabled={isSubmitting} className="mt-2 w-fit">
            {isSubmitting ? "Saving…" : "Save reminders"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
