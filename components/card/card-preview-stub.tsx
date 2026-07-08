import {
  AtSign,
  FileText,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Type as TypeIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { sanitizeRichTextServer } from "@/lib/sanitize-html";
import { getThemePreset } from "@/lib/theme-presets";
import { getYoutubeThumbnail } from "@/lib/youtube";

export type CardPreviewField = {
  fieldType: string;
  label: string;
  value: string;
  order: number;
  isVisible: boolean;
};

export type CardPreviewGalleryItem = {
  type: "IMAGE" | "YOUTUBE";
  url: string;
  order: number;
};

export type CardPreviewSettings = {
  themeId: string;
  brandColor: string;
  galleryLayout: string;
  vcfIncludePhoto: boolean;
};

export type CardPreviewData = {
  name: string;
  slug: string;
  fields: CardPreviewField[];
  galleryItems: CardPreviewGalleryItem[];
  settings: CardPreviewSettings;
};

const FIELD_ICONS: Record<string, typeof Phone> = {
  text: TypeIcon,
  bio: TypeIcon,
  phone: Phone,
  email: Mail,
  website: Globe,
  address: MapPin,
  whatsapp: MessageCircle,
  file: FileText,
};

function getFieldIcon(fieldType: string) {
  if (fieldType.startsWith("social_")) return Share2;
  return FIELD_ICONS[fieldType] ?? AtSign;
}

function GalleryThumb({ item }: { item: CardPreviewGalleryItem }) {
  const src = item.type === "YOUTUBE" ? getYoutubeThumbnail(item.url) ?? item.url : item.url;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-full w-full rounded-md object-cover" />
  );
}

function GallerySection({
  items,
  layout,
}: {
  items: CardPreviewGalleryItem[];
  layout: string;
}) {
  if (items.length === 0) return null;
  const sorted = [...items].sort((a, b) => a.order - b.order);

  if (layout === "carousel") {
    return (
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
        {sorted.map((item, i) => (
          <div key={i} className="aspect-square w-32 shrink-0 snap-start">
            <GalleryThumb item={item} />
          </div>
        ))}
      </div>
    );
  }

  if (layout === "masonry") {
    return (
      <div className="columns-2 gap-2 [&>*]:mb-2">
        {sorted.map((item, i) => (
          <div key={i} className={i % 2 === 0 ? "aspect-square" : "aspect-[3/4]"}>
            <GalleryThumb item={item} />
          </div>
        ))}
      </div>
    );
  }

  if (layout === "lightbox") {
    const [first, ...rest] = sorted;
    return (
      <div className="flex flex-col gap-2">
        <div className="aspect-video">
          <GalleryThumb item={first} />
        </div>
        {rest.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {rest.map((item, i) => (
              <div key={i} className="aspect-square">
                <GalleryThumb item={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {sorted.map((item, i) => (
        <div key={i} className="aspect-square">
          <GalleryThumb item={item} />
        </div>
      ))}
    </div>
  );
}

export function CardPreviewStub({ data }: { data: CardPreviewData }) {
  const theme = getThemePreset(data.settings.themeId);
  const visibleFields = data.fields
    .filter((f) => f.isVisible && f.fieldType !== "photo")
    .sort((a, b) => a.order - b.order);

  return (
    <div
      className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/10"
      style={{ "--brand": data.settings.brandColor } as React.CSSProperties}
    >
      <div
        className="h-16 w-full"
        style={{
          background:
            "linear-gradient(135deg, var(--brand), color-mix(in oklch, var(--brand), black 35%))",
        }}
      />

      <div className={cn("-mt-8 flex flex-col", theme.fontFamily, theme.previewClassName)}>
        <div className="flex flex-col items-center gap-1">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-white ring-4 ring-card"
            style={{ backgroundColor: "var(--brand)" }}
          >
            {data.name.slice(0, 1).toUpperCase() || "?"}
          </div>
          <h2 className="mt-1 text-lg font-semibold">{data.name}</h2>
        </div>

        {visibleFields.length > 0 && (
          <div className="flex w-full flex-col gap-2">
            {visibleFields.map((field, i) => {
              const Icon = getFieldIcon(field.fieldType);

              if (field.fieldType === "bio") {
                return (
                  <div key={i} className="flex flex-col gap-1.5 rounded-lg bg-muted/50 px-3.5 py-3 text-sm">
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

              return (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-sm"
                >
                  <Icon className="size-4 shrink-0" style={{ color: "var(--brand)" }} />
                  <span className="truncate">
                    <span className="font-medium">{field.label}:</span> {field.value}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="w-full">
          <GallerySection items={data.galleryItems} layout={data.settings.galleryLayout} />
        </div>
      </div>
    </div>
  );
}
