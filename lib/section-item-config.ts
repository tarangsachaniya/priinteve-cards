import type { GroupFieldType } from "@/lib/validations/card-field";

export type ItemFieldConfig =
  | { key: string; label: string; kind: "text"; placeholder?: string }
  | { key: string; label: string; kind: "textarea"; placeholder?: string }
  | { key: string; label: string; kind: "number"; placeholder?: string }
  | { key: string; label: string; kind: "url"; placeholder?: string }
  | { key: string; label: string; kind: "select"; options: { value: string; label: string }[] }
  | { key: string; label: string; kind: "rating" };

export type GroupTypeConfig = {
  titleLabel: string;
  titlePlaceholder: string;
  addLabel: string;
  emptyLabel: string;
  defaultValue: Record<string, unknown>;
  fields: ItemFieldConfig[];
};

export const GROUP_TYPE_CONFIG: Record<GroupFieldType, GroupTypeConfig> = {
  service: {
    titleLabel: "Service name",
    titlePlaceholder: "Web Design",
    addLabel: "Add service",
    emptyLabel: "No services yet.",
    defaultValue: { short_description: "", icon: "Sparkles", image: "" },
    fields: [
      { key: "short_description", label: "Short description", kind: "textarea", placeholder: "One or two lines about this service" },
      { key: "icon", label: "Icon (lucide name)", kind: "text", placeholder: "e.g. Sparkles" },
      { key: "image", label: "Image URL", kind: "url", placeholder: "https://…" },
    ],
  },
  testimonial: {
    titleLabel: "Client name",
    titlePlaceholder: "Jane Doe",
    addLabel: "Add testimonial",
    emptyLabel: "No testimonials yet.",
    defaultValue: { company: "", designation: "", rating: 5, review: "" },
    fields: [
      { key: "review", label: "Review", kind: "textarea", placeholder: "What did they say?" },
      { key: "rating", label: "Rating", kind: "rating" },
      { key: "designation", label: "Designation", kind: "text", placeholder: "CEO" },
      { key: "company", label: "Company", kind: "text", placeholder: "Acme Inc." },
    ],
  },
  product: {
    titleLabel: "Product name",
    titlePlaceholder: "Starter Kit",
    addLabel: "Add product",
    emptyLabel: "No products yet.",
    defaultValue: { price: undefined, currency: "INR", image: "", description: "", buyUrl: "" },
    fields: [
      { key: "description", label: "Description", kind: "textarea", placeholder: "What's included" },
      { key: "price", label: "Price", kind: "number", placeholder: "999" },
      { key: "currency", label: "Currency", kind: "text", placeholder: "INR" },
      { key: "image", label: "Image URL", kind: "url", placeholder: "https://…" },
      { key: "buyUrl", label: "Buy link", kind: "url", placeholder: "https://…" },
    ],
  },
  faq: {
    titleLabel: "Question",
    titlePlaceholder: "Do you offer refunds?",
    addLabel: "Add question",
    emptyLabel: "No questions yet.",
    defaultValue: { answer: "" },
    fields: [{ key: "answer", label: "Answer", kind: "textarea", placeholder: "Your answer" }],
  },
  button: {
    titleLabel: "Button text",
    titlePlaceholder: "Book a call",
    addLabel: "Add button",
    emptyLabel: "No buttons yet.",
    defaultValue: { url: "", style: "primary", icon: "" },
    fields: [
      { key: "url", label: "Link URL", kind: "url", placeholder: "https://…" },
      {
        key: "style",
        label: "Style",
        kind: "select",
        options: [
          { value: "primary", label: "Primary" },
          { value: "secondary", label: "Secondary" },
          { value: "outline", label: "Outline" },
        ],
      },
      { key: "icon", label: "Icon (lucide name)", kind: "text", placeholder: "e.g. Phone" },
    ],
  },
};
