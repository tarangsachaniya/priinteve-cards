"use client";

import {
  AlignLeft,
  FileText,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Type as TypeIcon,
  type LucideIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SOCIAL_PLATFORMS, SocialGroupIcon, getFieldTypeMeta } from "@/lib/field-types";
import { cn } from "@/lib/utils";

const BASIC_FIELD_TYPES: { fieldType: string; label: string; defaultLabel: string; icon: LucideIcon }[] = [
  { fieldType: "bio", label: "Bio", defaultLabel: "About Me", icon: AlignLeft },
  { fieldType: "text", label: "Text", defaultLabel: "Text", icon: TypeIcon },
  { fieldType: "phone", label: "Phone", defaultLabel: "Phone", icon: Phone },
  { fieldType: "email", label: "Email", defaultLabel: "Email", icon: Mail },
  { fieldType: "website", label: "URL", defaultLabel: "Website", icon: Globe },
  { fieldType: "whatsapp", label: "WhatsApp", defaultLabel: "WhatsApp", icon: MessageCircle },
  { fieldType: "address", label: "Address", defaultLabel: "Address", icon: MapPin },
];

const tileClassName =
  "group flex flex-col items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-4 text-center outline-none transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const tileIconClassName =
  "flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground";

export function FieldTypePicker({
  onAdd,
  onAddFile,
  isUploadingFile,
}: {
  onAdd: (fieldType: string, label: string) => void;
  onAddFile: (file: File) => void;
  isUploadingFile: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {BASIC_FIELD_TYPES.map((type) => (
        <button
          key={type.fieldType}
          type="button"
          onClick={() => onAdd(type.fieldType, type.defaultLabel)}
          className={tileClassName}
        >
          <span className={tileIconClassName}>
            <type.icon className="size-4" />
          </span>
          <span className="text-sm font-medium">{type.label}</span>
        </button>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger className={tileClassName}>
          <span className={tileIconClassName}>
            <SocialGroupIcon className="size-4" />
          </span>
          <span className="text-sm font-medium">Social Media</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {SOCIAL_PLATFORMS.map((platform) => {
            const Icon = getFieldTypeMeta(platform.fieldType).icon;
            return (
              <DropdownMenuItem
                key={platform.fieldType}
                onClick={() => onAdd(platform.fieldType, platform.label)}
              >
                <Icon /> {platform.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <label
        className={cn(tileClassName, isUploadingFile ? "pointer-events-none opacity-60" : "cursor-pointer")}
      >
        <span className={tileIconClassName}>
          <FileText className="size-4" />
        </span>
        <span className="text-sm font-medium">{isUploadingFile ? "Uploading…" : "File/PDF"}</span>
        <input
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          disabled={isUploadingFile}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onAddFile(file);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
