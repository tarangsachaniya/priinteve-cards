"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";

import { WizardStepper } from "@/components/wizard/wizard-stepper";
import { Step1ProfileFields } from "@/components/wizard/step-1-profile-fields";
import { Step2ThemeBrand } from "@/components/wizard/step-2-theme-brand";
import { Step3Gallery } from "@/components/wizard/step-3-gallery";
import { Step4SaveContact } from "@/components/wizard/step-4-save-contact";
import { Step5PreviewPurchase } from "@/components/wizard/step-5-preview-purchase";
import { CardPreviewPanel } from "@/components/card/card-preview-panel";
import type { WizardField } from "@/components/wizard/field-instance-row";
import type { WizardGalleryItem } from "@/components/wizard/gallery-item-list";
import { normalizeCardMode, type CardMode } from "@/lib/card-theme";

export type SetupWizardProps = {
  name: string;
  slug: string;
  initialCompany: string | null;
  initialStep: number;
  initialCardFields: WizardField[];
  initialGalleryItems: WizardGalleryItem[];
  initialThemeId: string;
  initialThemeMode: string;
  initialBrandColor: string;
  initialHeadingFont: string;
  initialBodyFont: string;
  initialGalleryLayout: string;
  initialVcfIncludePhoto: boolean;
};

export function SetupWizard({
  name,
  slug: initialSlug,
  initialCompany,
  initialStep,
  initialCardFields,
  initialGalleryItems,
  initialThemeId,
  initialThemeMode,
  initialBrandColor,
  initialHeadingFont,
  initialBodyFont,
  initialGalleryLayout,
  initialVcfIncludePhoto,
}: SetupWizardProps) {
  const [profileName, setProfileName] = useState(name);
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), 5));
  const [slug, setSlug] = useState(initialSlug);
  const [cardFields, setCardFields] = useState<WizardField[]>(initialCardFields);
  const [galleryItems, setGalleryItems] = useState<WizardGalleryItem[]>(initialGalleryItems);
  const [themeId, setThemeId] = useState(initialThemeId);
  const [themeMode, setThemeMode] = useState<CardMode>(normalizeCardMode(initialThemeMode));
  const [brandColor, setBrandColor] = useState(initialBrandColor);
  const [headingFont, setHeadingFont] = useState(initialHeadingFont);
  const [bodyFont, setBodyFont] = useState(initialBodyFont);
  const [galleryLayout, setGalleryLayout] = useState(initialGalleryLayout);
  const [vcfIncludePhoto, setVcfIncludePhoto] = useState(initialVcfIncludePhoto);

  const previewData = {
    name: profileName,
    slug,
    fields: cardFields.map((f) => ({ ...f, order: 0, isVisible: true })),
    galleryItems: galleryItems.map((item) => ({ type: item.type, url: item.url, order: item.order })),
    settings: { themeId, themeMode, brandColor, galleryLayout, vcfIncludePhoto, headingFont, bodyFont },
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 p-4 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="flex flex-col gap-6">
        <WizardStepper currentStep={step} />

        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Back
          </button>
        )}

        {step === 1 && (
          <Step1ProfileFields
            initialFields={cardFields}
            initialCompany={initialCompany}
            initialName={name}
            onSaved={(fields, nextSlug, _company, nextName) => {
              setCardFields(fields);
              if (nextSlug) setSlug(nextSlug);
              if (nextName) setProfileName(nextName);
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <Step3Gallery
            initialItems={galleryItems}
            initialGalleryLayout={galleryLayout}
            onSaved={(items, layout) => {
              setGalleryItems(items);
              setGalleryLayout(layout);
              setStep(3);
            }}
          />
        )}

        {step === 3 && (
          <Step2ThemeBrand
            themeId={themeId}
            themeMode={themeMode}
            onThemeModeChange={setThemeMode}
            onThemeIdChange={setThemeId}
            brandColor={brandColor}
            onBrandColorChange={setBrandColor}
            headingFont={headingFont}
            onHeadingFontChange={setHeadingFont}
            bodyFont={bodyFont}
            onBodyFontChange={setBodyFont}
            onSaved={() => setStep(4)}
          />
        )}

        {step === 4 && (
          <Step4SaveContact
            name={profileName}
            fields={cardFields}
            initialVcfIncludePhoto={vcfIncludePhoto}
            onSaved={(includePhoto) => {
              setVcfIncludePhoto(includePhoto);
              setStep(5);
            }}
          />
        )}

        {step === 5 && <Step5PreviewPurchase />}
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-8">
        <CardPreviewPanel data={previewData} />

        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Your QR code</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/qr/${slug}/png`}
            alt="Card QR code"
            width={140}
            height={140}
            className="rounded-xl border border-border p-2"
          />
          <p className="text-center text-xs text-muted-foreground">
            Scans straight to your card, even before you publish.
          </p>
        </div>
      </div>
    </div>
  );
}
