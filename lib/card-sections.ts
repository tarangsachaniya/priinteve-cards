export type CardSectionField = {
  fieldType: string;
  label: string;
  value: string;
};

export type ServiceItem = {
  title: string;
  slug: string;
  short_description: string;
  icon: string;
  image: string;
};

export type TestimonialItem = {
  client_name: string;
  company: string;
  designation: string;
  rating: number;
  review: string;
};

export type CompanyInfo = {
  name?: string;
  tagline?: string;
  description?: string;
  logo?: string;
};

export type SocialLink = {
  platform: string;
  url: string;
};

export type GroupedCardFields = {
  designation: string | null;
  company: CompanyInfo | null;
  services: ServiceItem[];
  testimonials: TestimonialItem[];
  socialLinks: SocialLink[];
  mapUrl: string | null;
  rows: CardSectionField[];
};

function safeParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function groupCardFields(fields: CardSectionField[]): GroupedCardFields {
  const grouped: GroupedCardFields = {
    designation: null,
    company: null,
    services: [],
    testimonials: [],
    socialLinks: [],
    mapUrl: null,
    rows: [],
  };

  for (const field of fields) {
    if (field.fieldType === "designation") {
      grouped.designation = field.value;
      continue;
    }

    if (field.fieldType.startsWith("company_")) {
      grouped.company ??= {};
      const key = field.fieldType.replace("company_", "") as keyof CompanyInfo;
      grouped.company[key] = field.value;
      continue;
    }

    if (field.fieldType === "service") {
      const parsed = safeParse<Omit<ServiceItem, "title">>(field.value);
      if (parsed) {
        grouped.services.push({ title: field.label, ...parsed });
      }
      continue;
    }

    if (field.fieldType === "testimonial") {
      const parsed = safeParse<Omit<TestimonialItem, "client_name">>(field.value);
      if (parsed) {
        grouped.testimonials.push({ client_name: field.label, ...parsed });
      }
      continue;
    }

    if (field.fieldType === "google_maps_url") {
      grouped.mapUrl = field.value;
      continue;
    }

    if (field.fieldType.startsWith("social_") || field.fieldType === "whatsapp") {
      const platform = field.fieldType.startsWith("social_")
        ? field.fieldType.replace("social_", "")
        : "whatsapp";
      grouped.socialLinks.push({ platform, url: field.value });
      continue;
    }

    grouped.rows.push(field);
  }

  return grouped;
}
