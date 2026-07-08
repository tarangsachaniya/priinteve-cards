"use client";

import { useState } from "react";

import { WizardStepper } from "@/components/wizard/wizard-stepper";
import { Step1ProfileFields } from "@/components/wizard/step-1-profile-fields";
import { Step2ThemeBrand } from "@/components/wizard/step-2-theme-brand";
import { Step3Gallery } from "@/components/wizard/step-3-gallery";
import { Step4SaveContact } from "@/components/wizard/step-4-save-contact";
import { Step5PreviewPurchase } from "@/components/wizard/step-5-preview-purchase";
import type { WizardField } from "@/components/wizard/field-instance-row";
import type { WizardGalleryItem } from "@/components/wizard/gallery-item-list";

export type SetupWizardProps = {
  name: string;
  slug: string;
  initialStep: number;
  initialCardFields: WizardField[];
  initialGalleryItems: WizardGalleryItem[];
  initialThemeId: string;
  initialBrandColor: string;
  initialGalleryLayout: string;
  initialVcfIncludePhoto: boolean;
};

export function SetupWizard({
  name,
  slug,
  initialStep,
  initialCardFields,
  initialGalleryItems,
  initialThemeId,
  initialBrandColor,
  initialGalleryLayout,
  initialVcfIncludePhoto,
}: SetupWizardProps) {
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), 5));
  const [cardFields, setCardFields] = useState<WizardField[]>(initialCardFields);
  const [galleryItems, setGalleryItems] = useState<WizardGalleryItem[]>(initialGalleryItems);
  const [themeId, setThemeId] = useState(initialThemeId);
  const [brandColor, setBrandColor] = useState(initialBrandColor);
  const [galleryLayout, setGalleryLayout] = useState(initialGalleryLayout);
  const [vcfIncludePhoto, setVcfIncludePhoto] = useState(initialVcfIncludePhoto);

  const previewBase = {
    name,
    slug,
    fields: cardFields.map((f) => ({ ...f, order: 0, isVisible: true })),
    galleryItems: galleryItems.map((item) => ({ type: item.type, url: item.url, order: item.order })),
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <WizardStepper currentStep={step} />

      {step > 1 && (
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="self-start text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>
      )}

      {step === 1 && (
        <Step1ProfileFields
          initialFields={cardFields}
          onSaved={(fields) => {
            setCardFields(fields);
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <Step2ThemeBrand
          initialThemeId={themeId}
          initialBrandColor={brandColor}
          previewBase={previewBase}
          onSaved={(nextThemeId, nextBrandColor) => {
            setThemeId(nextThemeId);
            setBrandColor(nextBrandColor);
            setStep(3);
          }}
        />
      )}

      {step === 3 && (
        <Step3Gallery
          initialItems={galleryItems}
          initialGalleryLayout={galleryLayout}
          onSaved={(items, layout) => {
            setGalleryItems(items);
            setGalleryLayout(layout);
            setStep(4);
          }}
        />
      )}

      {step === 4 && (
        <Step4SaveContact
          name={name}
          fields={cardFields}
          initialVcfIncludePhoto={vcfIncludePhoto}
          onSaved={(includePhoto) => {
            setVcfIncludePhoto(includePhoto);
            setStep(5);
          }}
        />
      )}

      {step === 5 && (
        <Step5PreviewPurchase
          data={{
            ...previewBase,
            settings: { themeId, brandColor, galleryLayout, vcfIncludePhoto },
          }}
        />
      )}
    </div>
  );
}
