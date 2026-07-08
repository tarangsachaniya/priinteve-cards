"use client";

import { User } from "lucide-react";

import { cn } from "@/lib/utils";
import type { WizardField } from "@/components/wizard/field-instance-row";

function ContactMock({
  platform,
  name,
  phone,
  email,
  showPhoto,
}: {
  platform: "iOS" | "Android";
  name: string;
  phone?: string;
  email?: string;
  showPhoto: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10",
        platform === "iOS" ? "rounded-3xl" : "rounded-lg"
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{platform} Contacts</p>
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <User className="size-8" />
          {showPhoto && <span className="sr-only">(profile photo included)</span>}
        </div>
        <p className="font-semibold">{name || "New Contact"}</p>
      </div>
      <div className="flex flex-col gap-1.5 text-sm">
        {phone && (
          <div className="flex justify-between border-b border-border pb-1.5">
            <span className="text-muted-foreground">mobile</span>
            <span>{phone}</span>
          </div>
        )}
        {email && (
          <div className="flex justify-between pb-1.5">
            <span className="text-muted-foreground">email</span>
            <span>{email}</span>
          </div>
        )}
        {!phone && !email && <p className="text-muted-foreground">No contact details yet</p>}
      </div>
    </div>
  );
}

export function VcfContactPreview({
  name,
  fields,
  vcfIncludePhoto,
}: {
  name: string;
  fields: WizardField[];
  vcfIncludePhoto: boolean;
}) {
  const phone = fields.find((f) => f.fieldType === "phone")?.value;
  const email = fields.find((f) => f.fieldType === "email")?.value;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <ContactMock platform="iOS" name={name} phone={phone} email={email} showPhoto={vcfIncludePhoto} />
      <ContactMock platform="Android" name={name} phone={phone} email={email} showPhoto={vcfIncludePhoto} />
    </div>
  );
}
