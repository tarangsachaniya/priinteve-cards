import { z } from "zod";

export const planSchema = z.object({
  name: z.string().min(1).max(80),
  cardType: z.enum(["NFC", "QR", "BOTH"]),
  price: z.coerce.number().int().nonnegative(),
  validityDays: z.coerce.number().int().positive(),
  featuresJson: z.array(z.string().min(1)),
  maxGalleryImages: z.coerce.number().int().nonnegative(),
  isActive: z.boolean(),
});

export const planUpdateSchema = planSchema.partial();

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

export const createUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
  planId: z.string().optional(),
  planExpiresAt: z.coerce.date().optional(),
});

export type PlanInput = z.infer<typeof planSchema>;
export type PlanUpdateInput = z.infer<typeof planUpdateSchema>;
export type ConfigInput = z.infer<typeof configSchema>;
export type EmailConfigInput = z.infer<typeof emailConfigSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
