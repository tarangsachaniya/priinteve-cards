import { cn } from "@/lib/utils";
import { getThemePreset } from "@/lib/theme-presets";
import { groupCardFields } from "@/lib/card-sections";
import { waHref } from "@/lib/contact-links";
import { CardFieldRow, type PublicCardField } from "@/components/card/card-field-row";
import { CardGallery, type PublicGalleryItem } from "@/components/card/card-gallery";
import { CompanySection } from "@/components/card/company-section";
import { ServicesSection } from "@/components/card/services-section";
import { TestimonialsSection } from "@/components/card/testimonials-section";
import { SocialLinksRow } from "@/components/card/social-links-row";
import { SafeImage } from "@/components/card/safe-image";
import { QuickActionDock } from "@/components/card/quick-action-dock";
import { MotionSection } from "@/components/card/motion-section";

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
  const phone = grouped.rows.find((f) => f.fieldType === "phone")?.value;
  const email = grouped.rows.find((f) => f.fieldType === "email")?.value;
  const whatsappLink = grouped.socialLinks.find((l) => l.platform === "whatsapp");
  const whatsappUrl = whatsappLink ? waHref(whatsappLink.url) : undefined;

  const showCompanySection = Boolean(
    grouped.company?.name || grouped.company?.tagline || grouped.company?.description
  );
  const rows = showCompanySection
    ? grouped.rows.filter((f) => f.fieldType !== "website")
    : grouped.rows;

  const isMinimal = theme.layout === "minimal";
  const isBanner = theme.layout === "banner";
  const hasWideContent =
    grouped.services.length > 0 || grouped.testimonials.length > 0 || data.galleryItems.length > 0;
  const useSplitLayout = hasWideContent || theme.layout === "split";

  const identityBlock = (
    <>
      <MotionSection className="flex flex-col items-center gap-1 lg:items-start lg:text-left">
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
      </MotionSection>

      {grouped.company && (
        <CompanySection company={grouped.company} website={website} flat={isMinimal} />
      )}

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

      <QuickActionDock
        phone={phone}
        email={email}
        website={website}
        whatsappUrl={whatsappUrl}
        slug={data.slug}
      />
    </>
  );

  const contentBlock = (
    <>
      <ServicesSection services={grouped.services} flat={isMinimal} />
      <TestimonialsSection testimonials={grouped.testimonials} flat={isMinimal} />
      <CardGallery items={data.galleryItems} layout={data.settings.galleryLayout} />
    </>
  );

  return (
    <main
      className={cn(
        "mx-auto min-h-screen w-full max-w-lg p-4 pb-20 sm:p-6 lg:pb-6",
        useSplitLayout && "lg:max-w-4xl lg:py-10"
      )}
    >
      <div
        className={cn(
          "overflow-hidden rounded-2xl bg-card",
          isMinimal ? "" : "shadow-sm ring-1 ring-foreground/10"
        )}
        style={{ "--brand": data.settings.brandColor } as React.CSSProperties}
      >
        <div
          className={cn(
            "w-full",
            isBanner ? "h-28 lg:h-36" : useSplitLayout ? "h-20 lg:h-28" : "h-20"
          )}
          style={{
            background:
              "linear-gradient(135deg, var(--brand), color-mix(in oklch, var(--brand), black 35%))",
          }}
        />

        <div
          className={cn(
            "flex w-full flex-col overflow-hidden",
            isBanner ? "-mt-14" : "-mt-10",
            theme.fontFamily,
            theme.previewClassName,
            useSplitLayout &&
              "lg:mt-0 lg:grid lg:grid-cols-[280px_1fr] lg:items-start lg:gap-8 lg:p-8"
          )}
        >
          <div
            className={cn(
              "flex w-full flex-col gap-2",
              useSplitLayout && "lg:-mt-14 lg:items-start lg:text-left"
            )}
          >
            {identityBlock}
          </div>

          {useSplitLayout ? (
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
