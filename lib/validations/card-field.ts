import { z } from "zod";

/**
 * Structured section types store their payload as JSON.stringify(...) inside
 * CardField.value (label holds the "title" for the item). This mirrors the
 * pattern already proven in production by the `service`/`testimonial` types.
 */

export const serviceValueSchema = z.object({
  slug: z.string().max(80).optional().default(""),
  short_description: z.string().max(400).optional().default(""),
  icon: z.string().max(80).optional().default(""),
  image: z.string().max(1000).optional().default(""),
});

export const testimonialValueSchema = z.object({
  company: z.string().max(120).optional().default(""),
  designation: z.string().max(120).optional().default(""),
  rating: z.number().int().min(1).max(5).default(5),
  review: z.string().max(1000).optional().default(""),
});

export const productValueSchema = z.object({
  price: z.number().min(0).optional(),
  currency: z.string().max(8).optional().default("INR"),
  image: z.string().max(1000).optional().default(""),
  description: z.string().max(1000).optional().default(""),
  buyUrl: z.string().max(1000).optional().default(""),
});

export const faqValueSchema = z.object({
  answer: z.string().max(2000).default(""),
});

export const buttonValueSchema = z.object({
  url: z.string().max(1000).default(""),
  style: z.enum(["primary", "secondary", "outline"]).default("primary"),
  icon: z.string().max(80).optional().default(""),
});

const dayHoursSchema = z.object({
  closed: z.boolean().default(false),
  open: z.string().max(8).optional().default("09:00"),
  close: z.string().max(8).optional().default("18:00"),
});

export const businessHoursValueSchema = z.object({
  mon: dayHoursSchema,
  tue: dayHoursSchema,
  wed: dayHoursSchema,
  thu: dayHoursSchema,
  fri: dayHoursSchema,
  sat: dayHoursSchema,
  sun: dayHoursSchema,
});

export const customHtmlValueSchema = z.string().max(20000);

export type ServiceValue = z.infer<typeof serviceValueSchema>;
export type TestimonialValue = z.infer<typeof testimonialValueSchema>;
export type ProductValue = z.infer<typeof productValueSchema>;
export type FaqValue = z.infer<typeof faqValueSchema>;
export type ButtonValue = z.infer<typeof buttonValueSchema>;
export type BusinessHoursValue = z.infer<typeof businessHoursValueSchema>;

export const DEFAULT_BUSINESS_HOURS: BusinessHoursValue = {
  mon: { closed: false, open: "09:00", close: "18:00" },
  tue: { closed: false, open: "09:00", close: "18:00" },
  wed: { closed: false, open: "09:00", close: "18:00" },
  thu: { closed: false, open: "09:00", close: "18:00" },
  fri: { closed: false, open: "09:00", close: "18:00" },
  sat: { closed: true, open: "09:00", close: "18:00" },
  sun: { closed: true, open: "09:00", close: "18:00" },
};

/** Structured (JSON-value) field types that render as repeatable "group" sections. */
export const GROUP_FIELD_TYPES = ["service", "testimonial", "product", "faq", "button"] as const;
export type GroupFieldType = (typeof GROUP_FIELD_TYPES)[number];

export function isGroupFieldType(fieldType: string): fieldType is GroupFieldType {
  return (GROUP_FIELD_TYPES as readonly string[]).includes(fieldType);
}

const VALUE_SCHEMA_BY_TYPE: Partial<Record<GroupFieldType, z.ZodTypeAny>> = {
  service: serviceValueSchema,
  testimonial: testimonialValueSchema,
  product: productValueSchema,
  faq: faqValueSchema,
  button: buttonValueSchema,
};

/**
 * Validates + normalizes a structured field's JSON value string server-side.
 * Returns the re-serialized (schema-defaulted) string, or throws on invalid JSON/shape.
 */
export function parseAndValidateStructuredValue(fieldType: string, rawValue: string): string {
  if (fieldType === "business_hours") {
    const parsed = businessHoursValueSchema.parse(JSON.parse(rawValue));
    return JSON.stringify(parsed);
  }
  if (fieldType === "custom_html") {
    return customHtmlValueSchema.parse(rawValue);
  }
  if (isGroupFieldType(fieldType)) {
    const schema = VALUE_SCHEMA_BY_TYPE[fieldType];
    if (!schema) return rawValue;
    const parsed = schema.parse(JSON.parse(rawValue));
    return JSON.stringify(parsed);
  }
  return rawValue;
}

export const STRUCTURED_FIELD_TYPES = new Set<string>([
  ...GROUP_FIELD_TYPES,
  "business_hours",
  "custom_html",
]);
