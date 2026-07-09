import { cn } from "@/lib/utils";
import { getThemePreset } from "@/lib/theme-presets";
import { groupCardFields } from "@/lib/card-sections";
import { CardFieldRow, type PublicCardField } from "@/components/card/card-field-row";
import { CardGallery, type PublicGalleryItem } from "@/components/card/card-gallery";
import { CompanySection } from "@/components/card/company-section";
import { ServicesSection } from "@/components/card/services-section";
import { TestimonialsSection } from "@/components/card/testimonials-section";
import { SocialLinksRow } from "@/components/card/social-links-row";
import { SafeImage } from "@/components/card/safe-image";
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
  const grouped = groupCardFields(data.fields);
  const website = grouped.rows.find((f) => f.fieldType === "website")?.value;
  const showCompanySection = Boolean(
    grouped.company?.name || grouped.company?.tagline || grouped.company?.description
  );
  const rows = showCompanySection
    ? grouped.rows.filter((f) => f.fieldType !== "website")
    : grouped.rows;

  const hasWideContent =
    grouped.services.length > 0 || grouped.testimonials.length > 0 || data.galleryItems.length > 0;

  const identityBlock = (
    <>
      <div className="flex flex-col items-center gap-1 lg:items-start lg:text-left">
        <SafeImage
          src={data.photoUrl}
          alt={data.name}
          className="h-20 w-20 rounded-full object-cover ring-4 ring-card"
          fallback={
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-white ring-4 ring-card"
              style={{ backgroundColor: "var(--brand)" }}
            >
              {data.name.slice(0, 1).toUpperCase() || "?"}
            </div>
          }
        />
        <h1 className="mt-2 text-lg font-semibold">{data.name}</h1>
        {grouped.designation && (
          <p className="text-sm text-muted-foreground">{grouped.designation}</p>
        )}
      </div>

      {grouped.company && <CompanySection company={grouped.company} website={website} />}

      {rows.length > 0 && (
        <div className="flex w-full flex-col gap-2">
          {rows.map((field, i) => (
            <CardFieldRow
              key={i}
              field={field}
              mapUrl={field.fieldType === "address" ? (grouped.mapUrl ?? undefined) : undefined}
            />
          ))}
        </div>
      )}

      <SocialLinksRow links={grouped.socialLinks} />

      <div className="flex w-full items-center justify-center gap-2 pt-2 lg:justify-start">
        <SaveContactButton slug={data.slug} />
        <ShareButton />
      </div>
    </>
  );

  const contentBlock = (
    <>
      <ServicesSection services={grouped.services} />
      <TestimonialsSection testimonials={grouped.testimonials} />
      <CardGallery items={data.galleryItems} layout={data.settings.galleryLayout} />
    </>
  );

  return (
    <main
      className={cn(
        "mx-auto min-h-screen w-full max-w-lg p-4 sm:p-6",
        hasWideContent && "lg:max-w-4xl lg:py-10"
      )}
    >
      <div
        className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/10"
        style={{ "--brand": data.settings.brandColor } as React.CSSProperties}
      >
        <div
          className={cn("w-full", hasWideContent ? "h-20 lg:h-28" : "h-20")}
          style={{
            background:
              "linear-gradient(135deg, var(--brand), color-mix(in oklch, var(--brand), black 35%))",
          }}
        />

        <div
          className={cn(
            "-mt-10 flex w-full flex-col overflow-hidden",
            theme.fontFamily,
            theme.previewClassName,
            hasWideContent &&
              "lg:mt-0 lg:grid lg:grid-cols-[280px_1fr] lg:items-start lg:gap-8 lg:p-8"
          )}
        >
          <div
            className={cn(
              "flex w-full flex-col gap-2",
              hasWideContent && "lg:-mt-14 lg:items-start lg:text-left"
            )}
          >
            {identityBlock}
          </div>

          {hasWideContent ? (
            <div className="mt-4 flex w-full flex-col gap-3 text-left lg:mt-16">
              {contentBlock}
            </div>
          ) : (
            contentBlock
          )}
        </div>
      </div>
    </main>
  );
}
