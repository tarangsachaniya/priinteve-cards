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

type Plan = { id: string; name: string };

type UserFormValues = {
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  planId: string;
  planExpiresAt: string;
};

const EMPTY_VALUES: UserFormValues = {
  name: "",
  email: "",
  role: "USER",
  planId: "",
  planExpiresAt: "",
};

type UserFormProps = {
  plans: Plan[];
  trigger: React.ReactNode;
  onCreated?: () => void;
};

export function UserForm({ plans, trigger, onCreated }: UserFormProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [values, setValues] = useState<UserFormValues>(EMPTY_VALUES);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name: values.name,
        email: values.email,
        role: values.role,
        planId: values.planId || undefined,
        planExpiresAt: values.planId && values.planExpiresAt ? values.planExpiresAt : undefined,
      };

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error === "Email already in use" ? data.error : "Could not create user");
        return;
      }

      toast.success("User created");
      setValues(EMPTY_VALUES);
      setOpen(false);
      onCreated?.();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Creates an account and emails the user a link to set their password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-name">Name</Label>
            <Input
              id="user-name"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
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
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-role">Role</Label>
            <select
              id="user-role"
              value={values.role}
              onChange={(e) => setValues((v) => ({ ...v, role: e.target.value as UserFormValues["role"] }))}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-plan">Plan</Label>
            <select
              id="user-plan"
              value={values.planId}
              onChange={(e) => setValues((v) => ({ ...v, planId: e.target.value }))}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">No plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>

          {values.planId && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-plan-expires">Plan expires</Label>
              <Input
                id="user-plan-expires"
                type="date"
                value={values.planExpiresAt}
                onChange={(e) => setValues((v) => ({ ...v, planExpiresAt: e.target.value }))}
              />
            </div>
          )}

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Creating…" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
