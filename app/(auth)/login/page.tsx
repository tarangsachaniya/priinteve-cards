"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession, signIn } from "next-auth/react";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleIcon } from "@/components/auth/google-icon";
import { IconInput } from "@/components/auth/icon-input";
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
import { loginSchema } from "@/lib/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error("Enter a valid email and password");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        toast.error("Invalid email or password");
        return;
      }

      const session = await getSession();
      if (session?.user.role === "ADMIN") {
        router.push("/admin");
      } else if (!session?.user.cardPublished) {
        router.push("/dashboard/setup");
      } else {
        router.push("/dashboard");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell tagline="One card. Every way to connect.">
      <Card className="shadow-elevated w-full max-w-sm border-border/80">
        <CardHeader className="gap-1.5 px-7 pt-7">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Log in to manage your digital card</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 px-7">
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
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1 w-full">
              {isSubmitting ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <div className="relative flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or continue with
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/auth-redirect" })}
          >
            <GoogleIcon className="size-4" />
            Continue with Google
          </Button>
        </CardContent>
        <CardFooter className="justify-center border-t-0 bg-transparent px-7 pt-2 pb-7 text-sm">
          Don&apos;t have an account?&nbsp;
          <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
