export type CardSectionField = {
  id: string;
  fieldType: string;
  label: string;
  value: string;
  order: number;
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

export type ProductItem = {
  title: string;
  price?: number;
  currency: string;
  image: string;
  description: string;
  buyUrl: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type ButtonItem = {
  label: string;
  url: string;
  style: "primary" | "secondary" | "outline";
  icon: string;
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

/** Group types the builder renders as one draggable, multi-item section. */
export type BuilderGroupType = "service" | "testimonial" | "product" | "faq" | "button" | "social" | "company";

export type SectionBlock<F extends CardSectionField = CardSectionField> =
  | { kind: "field"; id: string; field: F }
  | { kind: "group"; id: string; type: BuilderGroupType; items: F[] }
  | { kind: "gallery" };

function safeParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function groupTypeFor(fieldType: string): BuilderGroupType | null {
  if (fieldType.startsWith("social_") || fieldType === "whatsapp") return "social";
  if (fieldType.startsWith("company_")) return "company";
  if (fieldType === "service" || fieldType === "testimonial" || fieldType === "product" || fieldType === "faq" || fieldType === "button") {
    return fieldType;
  }
  return null;
}

/**
 * Builds the ordered list of section blocks a card is composed of, preserving
 * the user's true drag-drop order across heterogeneous section types
 * (previously Services/Testimonials/Gallery always rendered last regardless
 * of CardField.order — this fixes that). Contiguous runs of the same
 * repeatable group type (service/testimonial/product/faq/button/social/company)
 * are coalesced into one draggable group block. `gallerySectionOrder` shares
 * the same integer order-space as CardField.order, so the gallery block is
 * spliced in at its correct relative position.
 */
export function buildSectionBlocks<F extends CardSectionField = CardSectionField>(
  fields: F[],
  gallerySectionOrder: number
): SectionBlock<F>[] {
  type MergedItem =
    | { order: number; kind: "gallery" }
    | { order: number; kind: "real"; field: F };

  const merged: MergedItem[] = [
    ...fields.map((field) => ({ order: field.order, kind: "real" as const, field })),
    { order: gallerySectionOrder, kind: "gallery" as const },
  ].sort((a, b) => a.order - b.order);

  const blocks: SectionBlock<F>[] = [];
  let i = 0;
  while (i < merged.length) {
    const item = merged[i];
    if (item.kind === "gallery") {
      blocks.push({ kind: "gallery" });
      i++;
      continue;
    }

    const gType = groupTypeFor(item.field.fieldType);
    if (gType) {
      const items: F[] = [];
      while (i < merged.length) {
        const next = merged[i];
        if (next.kind !== "real" || groupTypeFor(next.field.fieldType) !== gType) break;
        items.push(next.field);
        i++;
      }
      blocks.push({ kind: "group", id: items[0].id, type: gType, items });
    } else {
      blocks.push({ kind: "field", id: item.field.id, field: item.field });
      i++;
    }
  }

  return blocks;
}

export function parseServiceItems(items: CardSectionField[]): ServiceItem[] {
  return items
    .map((field) => {
      const parsed = safeParse<Omit<ServiceItem, "title">>(field.value);
      return parsed ? { title: field.label, ...parsed } : null;
    })
    .filter((v): v is ServiceItem => v !== null);
}

export function parseTestimonialItems(items: CardSectionField[]): TestimonialItem[] {
  return items
    .map((field) => {
      const parsed = safeParse<Omit<TestimonialItem, "client_name">>(field.value);
      return parsed ? { client_name: field.label, ...parsed } : null;
    })
    .filter((v): v is TestimonialItem => v !== null);
}

export function parseProductItems(items: CardSectionField[]): ProductItem[] {
  return items
    .map((field) => {
      const parsed = safeParse<Omit<ProductItem, "title">>(field.value);
      return parsed ? { title: field.label, ...parsed } : null;
    })
    .filter((v): v is ProductItem => v !== null);
}

export function parseFaqItems(items: CardSectionField[]): FaqItem[] {
  return items
    .map((field) => {
      const parsed = safeParse<{ answer: string }>(field.value);
      return parsed ? { question: field.label, answer: parsed.answer } : null;
    })
    .filter((v): v is FaqItem => v !== null);
}

export function parseButtonItems(items: CardSectionField[]): ButtonItem[] {
  return items
    .map((field) => {
      const parsed = safeParse<Omit<ButtonItem, "label">>(field.value);
      return parsed ? { label: field.label, ...parsed } : null;
    })
    .filter((v): v is ButtonItem => v !== null);
}

export function parseCompanyGroup(items: CardSectionField[]): CompanyInfo {
  const company: CompanyInfo = {};
  for (const field of items) {
    const key = field.fieldType.replace("company_", "") as keyof CompanyInfo;
    company[key] = field.value;
  }
  return company;
}

export function parseSocialGroup(items: CardSectionField[]): SocialLink[] {
  return items.map((field) => ({
    platform: field.fieldType.startsWith("social_") ? field.fieldType.replace("social_", "") : "whatsapp",
    url: field.value,
  }));
}

/**
 * Inverse of buildSectionBlocks: flattens a (possibly just-reordered) block
 * list back into consecutive integer order values shared across CardField.order
 * and CardSettings.gallerySectionOrder. Recomputing from scratch (rather than
 * patching individual positions) guarantees items within a group stay
 * contiguous and the gallery sits at the right relative position.
 */
export function flattenBlocksToOrder(blocks: SectionBlock<CardSectionField>[]): {
  fieldOrder: { id: string; order: number }[];
  gallerySectionOrder: number;
} {
  const fieldOrder: { id: string; order: number }[] = [];
  let gallerySectionOrder = blocks.length;
  let pos = 0;

  for (const block of blocks) {
    if (block.kind === "field") {
      fieldOrder.push({ id: block.field.id, order: pos });
      pos++;
    } else if (block.kind === "group") {
      for (const item of block.items) {
        fieldOrder.push({ id: item.id, order: pos });
        pos++;
      }
    } else {
      gallerySectionOrder = pos;
      pos++;
    }
  }

  return { fieldOrder, gallerySectionOrder };
}
