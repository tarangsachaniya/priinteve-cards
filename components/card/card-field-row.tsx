import { cn } from "@/lib/utils";
import { getFieldTypeMeta } from "@/lib/field-types";
import { sanitizeRichTextServer } from "@/lib/sanitize-html";

export type PublicCardField = {
  fieldType: string;
  label: string;
  value: string;
};

function fieldHref(field: PublicCardField): string | null {
  switch (field.fieldType) {
    case "phone":
      return `tel:${field.value}`;
    case "email":
      return `mailto:${field.value}`;
    case "whatsapp":
      return `https://wa.me/${field.value.replace(/[^0-9]/g, "")}`;
    case "website":
      return field.value;
    case "file":
      return field.value;
    default:
      if (field.fieldType.startsWith("social_")) return field.value;
      return null;
  }
}

export function CardFieldRow({ field, mapUrl }: { field: PublicCardField; mapUrl?: string }) {
  const { icon: Icon } = getFieldTypeMeta(field.fieldType);
  const href = fieldHref(field);
  const isExternal = field.fieldType === "website" || field.fieldType.startsWith("social_");
  const shouldWrap = field.fieldType === "address" || field.fieldType === "business_hours";

  const content = (
    <>
      <Icon className="size-4 shrink-0" style={{ color: "var(--brand)" }} />
      <span className={shouldWrap ? "break-words" : "truncate"}>
        <span className="font-medium">{field.label}:</span> {field.value}
      </span>
    </>
  );

  const rowClassName = cn(
    "flex gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-sm",
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
