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

type Plan = { id: string; name: string };

type UserFormValues = {
  name: string;
  email: string;
  company: string;
  role: "USER" | "ADMIN";
  planId: string;
  planExpiresAt: string;
};

const EMPTY_VALUES: UserFormValues = {
  name: "",
  email: "",
  company: "",
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
        company: values.company || undefined,
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
            <Label htmlFor="user-company">Company (optional)</Label>
            <Input
              id="user-company"
              value={values.company}
              onChange={(e) => setValues((v) => ({ ...v, company: e.target.value }))}
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
              <SelectTrigger id="user-role">
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
              <SelectTrigger id="user-plan">
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
