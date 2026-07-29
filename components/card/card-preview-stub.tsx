import { ThemeCard, type ThemeCardData } from "@/components/card/theme-card";
export type CardPreviewField = ThemeCardData["fields"][number];
export type CardPreviewGalleryItem = ThemeCardData["galleryItems"][number];
export type CardPreviewSettings = ThemeCardData["settings"] & { vcfIncludePhoto: boolean };
export type CardPreviewData = Omit<ThemeCardData, "settings"> & { settings: CardPreviewSettings };
export function CardPreviewStub({ data }: { data: CardPreviewData }) { return <ThemeCard data={data} />; }
