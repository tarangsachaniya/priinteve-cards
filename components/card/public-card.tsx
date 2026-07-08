import { cn } from "@/lib/utils";
import { getThemePreset } from "@/lib/theme-presets";
import { CardFieldRow, type PublicCardField } from "@/components/card/card-field-row";
import { CardGallery, type PublicGalleryItem } from "@/components/card/card-gallery";
import { SaveContactButton } from "@/components/card/save-contact-button";
import { ShareButton } from "@/components/card/share-button";

export type PublicCardSettings = {
  themeId: string;
  brandColor: string;
  galleryLayout: string;
};

export type PublicCardData = {
  name: string;
  slug: string;
  photoUrl: string | null;
  fields: PublicCardField[];
  galleryItems: PublicGalleryItem[];
  settings: PublicCardSettings;
};

export function PublicCard({ data }: { data: PublicCardData }) {
  const theme = getThemePreset(data.settings.themeId);

  return (
    <main className="mx-auto min-h-screen max-w-lg p-4 sm:p-6">
      <div
        className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/10"
        style={{ "--brand": data.settings.brandColor } as React.CSSProperties}
      >
        <div
          className="h-20 w-full"
          style={{
            background:
              "linear-gradient(135deg, var(--brand), color-mix(in oklch, var(--brand), black 35%))",
          }}
        />

        <div className={cn("-mt-10 flex flex-col", theme.fontFamily, theme.previewClassName)}>
          <div className="flex flex-col items-center gap-1">
            {data.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.photoUrl}
                alt={data.name}
                className="h-20 w-20 rounded-full object-cover ring-4 ring-card"
              />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-white ring-4 ring-card"
                style={{ backgroundColor: "var(--brand)" }}
              >
                {data.name.slice(0, 1).toUpperCase() || "?"}
              </div>
            )}
            <h1 className="mt-2 text-lg font-semibold">{data.name}</h1>
          </div>

          {data.fields.length > 0 && (
            <div className="flex w-full flex-col gap-2">
              {data.fields.map((field, i) => (
                <CardFieldRow key={i} field={field} />
              ))}
            </div>
          )}

          <CardGallery items={data.galleryItems} layout={data.settings.galleryLayout} />

          <div className="flex w-full items-center justify-center gap-2 pt-2">
            <SaveContactButton slug={data.slug} />
            <ShareButton />
          </div>
        </div>
      </div>
    </main>
  );
}
