import { z } from "zod";

export const planSchema = z.object({
  name: z.string().min(1).max(80),
  cardType: z.enum(["NFC", "QR", "BOTH"]),
  price: z.coerce.number().int().nonnegative(),
  validityDays: z.coerce.number().int().positive(),
  featuresJson: z.array(z.string().min(1)),
  maxGalleryImages: z.coerce.number().int().nonnegative(),
  maxVideos: z.coerce.number().int().nonnegative().default(0),
  maxPdfs: z.coerce.number().int().nonnegative().default(0),
  storageLimitMb: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean(),
  isDraft: z.boolean().default(false),
  recommended: z.boolean().default(false),
});

export const planUpdateSchema = planSchema.partial();

export const planCreateRequestSchema = planSchema.extend({
  duplicateOf: z.string().optional(),
});

export const configSchema = z.object({
  pointsPerReferral: z.coerce.number().int().nonnegative(),
  conversionRate: z.coerce.number().int().positive(),
  minimumRedemption: z.coerce.number().int().nonnegative(),
});

export const emailConfigSchema = z.object({
  expiryReminders: z.array(
    z.object({
      daysBeforeExpiry: z.coerce.number().int().positive(),
    })
  ),
});

export const siteContentSchema = z.record(z.string(), z.string());

export const homepageAccentSchema = z.enum([
  "emerald",
  "blue",
  "violet",
  "amber",
  "rose",
  "slate",
]);

export const homepageLogoSchema = z.object({
  name: z.string().min(1).max(60),
  logoUrl: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().url().optional()
  ),
});

export const homepageTemplateSchema = z.object({
  industry: z.string().min(1).max(60),
  description: z.string().min(1).max(200),
  accent: homepageAccentSchema,
});

export const homepageTestimonialSchema = z.object({
  name: z.string().min(1).max(80),
  role: z.string().min(1).max(120),
  quote: z.string().min(1).max(500),
  rating: z.coerce.number().int().min(1).max(5),
});

export const homepageFeatureIconSchema = z.enum([
  "zap",
  "user-circle",
  "target",
  "bar-chart-3",
  "users",
]);

export const homepageFeatureSchema = z.object({
  icon: homepageFeatureIconSchema,
  label: z.string().min(1).max(40),
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(200),
  bullets: z.string().min(1).max(500),
});

export const homepageComparisonRowSchema = z.object({
  label: z.string().min(1).max(80),
});

export const LIST_SECTION_SCHEMAS = {
  homepage_logos: homepageLogoSchema,
  homepage_templates: homepageTemplateSchema,
  homepage_testimonials: homepageTestimonialSchema,
  homepage_features: homepageFeatureSchema,
  homepage_comparison: homepageComparisonRowSchema,
} as const;

export type HomepageAccent = z.infer<typeof homepageAccentSchema>;
export type HomepageLogoInput = z.infer<typeof homepageLogoSchema>;
export type HomepageTemplateInput = z.infer<typeof homepageTemplateSchema>;
export type HomepageTestimonialInput = z.infer<typeof homepageTestimonialSchema>;
export type HomepageFeatureIcon = z.infer<typeof homepageFeatureIconSchema>;
export type HomepageFeatureInput = z.infer<typeof homepageFeatureSchema>;
export type HomepageComparisonRowInput = z.infer<typeof homepageComparisonRowSchema>;

export const createUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  company: z.string().max(120).optional(),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
  planId: z.string().optional(),
  planExpiresAt: z.coerce.date().optional(),
});

export type PlanInput = z.infer<typeof planSchema>;
export type PlanUpdateInput = z.infer<typeof planUpdateSchema>;
export type ConfigInput = z.infer<typeof configSchema>;
export type EmailConfigInput = z.infer<typeof emailConfigSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
