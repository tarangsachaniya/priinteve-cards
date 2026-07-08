"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
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
import { resetPasswordSchema } from "@/lib/validations/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const parsed = resetPasswordSchema.safeParse({ token, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details and try again");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Could not reset your password");
        return;
      }

      toast.success("Password updated — please log in");
      router.push("/login");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell tagline="Choose a new password to secure your account.">
      <Card className="shadow-elevated w-full max-w-sm border-border/80">
        <CardHeader className="gap-1.5 px-7 pt-7">
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>Choose a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent className="px-7">
          {token ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">New password</Label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <PasswordInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1 w-full">
                {isSubmitting ? "Updating…" : "Reset password"}
              </Button>
            </form>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              This reset link is missing a token.
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center border-t-0 bg-transparent px-7 pt-2 pb-7 text-sm">
          <Link
            href="/login"
            className="flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Back to log in
          </Link>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
