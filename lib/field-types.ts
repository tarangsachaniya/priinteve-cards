import {
  AlignLeft,
  AtSign,
  Briefcase,
  Building2,
  Clock,
  Code2,
  FileText,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Mail,
  MapPin,
  MessageCircle,
  MousePointerClick,
  Phone,
  Quote,
  ShoppingBag,
  Sparkles,
  Type as TypeIcon,
  type LucideIcon,
} from "lucide-react";

export const FIELD_TYPE_META: Record<string, { icon: LucideIcon; label: string }> = {
  text: { icon: TypeIcon, label: "Text" },
  bio: { icon: AlignLeft, label: "About" },
  phone: { icon: Phone, label: "Phone" },
  email: { icon: Mail, label: "Email" },
  website: { icon: Globe, label: "Website" },
  address: { icon: MapPin, label: "Address" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp" },
  file: { icon: FileText, label: "File/PDF" },
  photo: { icon: ImageIcon, label: "Photo" },
  social_instagram: { icon: AtSign, label: "Instagram" },
  social_linkedin: { icon: AtSign, label: "LinkedIn" },
  social_twitter: { icon: AtSign, label: "Twitter" },
  social_facebook: { icon: AtSign, label: "Facebook" },
  social_youtube: { icon: AtSign, label: "YouTube" },
  designation: { icon: Briefcase, label: "Designation" },
  company_name: { icon: Building2, label: "Company Name" },
  company_tagline: { icon: Sparkles, label: "Tagline" },
  company_description: { icon: AlignLeft, label: "About the Company" },
  google_maps_url: { icon: MapPin, label: "Google Maps Link" },
  service: { icon: Briefcase, label: "Services" },
  testimonial: { icon: Quote, label: "Testimonials" },
  product: { icon: ShoppingBag, label: "Products" },
  faq: { icon: HelpCircle, label: "FAQ" },
  button: { icon: MousePointerClick, label: "Buttons" },
  business_hours: { icon: Clock, label: "Business Hours" },
  custom_html: { icon: Code2, label: "Custom HTML" },
  gallery: { icon: ImageIcon, label: "Gallery" },
};

export const SOCIAL_PLATFORMS = [
  { fieldType: "social_instagram", label: "Instagram" },
  { fieldType: "social_linkedin", label: "LinkedIn" },
  { fieldType: "social_twitter", label: "Twitter" },
  { fieldType: "social_facebook", label: "Facebook" },
  { fieldType: "social_youtube", label: "YouTube" },
];

/** Section types offered in the builder's "+ Add section" menu, in menu order. */
export const INSERTABLE_SECTION_TYPES = [
  "company_name",
  "designation",
  "bio",
  "phone",
  "email",
  "website",
  "whatsapp",
  "address",
  "google_maps_url",
  "social_instagram",
  "business_hours",
  "button",
  "product",
  "service",
  "testimonial",
  "faq",
  "text",
  "file",
  "custom_html",
] as const;

export function getFieldTypeMeta(fieldType: string) {
  return FIELD_TYPE_META[fieldType] ?? { icon: TypeIcon, label: fieldType };
}

export { Sparkles as SocialGroupIcon };
