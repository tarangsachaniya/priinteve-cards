"use client";

import { cn } from "@/lib/utils";
import { getThemePreset } from "@/lib/theme-presets";
import {
  buildSectionBlocks,
  parseButtonItems,
  parseCompanyGroup,
  parseFaqItems,
  parseProductItems,
  parseServiceItems,
  parseSocialGroup,
  parseTestimonialItems,
  type CardSectionField,
} from "@/lib/card-sections";
import { businessHoursValueSchema } from "@/lib/validations/card-field";
import { waHref } from "@/lib/contact-links";
import { CardFieldRow, type PublicCardField } from "@/components/card/card-field-row";
import { CardGallery, type PublicGalleryItem } from "@/components/card/card-gallery";
import { CompanySection } from "@/components/card/company-section";
import { ServicesSection } from "@/components/card/services-section";
import { TestimonialsSection } from "@/components/card/testimonials-section";
import { ProductsSection } from "@/components/card/products-section";
import { FaqSection } from "@/components/card/faq-section";
import { ButtonsSection } from "@/components/card/buttons-section";
import { BusinessHoursCard } from "@/components/card/business-hours-card";
import { CustomHtmlBlock } from "@/components/card/custom-html-block";
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
  fields: CardSectionField[];
  galleryItems: PublicGalleryItem[];
  settings: PublicCardSettings;
  gallerySectionOrder?: number;
};

const WIDE_GROUP_TYPES = new Set(["service", "testimonial", "product", "faq"]);

export function PublicCard({ data }: { data: PublicCardData }) {
  const theme = getThemePreset(data.settings.themeId);
  const blocks = buildSectionBlocks(data.fields, data.gallerySectionOrder ?? 9999);

  const website = data.fields.find((f) => f.fieldType === "website")?.value;
  const phone = data.fields.find((f) => f.fieldType === "phone")?.value;
  const email = data.fields.find((f) => f.fieldType === "email")?.value;
  const whatsappValue = data.fields.find((f) => f.fieldType === "whatsapp")?.value;
  const whatsappUrl = whatsappValue ? waHref(whatsappValue) : undefined;
  const mapUrl = data.fields.find((f) => f.fieldType === "google_maps_url")?.value;

  const hasCompanySection = blocks.some((b) => b.kind === "group" && b.type === "company");
  const hasWideContent = blocks.some(
    (b) => b.kind === "gallery" || (b.kind === "group" && WIDE_GROUP_TYPES.has(b.type))
  );

  const isMinimal = theme.layout === "minimal";
  const isBanner = theme.layout === "banner";
  const useSplitLayout = hasWideContent || theme.layout === "split";

  function renderBlock(block: ReturnType<typeof buildSectionBlocks>[number], key: string) {
    if (block.kind === "field") {
      const field = block.field;
      if (field.fieldType === "website" && hasCompanySection) return null;
      if (field.fieldType === "google_maps_url") return null;
      if (field.fieldType === "business_hours") {
        const parsed = businessHoursValueSchema.safeParse(JSON.parse(field.value || "{}"));
        if (!parsed.success) return null;
        return <BusinessHoursCard key={key} hours={parsed.data} label={field.label} flat={isMinimal} />;
      }
      if (field.fieldType === "custom_html") {
        return <CustomHtmlBlock key={key} html={field.value} flat={isMinimal} />;
      }
      return (
        <CardFieldRow
          key={key}
          field={field as PublicCardField}
          mapUrl={field.fieldType === "address" ? mapUrl : undefined}
        />
      );
    }

    if (block.kind === "group") {
      switch (block.type) {
        case "company":
          return (
            <CompanySection
              key={key}
              company={parseCompanyGroup(block.items)}
              website={website}
              flat={isMinimal}
            />
          );
        case "social":
          return <SocialLinksRow key={key} links={parseSocialGroup(block.items)} />;
        case "service":
          return <ServicesSection key={key} services={parseServiceItems(block.items)} flat={isMinimal} />;
        case "testimonial":
          return (
            <TestimonialsSection key={key} testimonials={parseTestimonialItems(block.items)} flat={isMinimal} />
          );
        case "product":
          return <ProductsSection key={key} products={parseProductItems(block.items)} flat={isMinimal} />;
        case "faq":
          return <FaqSection key={key} items={parseFaqItems(block.items)} flat={isMinimal} />;
        case "button":
          return <ButtonsSection key={key} items={parseButtonItems(block.items)} />;
        default:
          return null;
      }
    }

    if (block.kind === "gallery") {
      return <CardGallery key={key} items={data.galleryItems} layout={data.settings.galleryLayout} />;
    }

    return null;
  }

  const mainBlocks = blocks.filter(
    (b) => !(b.kind === "gallery" || (b.kind === "group" && WIDE_GROUP_TYPES.has(b.type)))
  );
  const wideBlocks = blocks.filter(
    (b) => b.kind === "gallery" || (b.kind === "group" && WIDE_GROUP_TYPES.has(b.type))
  );

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
      </MotionSection>

      {mainBlocks.length > 0 && (
        <div className="flex w-full flex-col gap-2">
          {mainBlocks.map((block, i) => renderBlock(block, `main-${i}`))}
        </div>
      )}

      <QuickActionDock
        phone={phone}
        email={email}
        website={website}
        whatsappUrl={whatsappUrl}
        slug={data.slug}
      />
    </>
  );

  const contentBlock = <>{wideBlocks.map((block, i) => renderBlock(block, `wide-${i}`))}</>;

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
