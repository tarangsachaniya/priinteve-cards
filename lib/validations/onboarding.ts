import { z } from "zod";

import { THEME_PRESET_IDS } from "@/lib/theme-presets";

export const cardFieldTypeEnum = z.enum([
  "text",
  "bio",
  "phone",
  "email",
  "website",
  "address",
  "whatsapp",
  "file",
  "photo",
  "social_instagram",
  "social_linkedin",
  "social_twitter",
  "social_facebook",
  "social_youtube",
  "designation",
  "company_name",
  "company_tagline",
  "company_description",
  "google_maps_url",
  "service",
  "testimonial",
  "product",
  "faq",
  "button",
  "business_hours",
  "custom_html",
]);

export const cardFieldInputSchema = z.object({
  fieldType: cardFieldTypeEnum,
  label: z.string().min(1).max(80),
  value: z.string().max(20000),
});

export const saveProfileFieldsSchema = z.object({
  fields: z.array(cardFieldInputSchema).max(30),
  company: z.string().max(120).optional(),
});

export const cardFieldUpdateSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().max(20000),
});

export const cardFieldVisibilitySchema = z.object({
  isVisible: z.boolean(),
});

export const cardFieldReorderSchema = z.object({
  order: z
    .array(
      z.object({
        id: z.string().min(1),
        order: z.number().int().min(0),
      })
    )
    .min(1),
});

export const saveThemeSchema = z.object({
  themeId: z.enum(THEME_PRESET_IDS),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color like #1A2B3C"),
});

export const galleryLayoutEnum = z.enum(["carousel", "grid", "masonry", "lightbox"]);

export const saveGalleryLayoutSchema = z.object({
  galleryLayout: galleryLayoutEnum,
});

export const galleryReorderSchema = z.object({
  order: z
    .array(
      z.object({
        id: z.string().min(1),
        order: z.number().int().min(0),
      })
    )
    .min(1),
});

export const saveYoutubeItemSchema = z.object({
  url: z.string().url(),
});

export const galleryItemUpdateSchema = z.object({
  caption: z.string().max(200).optional(),
  altText: z.string().max(200).optional(),
});

export const gallerySectionOrderSchema = z.object({
  gallerySectionOrder: z.number().int().min(0),
});

export const cardBuilderReorderSchema = z.object({
  fieldOrder: z
    .array(
      z.object({
        id: z.string().min(1),
        order: z.number().int().min(0),
      })
    )
    .min(0),
  gallerySectionOrder: z.number().int().min(0),
});

export const saveVcfSettingsSchema = z.object({
  vcfIncludePhoto: z.boolean(),
});

export type CardFieldInput = z.infer<typeof cardFieldInputSchema>;
export type SaveProfileFieldsInput = z.infer<typeof saveProfileFieldsSchema>;
export type CardFieldUpdateInput = z.infer<typeof cardFieldUpdateSchema>;
export type CardFieldVisibilityInput = z.infer<typeof cardFieldVisibilitySchema>;
export type CardFieldReorderInput = z.infer<typeof cardFieldReorderSchema>;
export type SaveThemeInput = z.infer<typeof saveThemeSchema>;
export type SaveGalleryLayoutInput = z.infer<typeof saveGalleryLayoutSchema>;
export type GalleryReorderInput = z.infer<typeof galleryReorderSchema>;
export type SaveYoutubeItemInput = z.infer<typeof saveYoutubeItemSchema>;
export type GalleryItemUpdateInput = z.infer<typeof galleryItemUpdateSchema>;
export type GallerySectionOrderInput = z.infer<typeof gallerySectionOrderSchema>;
export type CardBuilderReorderInput = z.infer<typeof cardBuilderReorderSchema>;
export type SaveVcfSettingsInput = z.infer<typeof saveVcfSettingsSchema>;
