"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type Plan = { id: string; name: string };

type UserFormValues = {
  name: string;
  email: string;
  company: string;
  role: "USER" | "ADMIN";
  planId: string;
  planExpiresAt: string;
  walletPoints: string;
  cardPublished: boolean;
  onboardingStep: string;
};

const EMPTY_VALUES: UserFormValues = {
  name: "",
  email: "",
  company: "",
  role: "USER",
  planId: "",
  planExpiresAt: "",
  walletPoints: "0",
  cardPublished: false,
  onboardingStep: "1",
};

type UserFormProps = {
  plans: Plan[];
  trigger: React.ReactElement;
  userId?: string;
  onSaved?: () => void;
};

export function UserForm({ plans, trigger, userId, onSaved }: UserFormProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [values, setValues] = useState<UserFormValues>(EMPTY_VALUES);
  const isEdit = Boolean(userId);

  async function loadUser() {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.user) {
        toast.error("Could not load user");
        setOpen(false);
        return;
      }
      const u = data.user;
      setValues({
        name: u.name ?? "",
        email: u.email ?? "",
        company: u.company ?? "",
        role: u.role,
        planId: u.planId ?? "",
        planExpiresAt: u.planExpiresAt ? String(u.planExpiresAt).slice(0, 10) : "",
        walletPoints: String(u.walletPoints ?? 0),
        cardPublished: Boolean(u.cardPublished),
        onboardingStep: String(u.onboardingStep ?? 1),
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const basePayload = {
        name: values.name,
        email: values.email,
        company: values.company || undefined,
        role: values.role,
        planId: values.planId || undefined,
        planExpiresAt: values.planId && values.planExpiresAt ? values.planExpiresAt : undefined,
      };

      const payload = isEdit
        ? {
            ...basePayload,
            walletPoints: Number(values.walletPoints),
            cardPublished: values.cardPublished,
            onboardingStep: Number(values.onboardingStep),
          }
        : basePayload;

      const res = await fetch(isEdit ? `/api/admin/users/${userId}` : "/api/admin/users", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error === "Email already in use" ? data.error : "Could not save user");
        return;
      }

      toast.success(isEdit ? "User updated" : "User created");
      if (!isEdit) setValues(EMPTY_VALUES);
      setOpen(false);
      onSaved?.();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && isEdit) loadUser();
        else if (next) setValues(EMPTY_VALUES);
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this user's account details and status."
              : "Creates an account and emails the user a link to set their password."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex max-h-[65vh] flex-col gap-3 overflow-y-auto px-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-name">Name</Label>
            <Input
              id="user-name"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              disabled={isLoading}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={values.email}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
              disabled={isLoading}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-company">Company (optional)</Label>
            <Input
              id="user-company"
              value={values.company}
              onChange={(e) => setValues((v) => ({ ...v, company: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-role">Role</Label>
            <Select
              value={values.role}
              onValueChange={(value) =>
                setValues((v) => ({ ...v, role: value as UserFormValues["role"] }))
              }
            >
              <SelectTrigger id="user-role" disabled={isLoading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-plan">Plan</Label>
            <Select
              value={values.planId || "none"}
              onValueChange={(value) =>
                value && setValues((v) => ({ ...v, planId: value === "none" ? "" : value }))
              }
            >
              <SelectTrigger id="user-plan" disabled={isLoading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No plan</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {values.planId && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-plan-expires">Plan expires</Label>
              <Input
                id="user-plan-expires"
                type="date"
                value={values.planExpiresAt}
                onChange={(e) => setValues((v) => ({ ...v, planExpiresAt: e.target.value }))}
                disabled={isLoading}
              />
            </div>
          )}

          {isEdit && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="user-wallet">Wallet points</Label>
                  <Input
                    id="user-wallet"
                    type="number"
                    min={0}
                    value={values.walletPoints}
                    onChange={(e) => setValues((v) => ({ ...v, walletPoints: e.target.value }))}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="user-onboarding-step">Onboarding step</Label>
                  <Input
                    id="user-onboarding-step"
                    type="number"
                    min={1}
                    max={5}
                    value={values.onboardingStep}
                    onChange={(e) => setValues((v) => ({ ...v, onboardingStep: e.target.value }))}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <label className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
                <span className="text-sm font-medium">Card published</span>
                <Switch
                  checked={values.cardPublished}
                  onCheckedChange={(v) => setValues((prev) => ({ ...prev, cardPublished: v }))}
                  disabled={isLoading}
                />
              </label>
            </>
          )}

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isSaving || isLoading}>
              {isSaving ? "Saving…" : isEdit ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
