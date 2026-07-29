"use client";

import { ThemeCard } from "@/components/card/theme-card";
import type { CardSectionField } from "@/lib/card-sections";
import type { PublicGalleryItem } from "@/components/card/card-gallery";

export type PublicCardSettings = { themeId: string; brandColor: string; galleryLayout: string };
export type PublicCardData = {
  name: string; slug: string; photoUrl: string | null; fields: CardSectionField[];
  galleryItems: PublicGalleryItem[]; settings: PublicCardSettings; gallerySectionOrder?: number;
};

/** Shared with setup and builder previews to guarantee the live card matches its editor. */
export function PublicCard({ data }: { data: PublicCardData }) {
  return <ThemeCard data={{
    name: data.name, slug: data.slug,
    fields: data.photoUrl ? [{ fieldType: "photo", label: "Photo", value: data.photoUrl, order: -1 }, ...data.fields] : data.fields,
    galleryItems: data.galleryItems,
    settings: data.settings,
  }} />;
}
