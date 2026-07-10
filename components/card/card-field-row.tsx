import { cn } from "@/lib/utils";
import { getFieldTypeMeta } from "@/lib/field-types";
import { sanitizeRichTextServer } from "@/lib/sanitize-html";
import { mailtoHref, telHref, waHref } from "@/lib/contact-links";

export type PublicCardField = {
  fieldType: string;
  label: string;
  value: string;
};

function fieldHref(field: PublicCardField): string | null {
  switch (field.fieldType) {
    case "phone":
      return telHref(field.value);
    case "email":
      return mailtoHref(field.value);
    case "whatsapp":
      return waHref(field.value);
    case "website":
      return field.value;
    case "file":
      return field.value;
    case "google_maps_url":
      return field.value;
    default:
      if (field.fieldType.startsWith("social_")) return field.value;
      return null;
  }
}

export function CardFieldRow({ field, mapUrl }: { field: PublicCardField; mapUrl?: string }) {
  const { icon: Icon } = getFieldTypeMeta(field.fieldType);
  const href = fieldHref(field);
  const isExternal =
    field.fieldType === "website" ||
    field.fieldType === "google_maps_url" ||
    field.fieldType.startsWith("social_");
  const shouldWrap = field.fieldType === "address";

  const content = (
    <>
      <Icon className="size-4 shrink-0" style={{ color: "var(--brand)" }} />
      <span className={shouldWrap ? "break-words" : "truncate"}>
        <span className="font-medium">{field.label}:</span> {field.value}
      </span>
    </>
  );

  const rowClassName = cn(
    "flex gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-sm transition-colors",
    href && "hover:bg-[var(--brand)]/10",
    shouldWrap ? "items-start" : "items-center"
  );

  if (field.fieldType === "bio") {
    return (
      <div className="flex flex-col gap-1.5 rounded-lg bg-muted/50 px-3.5 py-3 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <Icon className="size-4 shrink-0" style={{ color: "var(--brand)" }} />
          {field.label}
        </span>
        <div
          className="leading-relaxed text-foreground/90 [&_a]:text-[var(--brand)] [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: sanitizeRichTextServer(field.value) }}
        />
      </div>
    );
  }

  if (field.fieldType === "address") {
    return (
      <div className="flex flex-col gap-1">
        <div className={rowClassName}>{content}</div>
        <a
          href={mapUrl ?? `https://maps.google.com/?q=${encodeURIComponent(field.value)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-xs text-muted-foreground underline underline-offset-2"
        >
          View on map
        </a>
      </div>
    );
  }

  if (field.fieldType === "file") {
    return (
      <a href={href!} download className={rowClassName}>
        {content}
      </a>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className={rowClassName}
      >
        {content}
      </a>
    );
  }

  return <div className={rowClassName}>{content}</div>;
}
