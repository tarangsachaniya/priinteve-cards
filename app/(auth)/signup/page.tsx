"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Briefcase, Mail, User } from "lucide-react";
import { toast } from "sonner";

import { getPostAuthRedirectPath } from "@/lib/post-auth-redirect";
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
import { Separator } from "@/components/ui/separator";
import { signupSchema } from "@/lib/validations/auth";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = signupSchema.safeParse({ name, email, password, company: company || undefined });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details and try again");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Could not create your account");
        return;
      }

      router.push(getPostAuthRedirectPath({ role: "USER" }));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell tagline="Share who you are with a single tap or scan.">
      <Card className="w-full max-w-sm border-border/80 shadow-lg">
        <CardHeader className="gap-1.5 px-7 pt-7">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Set up your digital business card</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 px-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full name</Label>
              <IconInput
                id="name"
                icon={User}
                placeholder="Jordan Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company">Company (optional)</Label>
              <IconInput
                id="company"
                icon={Briefcase}
                placeholder="Acme Inc."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
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
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1 w-full">
              {isSubmitting ? "Creating account…" : "Sign up"}
            </Button>
          </form>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Separator className="flex-1" />
            or continue with
            <Separator className="flex-1" />
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
          Already have an account?&nbsp;
          <Link href="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Log in
          </Link>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
