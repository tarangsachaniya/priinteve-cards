"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { IconInput } from "@/components/auth/icon-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      toast.error("Enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell tagline="We'll get you back into your account in no time.">
      <Card className="w-full max-w-sm border-border/80 shadow-lg">
        <CardHeader className="gap-1.5 px-7 pt-7">
          {sent ? (
            <span className="mb-1 flex size-11 items-center justify-center rounded-full bg-primary/10 text-foreground">
              <MailCheck className="size-5" />
            </span>
          ) : null}
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <CardDescription>
            {sent
              ? "If that email exists, a reset link has been sent."
              : "Enter your email and we'll send you a reset link."}
          </CardDescription>
        </CardHeader>
        {!sent && (
          <CardContent className="px-7">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <IconInput
                  id="email"
                  icon={Mail}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1 w-full">
                {isSubmitting ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          </CardContent>
        )}
        <CardFooter className="justify-center border-t-0 bg-transparent px-7 pt-2 pb-7 text-sm">
          <Link
            href="/login"
            className="flex items-center gap-1.5 font-semibold text-foreground underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Back to log in
          </Link>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
